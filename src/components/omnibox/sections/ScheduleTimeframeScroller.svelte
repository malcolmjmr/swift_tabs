<script>
    import { onMount } from "svelte";
    import {
        TIMEFRAME_LABEL,
        TIMEFRAMES_DISPLAY,
    } from "../../../planner/plannerUiLabels.js";
    import { timeframeCurrentPeriodSubtitle } from "../../../planner/kanbanColumnMap.js";

    /** @type {import('../../../planner/objectiveTypes.js').Timeframe} */
    export let value = TIMEFRAMES_DISPLAY[0];

    onMount(() => {
        if (TIMEFRAMES_DISPLAY.indexOf(value) < 0) {
            value = TIMEFRAMES_DISPLAY[0];
        }
    });

    /** Index in display order; if value is unknown, treat as first slot for UI. */
    $: idx = TIMEFRAMES_DISPLAY.indexOf(value);
    $: cur = idx >= 0 ? idx : 0;
    $: tf = TIMEFRAMES_DISPLAY[cur];
    $: canPrev = cur > 0;
    $: canNext = cur < TIMEFRAMES_DISPLAY.length - 1;

    function goPrev() {
        if (!canPrev) return;
        value = TIMEFRAMES_DISPLAY[cur - 1];
    }

    function goNext() {
        if (!canNext) return;
        value = TIMEFRAMES_DISPLAY[cur + 1];
    }
</script>

<div class="tf-picker" role="group" aria-label="Planner timeframe">
    <button
        type="button"
        class="tf-picker__arrow"
        class:tf-picker__arrow--disabled={!canPrev}
        disabled={!canPrev}
        aria-label="Previous timeframe"
        aria-disabled={!canPrev}
        on:click={goPrev}
    >
        <span
            class="material-symbols-rounded tf-picker__arrow-icon"
            aria-hidden="true">chevron_left</span
        >
    </button>
    <button
        type="button"
        class="tf-picker__arrow"
        class:tf-picker__arrow--disabled={!canNext}
        disabled={!canNext}
        aria-label="Next timeframe"
        aria-disabled={!canNext}
        on:click={goNext}
    >
        <span
            class="material-symbols-rounded tf-picker__arrow-icon"
            aria-hidden="true">chevron_right</span
        >
    </button>

    <div class="tf-picker__display">
        <span class="tf-picker__label">{TIMEFRAME_LABEL[tf]}</span>
        <span class="tf-picker__sub">{timeframeCurrentPeriodSubtitle(tf)}</span>
    </div>
</div>

<style>
    .tf-picker {
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 40px;
    }

    .tf-picker__arrow {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--st-text-primary, #f5f5f5);
        cursor: pointer;
        transition:
            background 0.12s ease,
            color 0.12s ease,
            opacity 0.12s ease;
    }

    .tf-picker__arrow:hover:not(:disabled) {
    }

    .tf-picker__arrow:focus-visible {
    }

    .tf-picker__arrow:disabled,
    .tf-picker__arrow--disabled {
        opacity: 0.28;
        cursor: not-allowed;
        color: var(--st-text-muted, #9ca3af);
    }

    .tf-picker__arrow-icon {
        font-size: 22px;
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 24;
    }

    .tf-picker__display {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: center;
        gap: 8px;
        padding: 0 6px;
    }

    .tf-picker__label {
        font-size: 15px;
        font-weight: 650;
        letter-spacing: -0.02em;
        line-height: 1.25;
        color: var(--st-text-primary, #f5f5f5);
    }

    .tf-picker__sub {
        font-size: 12px;
        line-height: 1.35;
        color: var(--st-text-muted, #9ca3af);
        line-clamp: 2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
