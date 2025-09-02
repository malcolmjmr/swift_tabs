<script>
    import { tweened } from "svelte/motion";
    import { linear } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let container;
    let startX;
    let isSwiping = false;

    const position = tweened(0, {
        duration: 150,
        easing: linear,
    });

    const THRESHOLD = 75; // Pixels to trigger a swipe action

    function handleTouchStart(event) {
        if (event.touches.length !== 1) return; // Only handle single touch
        isSwiping = true;
        startX = event.touches[0].clientX;
    }

    function handleTouchMove(event) {
        if (!isSwiping) return;
        const currentX = event.touches[0].clientX;
        const dx = currentX - startX;
        position.set(dx);
    }

    function handleTouchEnd(event) {
        if (!isSwiping) return;
        isSwiping = false;
        const dx = $position;

        if (dx < -THRESHOLD) {
            // Swiped left to close
            position.set(-window.innerWidth, { duration: 250 });
            setTimeout(() => {
                dispatch("closeTab");
            }, 250);
        } else if (dx > THRESHOLD) {
            // Swiped right to open menu
            position.set(0); // Snap back to original position
            dispatch("openMenu");
        } else {
            // Not enough movement, snap back to original position
            position.set(0);
        }
    }

    function handleWheel(event) {
        const dx = event.deltaX;
        position.update((n) => n - dx);
        if (dx < -THRESHOLD) {
            // Swiped left to close
            position.set(-window.innerWidth, { duration: 250 });
            setTimeout(() => {
                dispatch("closeTab");
            }, 250);
        } else if (dx > THRESHOLD) {
            // Swiped right to open menu
            position.set(0); // Snap back to original position
            dispatch("openMenu");
        }
    }

    function handleMouseLeave() {
        position.set(0);
    }
</script>

<div
    bind:this={container}
    on:wheel={handleWheel}
    on:mouseleave={handleMouseLeave}
    style="transform: translateX({$position}px);"
    class="swipeable-container"
    role="button"
    tabindex="0"
>
    <div class="background-icons">
        <div class="close-icon" style="opacity: {$position < -50 ? 1 : 0};">
            ❌
        </div>
        <div class="move-icon" style="opacity: {$position > 50 ? 1 : 0};">
            ☰
        </div>
    </div>
    <div class="content">
        <slot />
    </div>
</div>

<style>
    .swipeable-container {
        position: relative;
        width: 100%;
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
    }

    .swipeable-container.swiping {
        cursor: grabbing;
    }

    .content {
        position: relative;
        z-index: 2;
        background: #fff; /* Ensure content is on top of icons */
        transition: transform 0.1s linear; /* Smooth visual drag */
    }

    .background-icons {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1rem;
        z-index: 1;
        background-color: red;
    }

    .close-icon,
    .move-icon {
        font-size: 1.5rem;
        transition: opacity 0.2s ease-in-out;
    }
</style>
