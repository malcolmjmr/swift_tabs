<script>
    import { createEventDispatcher } from "svelte";

    export let windows = [];
    export let activeWindowId = null;

    const dispatch = createEventDispatcher();
    let showOverview = false;
    let longPressTimer;

    function handleWindowClick(windowId) {
        dispatch("windowSelect", { windowId });
    }

    function handleMouseDown() {
        longPressTimer = setTimeout(() => {
            showOverview = true;
        }, 500); // 500ms for long press
    }

    function handleMouseUp() {
        clearTimeout(longPressTimer);
    }

    function handleWindowOverviewSelect(windowId) {
        handleWindowClick(windowId);
        showOverview = false;
    }
</script>

<div
    class="window-dots"
    role="toolbar"
    tabindex="0"
    aria-label="Window switcher"
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
>
    {#each windows as window (window.id)}
        <button
            class="dot"
            class:active={window.id === activeWindowId}
            on:click={() => handleWindowClick(window.id)}
            aria-label={window.title || "Window " + window.id}
        ></button>
    {/each}
</div>

<style>
    .window-dots {
        display: flex;
        gap: 6px;
        justify-content: center;
        align-items: center;
        position: relative;
        padding: 4px;
    }

    .window-dots:focus {
        outline: none;
    }

    .window-dots:focus-visible {
        outline: 2px solid #4299e1;
        border-radius: 4px;
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ccc;
        border: none;
        padding: 0;
        cursor: pointer;
        transition: all 0.2s;
    }

    .dot:hover {
        background-color: #999;
        transform: scale(1.2);
    }

    .dot.active {
        background-color: #666;
        transform: scale(1.2);
    }
</style>
