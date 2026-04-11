<script>
    import { onMount } from "svelte";
    import ObjectiveRow from "../../../planner/components/ObjectiveRow.svelte";
    import ScheduleTimeframeScroller from "./ScheduleTimeframeScroller.svelte";
    import * as repo from "../../../planner/objectiveRepository.js";
    import {
        createBlankObjective,
        normalizeObjective,
    } from "../../../planner/objectiveTypes.js";
    import {
        bucketForObjective,
        reconcileOverdueObjectives,
    } from "../../../planner/dueSemantics.js";
    import { TIMEFRAMES_DISPLAY } from "../../../planner/plannerUiLabels.js";
    import {
        applyObjectiveToKanbanColumn,
        kanbanColumnForObjective,
    } from "../../../planner/kanbanColumnMap.js";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    /** @type {import('../../../planner/objectiveTypes.js').Objective[]} */
    let objectives = [];
    let loading = false;
    let loadStarted = false;
    let banner = "";
    /** @type {import('../../../planner/objectiveTypes.js').Timeframe} */
    let selectedTf = TIMEFRAMES_DISPLAY[0];
    let dropBusy = "";
    /** @type {''|'backlog'|'todo'|'in_progress'|'done'} */
    let createBusyColumn = "";

    const KANBAN_COLUMNS = /** @type {const} */ ([
        { id: "backlog", title: "Backlog" },
        { id: "todo", title: "To Do" },
        { id: "in_progress", title: "In Progress" },
        { id: "done", title: "Done" },
    ]);

    $: qFilter =
        debouncedQuery.trim().toLowerCase() || query.trim().toLowerCase();

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void reload().then(() => runReconcile());
    }

    async function reload() {
        loading = true;
        banner = "";
        try {
            objectives = await repo.listObjectives();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Load failed");
        } finally {
            loading = false;
        }
    }

    async function runReconcile() {
        if (!loadStarted) return;
        try {
            const list = await repo.listObjectives();
            const demoted = reconcileOverdueObjectives(list);
            if (demoted.length) {
                await repo.saveObjectivesMany(
                    demoted.map((o) => normalizeObjective(o)),
                );
            }
        } catch {
            /* ignore */
        }
        await reload();
    }

    /** @param {unknown} message */
    function onPlannerMessage(message) {
        if (!loadStarted) return;
        if (message?.type === "PLANNER_RECONCILE") {
            void runReconcile();
        } else if (message?.type === "PLANNER_OBJECTIVES_CHANGED") {
            void reload();
        }
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} columnId
     */
    function itemsForColumn(columnId) {
        return objectives
            .filter((o) => {
                if (!qFilter) return true;
                return (o.title || "").toLowerCase().includes(qFilter);
            })
            .filter(
                (o) =>
                    o.timeframe === selectedTf &&
                    kanbanColumnForObjective(o, selectedTf) === columnId,
            )
            .sort((a, b) => a.created - b.created);
    }

    /** @param {DragEvent} e */
    function dragOverColumn(e) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} targetColumn
     */
    function makeDrop(targetColumn) {
        return async (e) => {
            e.preventDefault();
            const raw = e.dataTransfer?.getData(
                "application/x-swift-tabs-objective",
            );
            if (!raw) return;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch {
                return;
            }
            const id = parsed.id;
            const o = objectives.find((x) => x.id === id);
            if (!o) return;

            dropBusy = id;
            banner = "";
            try {
                const updated = applyObjectiveToKanbanColumn(
                    o,
                    selectedTf,
                    targetColumn,
                );
                await repo.saveObjective(updated);
                if (
                    typeof chrome !== "undefined" &&
                    chrome.runtime?.sendMessage
                ) {
                    chrome.runtime
                        .sendMessage({ type: "PLANNER_OBJECTIVES_CHANGED" })
                        .catch(() => {});
                }
                await reload();
            } catch (err) {
                banner =
                    err instanceof Error
                        ? err.message
                        : String(err ?? "Save failed");
            } finally {
                dropBusy = "";
            }
        };
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} columnId
     */
    async function handleCreateInColumn(columnId) {
        if (!loadStarted || createBusyColumn) return;
        createBusyColumn = columnId;
        banner = "";
        try {
            let o = createBlankObjective({
                timeframe: selectedTf,
                type: "goal",
                title: "New objective",
            });
            o = applyObjectiveToKanbanColumn(o, selectedTf, columnId);
            await repo.saveObjective(o);
            if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
                chrome.runtime
                    .sendMessage({ type: "PLANNER_OBJECTIVES_CHANGED" })
                    .catch(() => {});
            }
            await reload();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Create failed");
        } finally {
            createBusyColumn = "";
        }
    }

    onMount(() => {
        const onFocus = () => {
            if (loadStarted) void runReconcile();
        };
        window.addEventListener("focus", onFocus);
        if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
            chrome.runtime.onMessage.addListener(onPlannerMessage);
        }
        return () => {
            window.removeEventListener("focus", onFocus);
            if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
                chrome.runtime.onMessage.removeListener(onPlannerMessage);
            }
        };
    });
</script>

<section
    class="omnibox-schedule"
    class:omnibox-schedule--active-slide={isActiveSlide}
    style:--p-text="var(--st-text-primary, #f5f5f5)"
    style:--p-muted="var(--st-text-muted, #9ca3af)"
    style:--p-danger-text="#f87171"
    style:--p-accent="rgba(120, 170, 255, 0.9)"
>
    <ScheduleTimeframeScroller bind:value={selectedTf} />

    {#if banner}
        <div class="schedule-banner" role="alert">{banner}</div>
    {/if}

    {#if !dataEnabled}
        <p class="schedule-muted">Open this section to load your planner.</p>
    {:else if loading && objectives.length === 0}
        <p class="schedule-muted">Loading…</p>
    {:else}
        <div class="schedule-kanban-scroll">
            {#each KANBAN_COLUMNS as col, index (col.id)}
                <div
                    class="schedule-column"
                    role="region"
                    aria-label={col.title}
                    on:dragover={dragOverColumn}
                    on:drop={makeDrop(col.id)}
                >
                    <div class="schedule-column-head">
                        <div class="schedule-column-title">{col.title}</div>
                        <button
                            type="button"
                            class="schedule-column-add"
                            title="Add objective to {col.title}"
                            aria-label="Add objective to {col.title}"
                            disabled={createBusyColumn !== ""}
                            on:click|stopPropagation={() =>
                                handleCreateInColumn(col.id)}
                        >
                            <span
                                class="material-symbols-rounded schedule-column-add__icon"
                                aria-hidden="true">add</span
                            >
                        </button>
                    </div>
                    <ul class="schedule-column-list">
                        {#each itemsForColumn(col.id) as o (o.id)}
                            <ObjectiveRow
                                {o}
                                timeframe={selectedTf}
                                column={bucketForObjective(o, selectedTf) ===
                                "scheduled"
                                    ? "schedule"
                                    : "backlog"}
                                draggable={true}
                                busy={dropBusy === o.id}
                            />
                        {/each}
                    </ul>
                </div>
                {#if index < KANBAN_COLUMNS.length - 1}
                    <div class="schedule-column-separator"></div>
                {/if}
            {/each}
        </div>
    {/if}
</section>

<style>
    .omnibox-schedule {
        display: flex;
        flex-direction: column;

        flex: 1;
        min-height: 0;
        padding: 4px 8px 12px;
        box-sizing: border-box;
        border-radius: 16px;
        background-color: #222;
        margin-bottom: 10px;
    }

    .schedule-banner {
        margin: 0;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;

        color: #f87171;
        flex-shrink: 0;
    }

    .schedule-muted {
        margin: 0;
        font-size: 14px;
        color: var(--st-text-muted, #9ca3af);
    }

    .schedule-kanban-scroll {
        display: flex;
        flex-direction: row;
        gap: 10px;
        overflow-x: auto;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        margin-top: 2px;
        padding: 0px 0px 6px;
        -webkit-overflow-scrolling: touch;
        border-top: 1px solid #333;
    }
    .schedule-column-separator {
        width: 1px;
        height: 100%;
        background-color: #333;
    }

    .schedule-kanban-scroll::-webkit-scrollbar {
        height: 6px;
        width: 6px;
    }

    .schedule-kanban-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 4px;
    }

    .schedule-column {
        flex: 1 1 0;
        min-width: 140px;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 8px 0px 10px;
    }

    .schedule-column-head {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .schedule-column-title {
        margin-left: 6px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #9ca3af);
        min-width: 0;
    }

    .schedule-column-add {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        padding: 0;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: var(--st-text-muted, #9ca3af);
        cursor: pointer;
        transition:
            background 0.12s ease,
            color 0.12s ease,
            border-color 0.12s ease;
    }

    .schedule-column-add:hover:not(:disabled) {
        color: var(--st-text-primary, #f5f5f5);
        background: #333;
    }

    .schedule-column-add:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .schedule-column-add__icon {
        font-size: 18px;
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 20;
    }

    .schedule-column-list {
        list-style: none;
        margin: 0;
        padding: 0;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
    }
</style>
