<script>
    import { createEventDispatcher } from "svelte";
    import ActiveTabInfo from "../tab/ActiveTabInfo.svelte";
    import {
        TRIAGE_HORIZONTAL_SOFT_PX,
        TRIAGE_HORIZONTAL_COMMIT_PX,
    } from "../../app/constants.js";

    /** @type {chrome.tabs.Tab | null} */
    export let tab = null;
    export let horizontalPx = 0;
    export let canScrollUp = false;
    export let canScrollDown = false;

    const dispatch = createEventDispatcher();

    $: leftMag = horizontalPx < 0 ? -horizontalPx : 0;
    $: rightMag = horizontalPx > 0 ? horizontalPx : 0;

    /**
     * @param {number} mag
     * @returns {{ opacity: number; armed: boolean }}
     */
    function iconVisual(mag) {
        if (mag <= TRIAGE_HORIZONTAL_SOFT_PX) {
            return {
                opacity: (mag / TRIAGE_HORIZONTAL_SOFT_PX) * 0.35,
                armed: false,
            };
        }
        if (mag >= TRIAGE_HORIZONTAL_COMMIT_PX) {
            return { opacity: 1, armed: true };
        }
        const t =
            (mag - TRIAGE_HORIZONTAL_SOFT_PX) /
            (TRIAGE_HORIZONTAL_COMMIT_PX - TRIAGE_HORIZONTAL_SOFT_PX);
        return { opacity: 0.35 + t * 0.65, armed: false };
    }

    $: leftVis = iconVisual(leftMag);
    $: rightVis = iconVisual(rightMag);

    $: sliding = Math.abs(horizontalPx) > 2;

    /** Stronger slide → under-row sits flush; idle → slightly tucked under card */
    $: maxActionMag = Math.max(leftMag, rightMag);
    $: underPeekY =
        maxActionMag <= 0
            ? 12
            : maxActionMag >= TRIAGE_HORIZONTAL_COMMIT_PX
              ? 0
              : 12 *
                (1 -
                    maxActionMag / TRIAGE_HORIZONTAL_COMMIT_PX);
</script>

<!-- Backdrop: horizontal drag from empty areas -->
<div
    class="triage-drag-plane"
    role="presentation"
    on:pointerdown={(e) => dispatch("pointergesturestart", e)}
/>

<!--
  column-reverse: bottom of stack at viewport anchor (down arrow, card block, up arrow).
  All horizontal centering uses align-items: center on the 360px-wide column.
-->
<div class="triage-column">
    {#if canScrollDown}
        <div class="triage-arrow-slot" aria-hidden="true">
            <span class="material-symbols-rounded triage-arrow-icon"
                >keyboard_arrow_down</span
            >
        </div>
    {/if}

    <div
        class="triage-card-slider"
        class:triage-card-slider--sliding={sliding}
        style="transform: translateX({horizontalPx}px);"
        on:pointerdown={(e) => dispatch("pointergesturestart", e)}
    >
        <div class="triage-card-slot">
            <ActiveTabInfo {tab} />
        </div>
        <div
            class="triage-under-icons"
            style="transform: translateY({underPeekY}px);"
        >
            <div
                class="triage-under-icon triage-under-icon--left"
                class:triage-under-icon--armed={leftVis.armed}
                style="opacity: {leftVis.opacity};"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded triage-action-glyph"
                    >delete</span
                >
            </div>
            <div
                class="triage-under-icon triage-under-icon--right"
                class:triage-under-icon--armed={rightVis.armed}
                style="opacity: {rightVis.opacity};"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded triage-action-glyph"
                    >open_in_new</span
                >
            </div>
        </div>
    </div>

    {#if canScrollUp}
        <div class="triage-arrow-slot" aria-hidden="true">
            <span class="material-symbols-rounded triage-arrow-icon"
                >keyboard_arrow_up</span
            >
        </div>
    {/if}
</div>

<style>
    .triage-drag-plane {
        position: fixed;
        inset: 0;
        z-index: 999980;
        touch-action: none;
    }

    .triage-column {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999990;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        width: min(360px, calc(100vw - 40px));
        gap: 6px;
        box-sizing: border-box;
        pointer-events: none;
    }

    .triage-arrow-slot {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 28px;
        pointer-events: none;
    }

    .triage-arrow-icon {
        font-size: 28px;
        color: var(--st-text-secondary, rgba(255, 255, 255, 0.55));
        user-select: none;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 48;
    }

    .triage-card-slider {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        max-width: min(360px, calc(100vw - 48px));
        pointer-events: auto;
        touch-action: pan-y;
        transition: transform 0.22s ease-out;
    }

    .triage-card-slider--sliding {
        transition: none;
    }

    .triage-card-slot {
        position: relative;
        width: 100%;
        min-height: 80px;
    }

    .triage-under-icons {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        box-sizing: border-box;
        padding: 2px 12px 0;
        min-height: 44px;
        pointer-events: none;
        transition: transform 0.18s ease-out;
    }

    .triage-card-slider--sliding .triage-under-icons {
        transition: none;
    }

    .triage-under-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        min-height: 44px;
    }

    .triage-action-glyph {
        font-size: 36px;
        color: var(--st-text-muted, #888);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 48;
    }

    .triage-under-icon--armed .triage-action-glyph {
        color: var(--st-accent, #6ee7a8);
        font-variation-settings:
            "FILL" 1,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }
</style>
