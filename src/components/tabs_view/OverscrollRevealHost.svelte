<script>
    /**
     * Scroll container that dispatches `reveal` after wheel-up overscroll at the top edge.
     * Keeps TabsView free of overscroll accumulation logic.
     */
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    /** Pixel threshold of upward pull at scrollTop===0 before `reveal` */
    export let threshold = 72;
    /** When false, no overscroll detection (e.g. view picker already open) */
    export let enabled = true;
    /** `slide` | `edge` — `edge` adds min-height for history/create slides */
    export let variant = "slide";

    let el = null;
    let accum = 0;

    $: if (!enabled) accum = 0;

    function onWheel(e) {
        if (!enabled || !el) return;
        if (el.scrollTop <= 0 && e.deltaY < 0) {
            accum += -e.deltaY;
            if (accum >= threshold) {
                accum = 0;
                dispatch("reveal");
            }
        } else {
            accum = 0;
        }
    }
</script>

<div
    class="host"
    class:host-edge={variant === "edge"}
    bind:this={el}
    on:wheel={onWheel}
>
    <slot />
</div>

<style>
    .host {
        overflow-x: hidden;
        overflow-y: visible;
        padding: 8px;
        box-sizing: border-box;
        min-height: 0;
    }

    .host-edge {
        min-height: 160px;
    }
</style>
