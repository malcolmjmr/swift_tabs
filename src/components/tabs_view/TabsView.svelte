<script>
    /**
     * Navigation overlay: one window’s tabs per horizontal “page”, window dots below.
     * See docs/needs/need_window_management.md (TabsView navigation model).
     */
    import { tick } from "svelte";
    import GalleryView from "./GalleryView.svelte";
    import IconView from "./IconView.svelte";
    import ListView from "./ListView.svelte";

    export let windows = [];
    export let viewType = "list";

    export let currentTab = null;
    export let selectedTab = null;

    /** Index into sorted non-empty windows list; two-way bound from App in navigation mode */
    export let carouselIndex = 0;

    let trackEl = null;
    let programmaticScroll = false;

    $: windowsList = [...(windows || [])]
        .filter((w) => w.tabs?.length > 0)
        .sort((a, b) => a.id - b.id);

    $: nWindows = windowsList.length;

    $: if (nWindows > 0 && carouselIndex >= nWindows) {
        carouselIndex = nWindows - 1;
    }

    $: activeWindow =
        nWindows > 0 ? windowsList[Math.max(0, carouselIndex)] : null;

    /** Keep selection in the visible window: default to active tab in that window */
    $: if (activeWindow) {
        const tabs = [...activeWindow.tabs].sort((a, b) => a.index - b.index);
        const pick = tabs.find((t) => t.active) ?? tabs[0] ?? null;
        if (
            pick &&
            (!selectedTab || selectedTab.windowId !== activeWindow.id)
        ) {
            selectedTab = pick;
        }
    }

    let lastScrolledIndex = -1;

    async function scrollTrackToIndex(i) {
        await tick();
        if (!trackEl || nWindows <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const target = Math.max(0, Math.min(i, nWindows - 1)) * w;
        if (Math.abs(trackEl.scrollLeft - target) < 2) return;
        programmaticScroll = true;
        trackEl.scrollTo({ left: target, behavior: "auto" });
        requestAnimationFrame(() => {
            programmaticScroll = false;
        });
    }

    $: if (trackEl && nWindows > 0 && carouselIndex !== lastScrolledIndex) {
        lastScrolledIndex = carouselIndex;
        scrollTrackToIndex(carouselIndex);
    }

    function onTrackScroll() {
        if (programmaticScroll || !trackEl || nWindows <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const i = Math.round(trackEl.scrollLeft / w);
        const clamped = Math.max(0, Math.min(nWindows - 1, i));
        if (clamped !== carouselIndex) {
            lastScrolledIndex = clamped;
            carouselIndex = clamped;
        }
    }

    function goToWindow(i) {
        if (i < 0 || i >= nWindows) return;
        carouselIndex = i;
    }

    function sortedTabs(win) {
        return [...(win?.tabs || [])].sort((a, b) => a.index - b.index);
    }
</script>

{#if nWindows > 0}
    <div class="tabs-view-card">
        <div
            class="track"
            bind:this={trackEl}
            on:scroll={onTrackScroll}
        >
            {#each windowsList as win (win.id)}
                {@const tabs = sortedTabs(win)}
                <section class="slide">
                    <div class="slide-scroll">
                        {#if viewType === "icon"}
                            <IconView {tabs} bind:selectedTab bind:currentTab />
                        {:else if viewType === "gallery"}
                            <GalleryView {tabs} {currentTab} bind:selectedTab />
                        {:else}
                            <ListView {tabs} bind:currentTab bind:selectedTab />
                        {/if}
                    </div>
                </section>
            {/each}
        </div>
        {#if nWindows > 1}
            <div
                class="dots"
                role="tablist"
                aria-label="Open windows"
            >
                {#each windowsList as _, i}
                    <button
                        type="button"
                        class="dot"
                        class:active={i === carouselIndex}
                        role="tab"
                        aria-selected={i === carouselIndex}
                        aria-label="Window {i + 1}"
                        on:click={() => goToWindow(i)}
                    />
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .tabs-view-card {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999990;
        width: 360px;
        max-width: calc(100vw - 40px);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        font-family: system-ui, -apple-system, sans-serif;
        overflow: hidden;
    }

    .track {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
        min-height: 0;
    }

    .slide {
        flex: 0 0 100%;
        width: 100%;
        min-width: 0;
        scroll-snap-align: start;
        box-sizing: border-box;
    }

    .slide-scroll {
        max-height: min(50vh, 420px);
        overflow-x: hidden;
        overflow-y: auto;
        padding: 8px;
        box-sizing: border-box;
    }

    .dots {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 8px 12px;
        border-top: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
        flex-shrink: 0;
    }

    .dot {
        width: 8px;
        height: 8px;
        padding: 0;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        background: var(--st-text-muted, #808080);
        opacity: 0.45;
        transition:
            opacity 0.15s,
            transform 0.15s;
    }

    .dot:hover {
        opacity: 0.75;
    }

    .dot.active {
        opacity: 1;
        background: var(--st-text-primary, #ffffff);
        transform: scale(1.15);
    }
</style>
