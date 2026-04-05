<script>
    import {
        bucketForObjective,
        isObjectiveOverdue,
    } from "../dueSemantics.js";
    import { formatScheduledCaption } from "../scheduleUtils.js";

    /** @type {import('../objectiveTypes.js').Objective} */
    export let o;
    /** @type {import('../objectiveTypes.js').Timeframe} */
    export let timeframe;
    export let draggable = false;
    export let busy = false;
    /** @type {'schedule'|'backlog'} */
    export let column = "backlog";

    $: inColumn = o.timeframe === timeframe;
    $: scheduled =
        inColumn && bucketForObjective(o, timeframe) === "scheduled";
    $: overdue = scheduled && isObjectiveOverdue(o);
    $: scheduleCaption =
        scheduled && column === "schedule"
            ? formatScheduledCaption(o, timeframe)
            : "";

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
    }
</script>

<li
    class="obj-row"
    class:obj-row-draggable={draggable}
    class:obj-row-busy={busy}
    {draggable}
    on:dragstart={onDragStart}
>
    <div class="obj-line">
        {#if scheduleCaption}
            <span class="obj-when">{scheduleCaption}</span>
        {/if}
        <span
            class="obj-title"
            class:obj-title-done={o.status === "completed"}
            class:obj-title-blocked={o.status === "blocked"}
            class:obj-title-overdue={overdue}
        >
            {o.title || "(Untitled)"}
        </span>
        {#if o.url && /^https?:\/\//i.test(o.url)}
            <a
                class="obj-link"
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open link"
                on:click|stopPropagation
            >
                ↗
            </a>
        {/if}
    </div>
</li>

<style>
    .obj-row {
        list-style: none;
        margin: 0;
        padding: 6px 0;
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
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
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
        flex: 1 1 12rem;
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
</style>
