<script>
    /**
     * Navigation overlay: optional history + window slides + create slide; view modes;
     * quick actions; overscroll view picker. See docs/interfaces/interface_tabs_view.md
     */
    import { tick, createEventDispatcher } from "svelte";
    import GalleryView from "./GalleryView.svelte";
    import IconView from "./IconView.svelte";
    import ListView from "./ListView.svelte";
    import HistoryView from "./HistoryView.svelte";
    import OverscrollRevealHost from "./OverscrollRevealHost.svelte";

    const dispatch = createEventDispatcher();

    /** When false (toolbar), only window slides — same as legacy carousel */
    export let includeEdgeSlides = false;

    export let windows = [];
    /** list | icon | gallery | overview */
    export let viewMode = "list";

    export let currentTab = null;
    export let selectedTab = null;

    /**
     * Slide index: with edges — 0 history, 1..N windows, N+1 create.
     * Without edges — 0..N-1 windows only.
     */
    export let slideIndex = 0;

    /** In overview mode, which window row receives ↑↓ tab selection */
    export let overviewFocusedWindowIndex = 0;

    let trackEl = null;
    let programmaticScroll = false;
    let viewPickerRevealed = false;

    let historyViewRef;

    $: windowsList = [...(windows || [])]
        .filter((w) => w.tabs?.length > 0)
        .sort((a, b) => a.id - b.id);

    $: nWindows = windowsList.length;

    $: totalSlides =
        nWindows === 0 ? 0 : includeEdgeSlides ? nWindows + 2 : nWindows;

    $: if (totalSlides > 0 && slideIndex >= totalSlides) {
        slideIndex = totalSlides - 1;
    }
    $: if (totalSlides > 0 && slideIndex < 0) {
        slideIndex = 0;
    }

    function slideKind(i) {
        if (!includeEdgeSlides || nWindows === 0) return "window";
        if (i === 0) return "history";
        if (i === nWindows + 1) return "create";
        return "window";
    }

    function windowIndexFromSlide(i) {
        if (!includeEdgeSlides) return i;
        return i - 1;
    }

    $: kind = nWindows > 0 ? slideKind(slideIndex) : null;

    /** Which window dot is active; -1 when history/create/overview */
    $: dotActiveIndex =
        viewMode === "overview"
            ? -1
            : !includeEdgeSlides
              ? slideIndex
              : kind === "window"
                ? slideIndex - 1
                : -1;

    $: activeWindow =
        kind === "window"
            ? windowsList[windowIndexFromSlide(slideIndex)]
            : null;

    $: if (kind === "window" && viewMode !== "overview" && activeWindow) {
        const tabs = [...activeWindow.tabs].sort((a, b) => a.index - b.index);
        const pick = tabs.find((t) => t.active) ?? tabs[0] ?? null;
        if (
            pick &&
            (!selectedTab || selectedTab.windowId !== activeWindow.id)
        ) {
            selectedTab = pick;
        }
    }

    $: if (viewMode === "overview" && nWindows > 0) {
        if (overviewFocusedWindowIndex >= nWindows) {
            overviewFocusedWindowIndex = nWindows - 1;
        }
        if (overviewFocusedWindowIndex < 0) {
            overviewFocusedWindowIndex = 0;
        }
        const ow = windowsList[overviewFocusedWindowIndex];
        if (ow) {
            const tabs = [...ow.tabs].sort((a, b) => a.index - b.index);
            const pick =
                selectedTab?.windowId === ow.id
                    ? selectedTab
                    : (tabs.find((t) => t.active) ?? tabs[0]);
            if (pick && selectedTab?.id !== pick.id) {
                selectedTab = pick;
            }
        }
    }

    let lastScrolledIndex = -1;

    async function scrollTrackToIndex(i) {
        await tick();
        if (!trackEl || totalSlides <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const target = Math.max(0, Math.min(i, totalSlides - 1)) * w;
        if (Math.abs(trackEl.scrollLeft - target) < 2) return;
        programmaticScroll = true;
        trackEl.scrollTo({ left: target, behavior: "auto" });
        requestAnimationFrame(() => {
            programmaticScroll = false;
        });
    }

    $: if (trackEl && totalSlides > 0 && slideIndex !== lastScrolledIndex) {
        if (viewMode !== "overview") {
            lastScrolledIndex = slideIndex;
            scrollTrackToIndex(slideIndex);
        }
    }

    function onTrackScroll() {
        if (programmaticScroll || !trackEl || totalSlides <= 0) return;
        if (viewMode === "overview") return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const i = Math.round(trackEl.scrollLeft / w);
        const clamped = Math.max(0, Math.min(totalSlides - 1, i));
        if (clamped !== slideIndex) {
            lastScrolledIndex = clamped;
            slideIndex = clamped;
        }
    }

    function goToWindowDot(i) {
        if (i < 0 || i >= nWindows) return;
        slideIndex = includeEdgeSlides ? i + 1 : i;
    }

    function sortedTabs(win) {
        return [...(win?.tabs || [])].sort((a, b) => a.index - b.index);
    }

    function setViewMode(m) {
        const was = viewMode;
        viewMode = m;
        viewPickerRevealed = false;
        if (was === "overview" && m !== "overview") {
            lastScrolledIndex = -1;
            tick().then(() => scrollTrackToIndex(slideIndex));
        }
    }

    function onOverviewSectionFocus(winIndex) {
        overviewFocusedWindowIndex = winIndex;
        const win = windowsList[winIndex];
        if (!win) return;
        const tabs = sortedTabs(win);
        const pick = tabs.find((x) => x.active) ?? tabs[0];
        if (pick) selectedTab = pick;
    }

    /** @param {number} delta */
    export function historyMoveSelection(delta) {
        historyViewRef?.moveSelection?.(delta);
    }

    export function historyActivateSelection() {
        return historyViewRef?.activateSelectedRow?.();
    }

    export function getNavSlideKind() {
        if (viewMode === "overview") return "window";
        return kind;
    }

    function forwardTabActivate(e) {
        dispatch("activatetab", e.detail);
    }

    async function goFooterHistory() {
        if (!includeEdgeSlides) {
            dispatch("footerhistory");
            return;
        }
        viewPickerRevealed = false;
        if (viewMode === "overview") {
            viewMode = "list";
            await tick();
            lastScrolledIndex = -1;
        }
        slideIndex = 0;
    }

    async function goFooterAdd() {
        if (!includeEdgeSlides) {
            dispatch("footeradd");
            return;
        }
        viewPickerRevealed = false;
        if (viewMode === "overview") {
            viewMode = "list";
            await tick();
            lastScrolledIndex = -1;
        }
        slideIndex = nWindows + 1;
    }
</script>

{#if nWindows > 0}
    <div class="tabs-view-card">
        {#if viewMode === "overview"}
            <div class="overview-wrap">
                {#each windowsList as win, wi (win.id)}
                    <section
                        class="overview-section"
                        class:focused={wi === overviewFocusedWindowIndex}
                    >
                        <div
                            class="overview-label"
                            on:click={() => onOverviewSectionFocus(wi)}
                            on:keydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onOverviewSectionFocus(wi);
                                }
                            }}
                            role="button"
                            tabindex="0"
                        >
                            Window {wi + 1}
                        </div>
                        <IconView
                            tabs={sortedTabs(win)}
                            bind:selectedTab
                            bind:currentTab
                            on:pick={() => onOverviewSectionFocus(wi)}
                            on:activatetab={forwardTabActivate}
                        />
                    </section>
                {/each}
            </div>
        {:else}
            <div class="track" bind:this={trackEl} on:scroll={onTrackScroll}>
                {#if includeEdgeSlides}
                    <section class="slide">
                        <div class="edge-label">History</div>
                        <HistoryView bind:this={historyViewRef} />
                    </section>
                {/if}
                {#each windowsList as win (win.id)}
                    {@const tabs = sortedTabs(win)}
                    <section class="slide">
                        {#if windowsList.length > 1 || win.name}
                            <div class="group-header">
                                <div class="group-label">
                                    {win.name || tabs.length + " tabs"}
                                </div>
                                <div class="group-menu-key">
                                    <kbd>⌥</kbd>
                                </div>
                            </div>
                        {/if}
                        {#if viewMode === "icon"}
                            <IconView
                                {tabs}
                                bind:selectedTab
                                bind:currentTab
                                on:activatetab={forwardTabActivate}
                            />
                        {:else if viewMode === "gallery"}
                            <GalleryView
                                {tabs}
                                {currentTab}
                                bind:selectedTab
                                on:activatetab={forwardTabActivate}
                            />
                        {:else}
                            <ListView
                                {tabs}
                                bind:currentTab
                                bind:selectedTab
                                on:activatetab={forwardTabActivate}
                            />
                        {/if}
                    </section>
                {/each}
                {#if includeEdgeSlides}
                    <section class="slide">
                        <div class="create-slide">
                            <div class="edge-label">New window</div>
                            <p class="create-hint">
                                Tap <kbd>Space</kbd> to open a new window.
                            </p>
                            <p class="create-hint">
                                Hold <kbd>Space</kbd> to open a new incognito window.
                            </p>
                        </div>
                    </section>
                {/if}
            </div>
        {/if}
        {#if nWindows > 1}
            <div
                class="tabs-footer"
                role="toolbar"
                aria-label="Navigation shortcuts"
            >
                <button
                    type="button"
                    class="footer-icon-btn"
                    aria-label="History"
                    on:click={goFooterHistory}
                >
                    <span class="material-symbols-rounded">history</span>
                </button>
                <div class="dots" role="tablist" aria-label="Open windows">
                    {#each windowsList as _, i}
                        <button
                            type="button"
                            class="dot"
                            class:active={i === dotActiveIndex}
                            role="tab"
                            aria-selected={i === dotActiveIndex}
                            aria-label="Window {i + 1}"
                            on:click={() => goToWindowDot(i)}
                        />
                    {/each}
                </div>
                <button
                    type="button"
                    class="footer-icon-btn"
                    aria-label="New window"
                    on:click={goFooterAdd}
                >
                    <span class="material-symbols-rounded">add</span>
                </button>
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
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        overflow-x: hidden;
        overflow-y: auto;
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

    .group-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
    }

    .group-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #a0a0a0);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .group-menu-key {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .group-menu-key kbd {
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .edge-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #a0a0a0);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .create-slide {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        width: 100%;
        gap: 20px;
    }

    .create-hint {
        margin: 0;
        font-size: 13px;
        color: var(--st-text-muted, #aaa);
    }

    .create-hint kbd {
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .overview-wrap {
        width: 100%;
        min-height: 120px;
    }

    .overview-section {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .overview-section.focused {
        outline: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.2));
        outline-offset: 2px;
        border-radius: 6px;
    }

    .overview-label {
        font-size: 11px;
        color: var(--st-text-muted, #888);
        margin-bottom: 6px;
        cursor: pointer;
    }

    .dots {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 8px 12px;

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

    .tabs-footer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        height: 40px;
        width: calc(100% - 20px);
        padding: 0px 10px;
        border-top: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .footer-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 34px;
        border-radius: 8px;

        border: none;
        cursor: pointer;
        padding: 0;
    }

    .footer-icon-btn:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.14));
    }

    .footer-icon-btn .material-symbols-rounded {
        font-size: 25px;
        color: #ffffff;
        font-variation-settings:
            "FILL" 1,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }
</style>
