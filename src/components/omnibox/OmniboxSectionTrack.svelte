<script>
    import { tick } from "svelte";

    /** Number of horizontal slides (sections). */
    export let slideCount = 0;
    /** Current slide index; two-way bind with parent. */
    export let activeIndex = 0;

    let trackEl = null;
    let programmaticScroll = false;
    let lastScrolledIndex = -1;

    $: if (trackEl && slideCount > 0 && activeIndex !== lastScrolledIndex) {
        lastScrolledIndex = activeIndex;
        scrollTrackToIndex(activeIndex);
    }

    async function scrollTrackToIndex(i) {
        await tick();
        if (!trackEl || slideCount <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const target = Math.max(0, Math.min(i, slideCount - 1)) * w;
        if (Math.abs(trackEl.scrollLeft - target) < 2) return;
        programmaticScroll = true;
        trackEl.scrollTo({ left: target, behavior: "auto" });
        requestAnimationFrame(() => {
            programmaticScroll = false;
        });
    }

    function onTrackScroll() {
        if (programmaticScroll || !trackEl || slideCount <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const i = Math.round(trackEl.scrollLeft / w);
        const clamped = Math.max(0, Math.min(slideCount - 1, i));
        if (clamped !== activeIndex) {
            lastScrolledIndex = clamped;
            activeIndex = clamped;
        }
    }
</script>

<div
    class="omnibox-section-track"
    data-omnibox-section-track
    bind:this={trackEl}
    on:scroll={onTrackScroll}
>
    <slot />
</div>

<style>
    .omnibox-section-track {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
        min-height: 0;
        flex: 1;
        -webkit-overflow-scrolling: touch;
    }

    .omnibox-section-track::-webkit-scrollbar {
        height: 6px;
    }

    .omnibox-section-track::-webkit-scrollbar-thumb {
        background: var(--st-border-color, rgba(255, 255, 255, 0.2));
        border-radius: 3px;
    }
</style>
