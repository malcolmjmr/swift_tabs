<script>
    import { onMount } from "svelte";
    import TimeframeSection from "./planner/components/TimeframeSection.svelte";
    import {
        TIMEFRAMES,
        createBlankObjective,
        normalizeObjective,
    } from "./planner/objectiveTypes.js";
    import * as repo from "./planner/objectiveRepository.js";
    import {
        bucketForObjective,
        canScheduleDrop,
        reconcileOverdueObjectives,
    } from "./planner/dueSemantics.js";
    import {
        suggestScheduleAndSubgoals,
        suggestOnboardingObjectives,
    } from "./planner/plannerLLM.js";
    import {
        buildSubObjectives,
        compareObjectivesBySchedule,
        fallbackScheduleForTimeframe,
        sanitizeScheduleForTimeframe,
    } from "./planner/scheduleUtils.js";

    /** @type {import('./planner/objectiveTypes.js').Objective[]} */
    let objectives = [];
    let loading = true;
    let banner = "";

    /** @type {Record<string, boolean>} */
    let expanded = {};
    /** @type {Record<string, Array<{ title: string, description: string, instructions: string }>>} */
    let onboardingSuggestionsByTf = {};
    /** @type {string|null} */
    let onboardingBusyTf = null;
    /** @type {string|null} */
    let autoscheduleBusyTf = null;
    let scheduleBusyId = "";

    /** @type {Record<string, 'created'|'schedule'|'title'>} */
    let sortScheduledModes = {};
    /** @type {Record<string, 'created'|'title'>} */
    let sortBacklogModes = {};

    const TF_LABEL = {
        century: "This century",
        decade: "This decade",
        year: "This year",
        month: "This month",
        week: "This week",
        today: "Today",
    };

    /** Today → coarse for UI only (TIMEFRAMES order is semantic coarse→fine). */
    const TIMEFRAMES_DISPLAY = [...TIMEFRAMES].reverse();

    for (const tf of TIMEFRAMES) {
        expanded[tf] = true;
        onboardingSuggestionsByTf[tf] = [];
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function sortedForTimeframe(tf) {
        return objectives
            .filter((o) => o.timeframe === tf)
            .sort((a, b) => a.created - b.created);
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function backlogFor(tf) {
        return sortedForTimeframe(tf).filter(
            (o) => bucketForObjective(o, tf) === "backlog",
        );
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function scheduledFor(tf) {
        return sortedForTimeframe(tf).filter(
            (o) => bucketForObjective(o, tf) === "scheduled",
        );
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function scheduledForDisplay(tf) {
        const list = [...scheduledFor(tf)];
        const mode = sortScheduledModes[tf] ?? "created";
        if (mode === "schedule") {
            list.sort(compareObjectivesBySchedule);
        } else if (mode === "title") {
            list.sort((a, b) =>
                (a.title || "").localeCompare(b.title || "", undefined, {
                    sensitivity: "base",
                }),
            );
        }
        return list;
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function backlogForDisplay(tf) {
        const list = [...backlogFor(tf)];
        const mode = sortBacklogModes[tf] ?? "created";
        if (mode === "title") {
            list.sort((a, b) =>
                (a.title || "").localeCompare(b.title || "", undefined, {
                    sensitivity: "base",
                }),
            );
        }
        return list;
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function cycleSortScheduled(tf) {
        const order = /** @type {const} */ (["created", "schedule", "title"]);
        const cur = sortScheduledModes[tf] ?? "created";
        const i = (order.indexOf(cur) + 1) % order.length;
        sortScheduledModes = { ...sortScheduledModes, [tf]: order[i] };
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function cycleSortBacklog(tf) {
        const cur = sortBacklogModes[tf] ?? "created";
        sortBacklogModes = {
            ...sortBacklogModes,
            [tf]: cur === "created" ? "title" : "created",
        };
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Objective} o
     * @param {import('./planner/objectiveTypes.js').Timeframe} targetTf
     */
    async function applyScheduleFromObjective(o, targetTf) {
        let sched;
        try {
            sched = await suggestScheduleAndSubgoals(o, targetTf);
        } catch {
            sched = {
                ...fallbackScheduleForTimeframe(targetTf),
                subgoals: [],
            };
        }

        const cleaned = sanitizeScheduleForTimeframe(targetTf, sched);
        const parentUpdated = normalizeObjective({
            ...o,
            timeframe: targetTf,
            year: cleaned.year,
            month: cleaned.month,
            day: cleaned.day,
            time: cleaned.time,
        });

        const kids = buildSubObjectives(
            parentUpdated,
            targetTf,
            sched.subgoals,
            createBlankObjective,
        );

        if (kids.length) {
            await repo.attachNewChildren(parentUpdated, kids);
        } else {
            await repo.saveObjective(parentUpdated);
        }
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    async function handleAddObjective(tf) {
        const o = createBlankObjective({
            timeframe: tf,
            type: "goal",
            title: "New objective",
        });
        await repo.saveObjective(o);
        await reload();
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    async function handleAutoscheduleBacklog(tf) {
        const items = backlogFor(tf);
        if (items.length === 0) return;
        autoscheduleBusyTf = tf;
        banner = "";
        try {
            for (const o of items) {
                scheduleBusyId = o.id;
                try {
                    await applyScheduleFromObjective(o, tf);
                } catch (err) {
                    banner =
                        err instanceof Error
                            ? err.message
                            : String(err ?? "Autoschedule failed");
                    break;
                }
            }
        } finally {
            scheduleBusyId = "";
            autoscheduleBusyTf = null;
            await reload();
        }
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

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function toggleExpand(tf) {
        expanded = { ...expanded, [tf]: !expanded[tf] };
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     * @param {DragEvent} e
     */
    function makeDragOverScheduled(tf) {
        return (e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        };
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} targetTf
     */
    function makeDropScheduled(targetTf) {
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
            if (!canScheduleDrop(o.timeframe, targetTf)) {
                banner =
                    "Drop only into the same or a finer timeframe’s Schedule column.";
                setTimeout(() => {
                    banner = "";
                }, 5000);
                return;
            }

            scheduleBusyId = id;
            banner = "";

            try {
                await applyScheduleFromObjective(o, targetTf);
            } catch (err) {
                banner =
                    err instanceof Error ? err.message : String(err ?? "Save failed");
            }

            scheduleBusyId = "";
            await reload();
        };
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     * @param {string} text
     */
    async function handleOnboardingRequest(tf, text) {
        onboardingBusyTf = tf;
        try {
            const s = await suggestOnboardingObjectives(text, tf);
            onboardingSuggestionsByTf = {
                ...onboardingSuggestionsByTf,
                [tf]: s,
            };
        } catch (e) {
            banner =
                e instanceof Error
                    ? e.message
                    : String(e ?? "Suggestions failed");
        }
        onboardingBusyTf = null;
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     * @param {{ title: string, description: string, instructions: string }} s
     */
    async function handlePickSuggestion(tf, s) {
        const o = createBlankObjective({
            timeframe: tf,
            type: "goal",
            title: s.title,
            description: s.description || "",
            instructions: s.instructions || "",
        });
        await repo.saveObjective(o);
        onboardingSuggestionsByTf = { ...onboardingSuggestionsByTf, [tf]: [] };
        await reload();
    }

    /** @param {import('./planner/objectiveTypes.js').Timeframe} tf */
    function showOnboarding(tf) {
        return (
            backlogFor(tf).length === 0 && scheduledFor(tf).length === 0
        );
    }

    /**
     * @param {import('./planner/objectiveTypes.js').Timeframe} tf
     */
    function onboardingBusy(tf) {
        return onboardingBusyTf === tf;
    }

    function onPlannerMessage(message) {
        if (message?.type === "PLANNER_RECONCILE") {
            void runReconcile();
        }
    }

    onMount(() => {
        void reload().then(() => runReconcile());
        const onFocus = () => void runReconcile();
        window.addEventListener("focus", onFocus);
        chrome.runtime.onMessage.addListener(onPlannerMessage);
        return () => {
            window.removeEventListener("focus", onFocus);
            chrome.runtime.onMessage.removeListener(onPlannerMessage);
        };
    });
</script>

<div class="planner-root">
    <header class="planner-header">
        <h1 class="title">Planner</h1>
        <p class="subtitle">
            Goals and habits by timeframe. Drag backlog items from a coarser
            column into a finer Schedule column to plan them (uses Gemini when
            a key is set in extension options).
        </p>
    </header>

    {#if banner}
        <div class="banner" role="alert">{banner}</div>
    {/if}

    <main class="planner-main">
        {#if loading}
            <p class="muted">Loading…</p>
        {:else}
            {#each TIMEFRAMES_DISPLAY as tf}
                <TimeframeSection
                    timeframe={tf}
                    label={TF_LABEL[tf]}
                    backlogItems={backlogForDisplay(tf)}
                    scheduledItems={scheduledForDisplay(tf)}
                    expanded={expanded[tf]}
                    showOnboarding={showOnboarding(tf)}
                    onboardingBusy={onboardingBusy(tf)}
                    onboardingSuggestions={onboardingSuggestionsByTf[tf] ?? []}
                    autoscheduleBusy={autoscheduleBusyTf === tf}
                    scheduledSortMode={sortScheduledModes[tf] ?? "created"}
                    backlogSortMode={sortBacklogModes[tf] ?? "created"}
                    {scheduleBusyId}
                    onToggleExpand={() => toggleExpand(tf)}
                    onDragOverScheduled={makeDragOverScheduled(tf)}
                    onDropScheduled={makeDropScheduled(tf)}
                    onOnboardingRequest={(text) =>
                        handleOnboardingRequest(tf, text)}
                    onPickSuggestion={(s) => handlePickSuggestion(tf, s)}
                    onAddObjective={() => handleAddObjective(tf)}
                    onSortScheduled={() => cycleSortScheduled(tf)}
                    onSortBacklog={() => cycleSortBacklog(tf)}
                    onAutoscheduleBacklog={() => handleAutoscheduleBacklog(tf)}
                />
            {/each}
        {/if}
    </main>
</div>

<style>
    :global(html, body) {
        margin: 0;
        min-height: 100%;
    }

    :global(body) {
        --p-bg: #0d1117;
        --p-surface: #161b22;
        --p-surface-2: #21262d;
        --p-border: #30363d;
        --p-text: #e6edf3;
        --p-muted: #8b949e;
        --p-accent: #58a6ff;
        --p-accent-muted: #388bfd66;
        --p-success-bg: rgba(46, 160, 67, 0.15);
        --p-success-border: #3fb950;
        --p-danger-bg: rgba(248, 81, 73, 0.12);
        --p-danger-border: #f85149;
        --p-danger-text: #ff7b72;
        --p-warn-bg: rgba(210, 153, 34, 0.12);
        --p-warn-border: #d29922;
        --p-warn-text: #e3b341;
        --p-purple-bg: rgba(163, 113, 247, 0.12);
        --p-purple-border: #a371f7;
        --p-purple-text: #d2a8ff;

        font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        line-height: 1.5;
        color: var(--p-text);
        background: var(--p-bg);
    }

    .planner-root {
        box-sizing: border-box;
        min-height: 100vh;
        padding: 2rem clamp(1.25rem, 4vw, 3rem);
        max-width: 960px;
        margin: 0 auto;
    }

    .planner-header {
        margin-bottom: 1.25rem;
    }

    .title {
        margin: 0 0 0.5rem;
        font-size: 1.75rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--p-text);
    }

    .subtitle {
        margin: 0;
        font-size: 0.95rem;
        color: var(--p-muted);
        max-width: 40rem;
    }

    .banner {
        margin-bottom: 12px;
        padding: 10px 14px;
        background: var(--p-danger-bg);
        border: none;
        border-radius: 8px;
        color: var(--p-danger-text);
        font-size: 14px;
    }

    .planner-main {
        background: transparent;
        border-radius: 12px;
        padding: 0;
        border: none;
        box-shadow: none;
    }

    .muted {
        margin: 0;
        color: var(--p-muted);
    }
</style>
