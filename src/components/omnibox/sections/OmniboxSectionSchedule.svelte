<script>
    import { onMount, tick } from "svelte";
    import ObjectiveAssistanceModal from "../../../planner/components/ObjectiveAssistanceModal.svelte";
    import ObjectiveDetailsModal from "../../../planner/components/ObjectiveDetailsModal.svelte";
    import ObjectiveRow from "../../../planner/components/ObjectiveRow.svelte";
    import ScheduleObjectiveDraftRow from "../../../planner/components/ScheduleObjectiveDraftRow.svelte";
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
    /** True while an objective row is being dragged (HTML5 DnD). */
    let objectiveDragActive = false;
    /** Track the currently dragged objective ID for deletion */
    let draggedObjectiveId = null;
    /** Track if drag is currently outside the schedule area */
    let isDragOutside = false;

    /** @type {{ tempId: string, columnId: 'backlog'|'todo'|'in_progress'|'done' }[]} */
    let drafts = [];
    let focusDraftTempId = "";
    /** @type {string[]} */
    let savingDraftTempIds = [];

    let detailsOpen = false;
    /** @type {string|null} */
    let detailsObjectiveId = null;

    let assistanceOpen = false;
    /** @type {'backlog'|'todo'|'in_progress'|'done'} */
    let assistanceColumnId = "backlog";

    const LONG_PRESS_MS = 500;
    /** @type {ReturnType<typeof setTimeout>|null} */
    let longPressTimer = null;
    let suppressAddClick = false;

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

    /** @param {CustomEvent<{id: string}>} e */
    function onObjectiveDragStart(e) {
        objectiveDragActive = true;
        // Store the objective ID from the dispatched event
        draggedObjectiveId = e.detail?.id || null;
    }

    /** @param {CustomEvent} e */
    function onObjectiveDragEnd(e) {
        objectiveDragActive = false;
        // If dropped outside the schedule area, delete the objective
        if (isDragOutside && draggedObjectiveId) {
            void deleteDraggedObjective(draggedObjectiveId);
        }
        draggedObjectiveId = null;
        isDragOutside = false;
    }

    /**
     * Handle drag leaving the schedule section - triggers deletion when dropped outside
     * @param {DragEvent} e
     */
    function onSectionDragLeave(e) {
        const cur = /** @type {HTMLElement} */ (e.currentTarget);
        const rel = /** @type {Node | null} */ (e.relatedTarget);
        // Only mark as outside if we're actually leaving the section (not entering a child)
        if (rel && cur.contains(/** @type {Node} */ (rel))) return;
        isDragOutside = true;
    }

    /**
     * Handle drag entering the schedule section
     * @param {DragEvent} e
     */
    function onSectionDragEnter(e) {
        isDragOutside = false;
    }

    /**
     * Delete an objective by ID
     * @param {string} id
     */
    async function deleteDraggedObjective(id) {
        const o = objectives.find((x) => x.id === id);
        if (!o || o.timeframe !== selectedTf) return;

        dropBusy = id;
        banner = "";
        try {
            await repo.deleteObjective(id);
            notifyPlannerChanged();
            await reload();
        } catch (err) {
            banner =
                err instanceof Error
                    ? err.message
                    : String(err ?? "Delete failed");
        } finally {
            dropBusy = "";
        }
    }

    function notifyPlannerChanged() {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime
                .sendMessage({ type: "PLANNER_OBJECTIVES_CHANGED" })
                .catch(() => {});
        }
    }

    /**
     * @param {PointerEvent} e
     * @param {'backlog'|'todo'|'in_progress'|'done'} colId
     */
    function onColumnAddPointerDown(e, colId) {
        if (e.button !== 0 || !loadStarted) return;
        longPressTimer = window.setTimeout(() => {
            longPressTimer = null;
            suppressAddClick = true;
            assistanceColumnId = colId;
            assistanceOpen = true;
        }, LONG_PRESS_MS);
    }

    function onColumnAddPointerEnd() {
        if (longPressTimer != null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} colId
     */
    function onColumnAddClick(colId) {
        if (!loadStarted) return;
        if (suppressAddClick) {
            suppressAddClick = false;
            return;
        }
        void addDraft(colId);
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} columnId
     */
    async function addDraft(columnId) {
        const tempId = crypto.randomUUID();
        drafts = [...drafts, { tempId, columnId }];
        focusDraftTempId = tempId;
        await tick();
    }

    /**
     * @param {CustomEvent<{ mode: string, title: string, draftTempId: string }>} e
     */
    async function onDraftCommit(e) {
        const { mode, title, draftTempId } = e.detail;
        if (!loadStarted || savingDraftTempIds.includes(draftTempId)) return;
        const d = drafts.find((x) => x.tempId === draftTempId);
        if (!d) return;

        savingDraftTempIds = [...savingDraftTempIds, draftTempId];
        banner = "";
        try {
            let o = createBlankObjective({
                timeframe: selectedTf,
                type: "goal",
                title,
            });
            o = applyObjectiveToKanbanColumn(o, selectedTf, d.columnId);
            await repo.saveObjective(o);
            notifyPlannerChanged();
            await reload();
            drafts = drafts.filter((x) => x.tempId !== draftTempId);
            if (mode === "enter") {
                const nt = crypto.randomUUID();
                drafts = [...drafts, { tempId: nt, columnId: d.columnId }];
                focusDraftTempId = nt;
                await tick();
            } else if (mode === "tab") {
                focusDraftTempId = "";
                detailsObjectiveId = o.id;
                detailsOpen = true;
            } else {
                focusDraftTempId = "";
            }
        } catch (err) {
            banner =
                err instanceof Error
                    ? err.message
                    : String(err ?? "Save failed");
        } finally {
            savingDraftTempIds = savingDraftTempIds.filter(
                (id) => id !== draftTempId,
            );
        }
    }

    /** @param {CustomEvent<{ draftTempId: string }>} e */
    function onDraftDismiss(e) {
        const id = e.detail.draftTempId;
        drafts = drafts.filter((d) => d.tempId !== id);
        if (focusDraftTempId === id) focusDraftTempId = "";
    }

    function onDetailsClose() {
        detailsOpen = false;
        detailsObjectiveId = null;
    }

    /** @param {string} id */
    function openObjectiveDetails(id) {
        if (!loadStarted || !id) return;
        detailsObjectiveId = id;
        detailsOpen = true;
    }

    async function onDetailsSaved() {
        notifyPlannerChanged();
        await reload();
    }

    function onAssistanceClose() {
        assistanceOpen = false;
    }

    async function onAssistanceSaved() {
        await reload();
    }

    /**
     * @param {'backlog'|'todo'|'in_progress'|'done'} colId
     */
    function draftsForColumn(colId) {
        return drafts.filter((d) => d.columnId === colId);
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
            if (longPressTimer != null) clearTimeout(longPressTimer);
        };
    });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
    class="omnibox-schedule"
    class:omnibox-schedule--active-slide={isActiveSlide}
    class:omnibox-schedule--dragging={objectiveDragActive}
    aria-label="Schedule planner"
    style:--p-text="var(--st-text-primary, #f5f5f5)"
    style:--p-muted="var(--st-text-muted, #9ca3af)"
    style:--p-danger-text="#f87171"
    style:--p-accent="rgba(120, 170, 255, 0.9)"
    on:dragleave={onSectionDragLeave}
    on:dragenter={onSectionDragEnter}
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
                    class:schedule-column--dragging={objectiveDragActive}
                    role="region"
                    aria-label={col.title}
                    on:dragover={dragOverColumn}
                    on:drop={makeDrop(col.id)}
                >
                    <div class="schedule-column-head">
                        <span
                            class="schedule-column-dot schedule-column-dot--{col.id}"
                        ></span>
                        <div class="schedule-column-title">{col.title}</div>
                        <button
                            type="button"
                            class="schedule-column-add"
                            title="Add objective ({col.title}). Long-press for AI assistance."
                            aria-label="Add objective to {col.title}. Long-press for AI assistance."
                            disabled={!loadStarted}
                            on:pointerdown={(e) =>
                                onColumnAddPointerDown(e, col.id)}
                            on:pointerup={onColumnAddPointerEnd}
                            on:pointercancel={onColumnAddPointerEnd}
                            on:pointerleave={onColumnAddPointerEnd}
                            on:click|stopPropagation={() =>
                                onColumnAddClick(col.id)}
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
                                on:dragstart={onObjectiveDragStart}
                                on:dragend={onObjectiveDragEnd}
                                on:dblclick={() => openObjectiveDetails(o.id)}
                            />
                        {/each}
                        {#each draftsForColumn(col.id) as dr (dr.tempId)}
                            <ScheduleObjectiveDraftRow
                                draftTempId={dr.tempId}
                                requestFocus={dr.tempId === focusDraftTempId}
                                disabled={savingDraftTempIds.includes(
                                    dr.tempId,
                                )}
                                on:commit={onDraftCommit}
                                on:dismiss={onDraftDismiss}
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

    <ObjectiveDetailsModal
        open={detailsOpen}
        objectiveId={detailsObjectiveId}
        {objectives}
        on:close={onDetailsClose}
        on:saved={onDetailsSaved}
    />
    <ObjectiveAssistanceModal
        open={assistanceOpen}
        columnId={assistanceColumnId}
        {selectedTf}
        {objectives}
        on:close={onAssistanceClose}
        on:saved={onAssistanceSaved}
    />
</section>

<style>
    .omnibox-schedule {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 240px;
        max-height: calc(100vh - 200px);

        padding: 12px 14px 0px;
        box-sizing: border-box;
        border-radius: 16px;
        background: linear-gradient(
            180deg,
            var(--st-bg-secondary, rgba(35, 35, 40, 0.95)) 0%,
            var(--st-bg-primary, rgba(28, 28, 32, 0.98)) 100%
        );
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.08));
        box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.4),
            0 1px 2px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }

    .omnibox-schedule--dragging {
        cursor: grabbing;
    }

    .schedule-banner {
        margin: 0 0 8px;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        color: var(--p-danger-text, #f87171);
        background: rgba(248, 113, 113, 0.1);
        border-left: 3px solid var(--p-danger-text, #f87171);
        flex-shrink: 0;
    }

    .schedule-muted {
        margin: 0;
        padding: 16px;
        font-size: 14px;
        color: var(--st-text-muted, #9ca3af);
        text-align: center;
    }

    .schedule-kanban-scroll {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 8px;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1 1 auto;
        min-height: 0;
        max-height: 100%;
        margin-top: 4px;

        -webkit-overflow-scrolling: touch;
        border-top: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.06));
    }

    .schedule-column-separator {
        width: 1px;
        flex-shrink: 0;
        background: linear-gradient(
            180deg,
            transparent 0%,
            var(--st-border-color, rgba(255, 255, 255, 0.1)) 20%,
            var(--st-border-color, rgba(255, 255, 255, 0.1)) 80%,
            transparent 100%
        );
        margin: 8px 0;
    }

    .schedule-kanban-scroll::-webkit-scrollbar {
        height: 6px;
        width: 6px;
    }

    .schedule-kanban-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
    }

    .schedule-kanban-scroll::-webkit-scrollbar-track {
        background: transparent;
    }

    .schedule-column {
        position: relative;
        flex: 1 1 0;
        min-width: 140px;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        padding: 8px 0px 0px;

        transition:
            background 0.15s ease,
            border-color 0.15s ease;
    }

    .schedule-column--dragging {
        background: var(--st-bg-tertiary, rgba(255, 255, 255, 0.04));
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .schedule-column-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        padding: 0 4px 8px;
        margin-bottom: 4px;
    }

    .schedule-column-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .schedule-column-dot--backlog {
        background: #6b7280;
        box-shadow: 0 0 8px rgba(107, 114, 128, 0.4);
    }

    .schedule-column-dot--todo {
        background: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    }

    .schedule-column-dot--in_progress {
        background: #f59e0b;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }

    .schedule-column-dot--done {
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    }

    .schedule-column-title {
        flex: 1;
        min-width: 0;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--st-text-muted, #9ca3af);
    }

    .schedule-column-add {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-muted, #9ca3af);
        cursor: pointer;
        transition:
            background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease,
            transform 0.1s ease;
    }

    .schedule-column-add:hover:not(:disabled) {
        color: var(--st-text-primary, #f5f5f5);
        background: var(--st-bg-tertiary, rgba(255, 255, 255, 0.12));
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.2));
        transform: scale(1.05);
    }

    .schedule-column-add:active:not(:disabled) {
        transform: scale(0.95);
    }

    .schedule-column-add:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .schedule-column-add__icon {
        font-size: 16px;
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 20;
    }

    .schedule-column-list {
        list-style: none;
        margin: 0;
        padding: 0 4px;
        overflow-x: hidden;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    }

    .schedule-column-list::-webkit-scrollbar {
        width: 4px;
    }

    .schedule-column-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
</style>
