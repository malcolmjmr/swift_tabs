<script>
    import { createEventDispatcher } from "svelte";
    import { bucketForObjective, isObjectiveOverdue } from "../dueSemantics.js";
    import { formatScheduledCaption } from "../scheduleUtils.js";

    const dispatch = createEventDispatcher();

    /** @type {import('../objectiveTypes.js').Objective} */
    export let o;
    /** @type {import('../objectiveTypes.js').Timeframe} */
    export let timeframe;
    export let draggable = false;
    export let busy = false;
    /** @type {'schedule'|'backlog'} */
    export let column = "backlog";

    /** @type {Record<string, string>} */
    const CATEGORY_COLORS = {
        Health: "#22c55e",
        Learning: "#3b82f6",
        Productivity: "#f97316",
        Creativity: "#a855f7",
        Social: "#ec4899",
        Wellness: "#14b8a6",
        Finance: "#eab308",
        Career: "#6366f1",
    };

    $: inColumn = o.timeframe === timeframe;
    $: scheduled = inColumn && bucketForObjective(o, timeframe) === "scheduled";
    $: overdue = scheduled && isObjectiveOverdue(o);
    $: scheduleCaption =
        scheduled && column === "schedule"
            ? formatScheduledCaption(o, timeframe)
            : "";
    $: categoryColor = o.category ? CATEGORY_COLORS[o.category] || null : null;

    function onDragStart(e) {
        if (!draggable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
            "application/x-swift-tabs-objective",
            JSON.stringify({ id: o.id, sourceTimeframe: timeframe }),
        );
        dispatch("dragstart", { id: o.id });
    }

    function onDragEnd() {
        if (draggable) dispatch("dragend");
    }
</script>

<li
    class="obj-row"
    class:obj-row-draggable={draggable}
    class:obj-row-busy={busy}
    class:obj-row-habit={o.isRecurring}
    {draggable}
    on:dblclick
    on:dragstart={onDragStart}
    on:dragend={onDragEnd}
>
    <div class="obj-line">
        <div class="obj-header">
            {#if o.isRecurring}
                <span
                    class="material-symbols-rounded obj-habit-icon"
                    title="Recurring habit"
                    aria-hidden="true">sync</span
                >
            {/if}
            <div
                class="obj-title"
                class:obj-title-done={o.status === "completed"}
                class:obj-title-blocked={o.status === "blocked"}
                class:obj-title-overdue={overdue}
            >
                {o.title || "(Untitled)"}
            </div>
            {#if categoryColor}
                <span
                    class="obj-category-badge"
                    style:background-color={categoryColor}
                    title={o.category}
                >
                    {o.category}
                </span>
            {/if}
            {#if o.isRecurring && o.completionCount > 0 && o.status === "completed"}
                <span class="obj-completion-count" title="Times completed">
                    ✓ {o.completionCount}
                </span>
            {/if}
        </div>
        <div class="obj-subline">
            {#if scheduleCaption}
                <span class="obj-when">{scheduleCaption}</span>
            {/if}
            {#if o.url && /^https?:\/\//i.test(o.url)}
                <a
                    class="obj-link"
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open link"
                    on:click|stopPropagation
                    on:dblclick|stopPropagation
                >
                    ↗
                </a>
            {/if}
        </div>
        {#if o.description}
            <div class="obj-description">{o.description}</div>
        {/if}
    </div>
</li>

<style>
    .obj-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        list-style: none;
        margin: 6px 0px;
        padding: 10px;
        background-color: #333;
        border-radius: 8px;
    }

    .obj-row-habit {
        border-left: 3px solid rgba(120, 170, 255, 0.6);
    }

    .obj-row-draggable {
        cursor: grab;
    }

    .obj-row-draggable:active {
        cursor: grabbing;
    }

    .obj-row-busy {
        opacity: 0.6;
        pointer-events: none;
    }

    .obj-line {
        display: flex;
        flex-direction: column;
        align-items: baseline;
        gap: 3px;
        flex-wrap: wrap;
    }

    .obj-header {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-width: 0;
    }

    .obj-subline {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .obj-description {
        font-size: 0.8125rem;
        color: var(--p-muted, #8b949e);
    }

    .obj-when {
        flex: 0 0 auto;
        min-width: 4.25rem;
        text-align: right;
        font-size: 0.8125rem;
        color: var(--p-muted, #8b949e);
        font-variant-numeric: tabular-nums;
    }

    .obj-title {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        font-size: 0.9375rem;
        color: var(--p-text, #e6edf3);
    }

    .obj-title-done {
        text-decoration: line-through;
        opacity: 0.5;
    }

    .obj-title-blocked {
        opacity: 0.72;
    }

    .obj-title-overdue:not(.obj-title-done) {
        color: var(--p-danger-text, #ff7b72);
    }

    .obj-link {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        color: var(--p-muted, #8b949e);
        opacity: 0.85;
    }

    .obj-link:hover {
        color: var(--p-accent, #58a6ff);
        opacity: 1;
    }

    .obj-habit-icon {
        font-size: 14px;
        color: rgba(120, 170, 255, 0.9);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 14;
    }

    .obj-category-badge {
        flex-shrink: 0;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 999px;
        color: #fff;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .obj-completion-count {
        flex-shrink: 0;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
        font-weight: 500;
    }
</style>
