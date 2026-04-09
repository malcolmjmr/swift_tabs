<script>
    import { onMount, onDestroy, tick } from "svelte";
    import { resetDemoState } from "./chromeApiMock.js";
    import { tabStore } from "../stores/tabStore.js";
    import { isInTypingContext } from "../app/domUtils.js";

    /** 8 = tutorial done (no prompt). */
    let phase = 0;

    const TAB_CARD_SEL = '[data-demo="tabs-card"]';
    const MULTI_SEL =
        '[data-demo="tabs-card"] .list-view-item.multi-selected, [data-demo="tabs-card"] .icon-view-item.multi-selected, [data-demo="tabs-card"] .gallery-view-item.multi-selected';

    let rmbDown = false;

    /** @type {MutationObserver | null} */
    let mo = null;
    /** @type {MutationObserver | null} */
    let attrMo = null;

    let ignoreMutations = false;

    /** Debounce subtree mutations so brief Svelte re-renders don’t flip phases. */
    let mutDebounce = 0;
    const MUT_DEBOUNCE_MS = 120;

    /** @param {number} p */
    function instructionFor(p) {
        switch (p) {
            case 0:
                return "Press Space to view your open tabs.";
            case 1:
                return "Scroll vertically to change the highlighted tab.";
            case 2:
                return "Press Space again to navigate to the highlighted tab.";
            case 3:
                return "Press Space to view open tabs.";
            case 4:
                return "Press Shift to select a tab. Hold Shift and scroll to select multiple tabs.";
            case 5:
                return "Press Enter to move selected tabs to a new window.";
            case 6:
                return "Press Delete or Backspace to close the highlighted tab.";
            case 7:
                return "Hold right-click and scroll to move the highlighted tab.";
            default:
                return "";
        }
    }

    $: instruction = instructionFor(phase);

    function tabsCardPresent() {
        return document.querySelector(TAB_CARD_SEL) != null;
    }

    function multiSelectedCount() {
        return document.querySelectorAll(MULTI_SEL).length;
    }

    /** @param {WheelEvent} e */
    function onWheelCapture(e) {
        if (phase === 1 && tabsCardPresent()) {
            const dy = Math.abs(e.deltaY);
            const dx = Math.abs(e.deltaX);
            if (dy < 1 && dx < 1) return;
            if (dy < dx) return;
            phase = 2;
            return;
        }
        if (
            phase === 7 &&
            tabsCardPresent() &&
            (rmbDown || (e.buttons & 2) === 2)
        ) {
            if (Math.abs(e.deltaY) < 4 && Math.abs(e.deltaX) < 4) return;
            phase = 8;
        }
    }

    /** @param {KeyboardEvent} e */
    function onKeyDownCapture(e) {
        if (isInTypingContext()) return;

        if (e.code === "Enter" && phase === 5 && tabsCardPresent()) {
            setTimeout(() => {
                if (phase === 5) phase = 6;
            }, 0);
        }

        if (
            (e.key === "Delete" || e.key === "Backspace") &&
            phase === 6 &&
            tabsCardPresent()
        ) {
            if (
                e.key === "Backspace" &&
                window.getSelection()?.toString().length > 0
            ) {
                return;
            }
            setTimeout(() => {
                if (phase === 6) phase = 7;
            }, 0);
        }
    }

    /** @param {MouseEvent} e */
    function onMouseDownCapture(e) {
        if (e.button === 2) rmbDown = true;
    }

    /** @param {MouseEvent} e */
    function onMouseUpCapture(e) {
        if (e.button === 2) rmbDown = false;
    }

    function applyCardStateFromDom() {
        if (ignoreMutations) return;
        const has = tabsCardPresent();

        if (phase === 0 && has) {
            phase = 1;
            return;
        }

        // Strip closed (Space to activate, click outside, etc.) — next prompt is always “open tabs again”.
        if (phase === 2 && !has) {
            phase = 3;
            return;
        }

        if (phase === 3 && has) {
            phase = 4;
        }
    }

    function onRootMutations() {
        if (ignoreMutations) return;
        clearTimeout(mutDebounce);
        mutDebounce = setTimeout(applyCardStateFromDom, MUT_DEBOUNCE_MS);
    }

    let multiDebounce = 0;
    function checkMultiSelect() {
        if (ignoreMutations || phase !== 4) return;
        if (multiSelectedCount() >= 2) {
            phase = 5;
        }
    }

    function onAttrMutations() {
        if (ignoreMutations || phase !== 4) return;
        clearTimeout(multiDebounce);
        multiDebounce = setTimeout(checkMultiSelect, 0);
    }

    onMount(() => {
        window.addEventListener("wheel", onWheelCapture, {
            capture: true,
            passive: true,
        });
        window.addEventListener("keydown", onKeyDownCapture, true);
        window.addEventListener("mousedown", onMouseDownCapture, true);
        window.addEventListener("mouseup", onMouseUpCapture, true);

        const root = document.getElementById("swift-tabs-root");
        if (root) {
            mo = new MutationObserver(onRootMutations);
            mo.observe(root, { childList: true, subtree: true });

            attrMo = new MutationObserver(onAttrMutations);
            attrMo.observe(root, {
                subtree: true,
                attributes: true,
                attributeFilter: ["class"],
            });
        }
    });

    onDestroy(() => {
        window.removeEventListener("wheel", onWheelCapture, true);
        window.removeEventListener("keydown", onKeyDownCapture, true);
        window.removeEventListener("mousedown", onMouseDownCapture, true);
        window.removeEventListener("mouseup", onMouseUpCapture, true);
        clearTimeout(mutDebounce);
        clearTimeout(multiDebounce);
        mo?.disconnect();
        mo = null;
        attrMo?.disconnect();
        attrMo = null;
    });

    async function restartDemo() {
        ignoreMutations = true;
        rmbDown = false;
        clearTimeout(mutDebounce);
        window.chrome?.runtime?.sendMessage?.({
            type: "NAVIGATION_MODE",
            isInNavigationMode: false,
        });
        await tick();
        resetDemoState();
        await tabStore.refreshState();
        phase = 0;
        await tick();
        ignoreMutations = false;
    }

    function fullReload() {
        window.location.reload();
    }
</script>

<div class="demo-tour" aria-live="polite">
    <div class="demo-tour__panel">
        {#if phase < 8}
            <p class="demo-tour__line">{instruction}</p>
        {/if}
        <div class="demo-tour__extras">
            <button type="button" class="demo-tour__linkish" on:click={restartDemo}>
                Reset demo
            </button>
            <span class="demo-tour__sep">·</span>
            <button type="button" class="demo-tour__linkish" on:click={fullReload}>
                Reload page
            </button>
        </div>
    </div>
</div>

<style>
    .demo-tour {
        position: fixed;
        z-index: 2147483646;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        display: flex;
        justify-content: center;
        padding: 12px 16px 20px;
        box-sizing: border-box;
    }

    .demo-tour__panel {
        pointer-events: auto;
        max-width: min(440px, 100%);
        background: rgba(24, 28, 36, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 14px 18px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        color: #e8eaef;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        font-size: 15px;
        line-height: 1.4;
    }

    .demo-tour__line {
        margin: 0 0 12px;
    }

    .demo-tour__extras {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        opacity: 0.85;
    }

    .demo-tour__linkish {
        background: none;
        border: none;
        padding: 0;
        color: #9db7ff;
        text-decoration: underline;
        cursor: pointer;
        font-size: inherit;
    }

    .demo-tour__sep {
        opacity: 0.5;
    }
</style>
