<script>
    /*
        TODO:
        - Swipe left to close tab, swipe right to open the move tab menu
    */

    import { fade } from "svelte/transition";
    import { tabStore } from "../../stores/tabStore";
    import { createEventDispatcher } from "svelte";
    import SwipeableContainer from "../SwipeableContainer.svelte";

    export let tab;
    export let isActive = false;
    export let isDragging = false;
    export let showActions = false;

    const dispatch = createEventDispatcher();

    // Swipe state
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    let swipeDirection = null;
    let swipeDistance = 0;
    const SWIPE_THRESHOLD = 80; // Minimum distance for swipe action
    const SWIPE_VELOCITY = 0.5; // Velocity threshold

    function handleMouseEnter() {
        showActions = true;
    }

    function handleMouseLeave() {
        showActions = false;
    }

    async function handleClose() {
        await tabStore.closeTab(tab.id);
    }

    async function handlePin() {
        await tabStore.pinTab(tab.id);
    }

    async function handleDuplicate() {
        await tabStore.duplicateTab(tab.id);
    }

    async function handleReload() {
        await tabStore.reloadTab(tab.id);
    }

    async function handleShare() {
        try {
            await navigator.clipboard.writeText(tab.url);
            // Could add a small notification here if desired
        } catch (err) {
            console.error("Failed to copy URL: ", err);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.target.click();
        }
    }

    function handleClick() {
        tabStore.activateTab(tab.id);
    }

    // Swipe gesture handlers
    function handleTouchStart(event) {
        if (event.touches.length === 1) {
            startX = event.touches[0].clientX;
            isSwiping = true;
            swipeDirection = null;
            swipeDistance = 0;
        }
    }

    function handleTouchMove(event) {
        if (!isSwiping || event.touches.length !== 1) return;

        currentX = event.touches[0].clientX;
        swipeDistance = currentX - startX;

        // Prevent default scrolling during swipe
        event.preventDefault();

        // Determine direction based on threshold
        if (Math.abs(swipeDistance) > 10) {
            swipeDirection = swipeDistance > 0 ? "right" : "left";
        }
    }

    function handleTouchEnd(event) {
        if (!isSwiping) return;

        isSwiping = false;

        // Check if swipe distance exceeds threshold
        if (Math.abs(swipeDistance) >= SWIPE_THRESHOLD) {
            if (swipeDirection === "left") {
                // Swipe left to close tab
                handleClose();
            } else if (swipeDirection === "right") {
                // Swipe right to open move menu
                dispatch("openMoveMenu", { tab });
            }
        }

        // Reset swipe state
        swipeDistance = 0;
        swipeDirection = null;
    }

    function handleMouseDown(event) {
        // Prevent mouse events from interfering with touch on hybrid devices
        if (event.pointerType === "touch") return;

        startX = event.clientX;
        isSwiping = true;
        swipeDirection = null;
        swipeDistance = 0;

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(event) {
        if (!isSwiping) return;

        currentX = event.clientX;
        swipeDistance = currentX - startX;

        if (Math.abs(swipeDistance) > 10) {
            swipeDirection = swipeDistance > 0 ? "right" : "left";
        }
    }

    function handleMouseUp(event) {
        if (!isSwiping) return;

        isSwiping = false;

        if (Math.abs(swipeDistance) >= SWIPE_THRESHOLD) {
            if (swipeDirection === "left") {
                handleClose();
            } else if (swipeDirection === "right") {
                dispatch("openMoveMenu", { tab });
            }
        }

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        swipeDistance = 0;
        swipeDirection = null;
    }

    function handleOpenMenu() {
        dispatch("openMoveMenu", { tab });
    }

    // Calculate transform based on swipe distance
    $: transform = isSwiping
        ? `translateX(${swipeDistance}px)`
        : "translateX(0px)";
    $: opacity = isSwiping
        ? Math.max(0.7, 1 - Math.abs(swipeDistance) / 200)
        : 1;
</script>

<SwipeableContainer on:closeTab={handleClose} on:openMenu={handleOpenMenu}>
    <div
        class="tab-item"
        class:active={isActive}
        class:dragging={isDragging}
        class:pinned={tab.pinned}
        class:swiping={isSwiping}
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
        on:click={handleClick}
        on:contextmenu|preventDefault={handleClose}
        on:auxclick={(e) => e.button === 1 && handleClose()}
        on:keydown={handleKeyDown}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
        on:mousedown={handleMouseDown}
        role="button"
        tabindex="0"
        style="transform: {transform}; opacity: {opacity};"
    >
        <div class="tab-content-wrapper" class:swiping={isSwiping}>
            <div class="tab-content">
                {#if tab.favIconUrl}
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        class="tab-icon"
                        on:error={(e) => (e.target.style.display = "none")}
                    />
                {/if}
                <span class="tab-title">{tab.title}</span>
            </div>

            {#if showActions}
                <div class="tab-actions" transition:fade>
                    {#if !tab.pinned}
                        <button
                            class="action-button"
                            title="Reload tab"
                            on:click={handleReload}
                        >
                            <span class="icon">↻</span>
                        </button>
                        <button
                            class="action-button"
                            title="Share tab"
                            on:click={handleShare}
                        >
                            <span class="icon">↗</span>
                        </button>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</SwipeableContainer>

<style>
    .tab-item {
        display: flex;
        flex-direction: column;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
        user-select: none;
        position: relative;
        outline: none;
    }

    .tab-item:hover {
        background-color: #f0f0f0;
    }

    .tab-item.active {
        background-color: #e8e8e8;
    }

    .tab-item:focus-visible {
        box-shadow: 0 0 0 2px #4299e1;
    }

    .tab-item.dragging {
        opacity: 0.5;
    }

    .tab-item.pinned {
        background-color: #f8f8f8;
        border-left: 3px solid #4299e1;
    }

    .tab-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0; /* Enable text truncation */
    }

    .tab-main {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0; /* Enable text truncation */
        flex: 1;
    }

    .tab-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        object-fit: contain;
    }

    .tab-title {
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #333;
    }

    .tab-actions {
        display: flex;
        gap: 4px;
        align-items: center;
    }

    .action-button {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        padding: 0;
        font-size: 12px;
        transition: all 0.2s;
    }

    .action-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: #333;
    }

    .loading-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: linear-gradient(
            90deg,
            #4299e1 0%,
            #63b3ed 50%,
            #4299e1 100%
        );
        animation: loading 1.5s infinite;
        width: 100%;
        border-radius: 1px;
    }

    @keyframes loading {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }

    /* Add swipe animation */
    .tab-item.swiping {
        transition: transform 0.1s ease;
    }

    .tab-content-wrapper {
        width: 100%;
        display: flex;
        transition: transform 0.2s ease-out; /* Add transition for smooth movement */
    }

    .tab-content-wrapper.swiping {
        transition: transform 0.1s ease;
    }

    .swipe-indicator {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #fff;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 4px 8px;
        border-radius: 6px;
        pointer-events: none; /* Ensure it doesn't interfere with clicks */
    }

    .swipe-indicator.left {
        left: 0;
        margin-left: 10px;
    }

    .swipe-indicator.right {
        right: 0;
        margin-right: 10px;
    }

    .swipe-text {
        font-weight: bold;
    }

    .swipe-icon {
        font-size: 14px;
    }
</style>
