<script>
    /**
     * Navigation overlay: optional history + window slides + create slide; view modes;
     * quick actions; overscroll view picker. See docs/interfaces/interface_tabs_view.md
     */
    import { tick, createEventDispatcher, onDestroy } from "svelte";
    import GalleryView from "./GalleryView.svelte";
    import IconView from "./IconView.svelte";
    import ListView from "./ListView.svelte";
    import HistoryView from "./HistoryView.svelte";
    import CreateNewWindowView from "./CreateNewWindowView.svelte";
    import historyIcon from "../../icons/history.svg";
    import addIcon from "../../icons/add.svg";

    const dispatch = createEventDispatcher();

    /** When false (toolbar), only window slides — same as legacy carousel */
    export let includeEdgeSlides = false;

    export let windows = [];
    /** list | icon | gallery | overview */
    export let viewMode = "list";

    export let currentTab = null;
    export let selectedTab = null;
    /** Tab ids in persistent multi-select (navigation mode). */
    export let multiSelectedIds = [];

    /**
     * Slide index: with edges — 0 history, 1..N windows, N+1 create.
     * Without edges — 0..N-1 windows only.
     */
    export let slideIndex = 0;

    /** In overview mode, which window row receives ↑↓ tab selection */
    export let overviewFocusedWindowIndex = 0;

    let trackEl = null;
    /** @type {ResizeObserver | null} */
    let trackResizeObserver = null;
    let programmaticScroll = false;
    let viewPickerRevealed = false;

    let historyViewRef;
    let createNewWindowViewRef;

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

    /** Footer icon highlight when the corresponding edge slide is visible */
    $: historyFooterActive =
        includeEdgeSlides && viewMode !== "overview" && kind === "history";
    $: createFooterActive =
        includeEdgeSlides && viewMode !== "overview" && kind === "create";

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
    let trackIsInitialized = false;

    async function scrollTrackToIndex(i) {
        await tick();
        if (!trackEl || totalSlides <= 0) return;
        const w = trackEl.clientWidth;
        if (w <= 0) return;
        const target = Math.max(0, Math.min(i, totalSlides - 1)) * w;
        if (Math.abs(trackEl.scrollLeft - target) < 2) return;
        programmaticScroll = true;
        trackEl.scrollTo({
            left: target,
            behavior: trackIsInitialized ? "smooth" : "instant",
        });
        trackIsInitialized = true;
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

    export async function historyActivateSelection() {
        await historyViewRef?.activateSelectedRow?.();
    }

    export function historyGoBack() {
        return historyViewRef?.goBack?.() ?? false;
    }

    export function createSlideMoveSelection(delta) {
        createNewWindowViewRef?.moveSelection?.(delta);
    }

    export async function createSlideActivateSelection() {
        await createNewWindowViewRef?.activateSelectedRow?.();
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

    const OVERFLOW_EPS = 2;

    /** @param {HTMLElement} el @param {HTMLElement} scroller */
    function contentOffsetTop(el, scroller) {
        const sr = scroller.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        return er.top - sr.top + scroller.scrollTop;
    }

    /**
     * @param {boolean} instant - true for resize/layout: snap scroll. false: smooth after selection paint.
     */
    function syncListScrollForSelection(instant = true) {
        if (
            viewMode !== "list" ||
            kind !== "window" ||
            !activeWindow ||
            !selectedTab ||
            selectedTab.windowId !== activeWindow.id ||
            !trackEl
        ) {
            return;
        }
        const scroller = trackEl.querySelector(
            `section.slide[data-window-id="${activeWindow.id}"] .list-slide-scroll`,
        );
        if (!scroller) return;

        function setScrollTop(target) {
            const t = Math.max(
                0,
                Math.min(
                    Math.max(0, scroller.scrollHeight - scroller.clientHeight),
                    target,
                ),
            );
            if (Math.abs(scroller.scrollTop - t) < 2) return;
            if (instant) {
                scroller.scrollTop = t;
            } else {
                scroller.scrollTo({ top: t, behavior: "smooth" });
            }
        }

        if (scroller.scrollHeight <= scroller.clientHeight + OVERFLOW_EPS) {
            if (scroller.scrollTop !== 0) setScrollTop(0);
            return;
        }

        const items = scroller.querySelectorAll(".list-view-item");
        if (items.length === 0) return;

        const tabs = sortedTabs(activeWindow);
        const selectedIndex = tabs.findIndex((t) => t.id === selectedTab.id);
        if (selectedIndex < 0) return;

        const row0 = items[0];
        const row1 = items.length > 1 ? items[1] : row0;
        const rowStep =
            row1.offsetTop - row0.offsetTop ||
            row0.getBoundingClientRect().height;
        if (rowStep <= 0) return;

        const visibleCount = Math.max(
            1,
            Math.floor(scroller.clientHeight / rowStep),
        );
        let anchorIndex = Math.floor((visibleCount - 1) / 2);
        anchorIndex = Math.min(anchorIndex, items.length - 1);

        const ySel = contentOffsetTop(items[selectedIndex], scroller);
        const yAnchor = contentOffsetTop(items[anchorIndex], scroller);
        setScrollTop(ySel - yAnchor);
    }

    /** Selection paints on first frames; then smooth-scroll the list. */
    function scheduleListScrollSyncAfterSelection() {
        tick().then(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    syncListScrollForSelection(false);
                });
            });
        });
    }

    $: if (trackEl && typeof ResizeObserver !== "undefined") {
        trackResizeObserver?.disconnect();
        trackResizeObserver = new ResizeObserver(() => {
            syncListScrollForSelection(true);
        });
        trackResizeObserver.observe(trackEl);
    }

    onDestroy(() => {
        trackResizeObserver?.disconnect();
        trackResizeObserver = null;
    });

    $: totalTabCount = windowsList.reduce(
        (n, w) => n + sortedTabs(w).length,
        0,
    );

    $: showTabsFooter = nWindows > 1 || totalTabCount > 8;

    $: listScrollSyncKey =
        viewMode === "list" &&
        kind === "window" &&
        activeWindow &&
        selectedTab?.windowId === activeWindow.id
            ? [
                  selectedTab.id,
                  slideIndex,
                  sortedTabs(activeWindow)
                      .map((t) => t.id)
                      .join(","),
              ].join("|")
            : "";

    $: if (trackEl && listScrollSyncKey) {
        scheduleListScrollSyncAfterSelection();
    }
</script>

{#if nWindows > 0}
    <div
        class="tabs-view-card"
        data-demo="tabs-card"
        role="region"
        aria-label="Tabs navigation"
        on:contextmenu|capture|preventDefault
    >
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
                            {multiSelectedIds}
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
                    <section class="slide slide--column">
                        <div class="slide-body-scroll">
                            <HistoryView bind:this={historyViewRef} />
                        </div>
                    </section>
                {/if}
                {#each windowsList as win (win.id)}
                    {@const tabs = sortedTabs(win)}
                    <section
                        class="slide slide--column"
                        data-window-id={win.id}
                    >
                        {#if tabs.length > 8 || windowsList.length > 1 || win.name}
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
                            <div class="slide-body-scroll">
                                <IconView
                                    {tabs}
                                    {multiSelectedIds}
                                    bind:selectedTab
                                    bind:currentTab
                                    on:activatetab={forwardTabActivate}
                                />
                            </div>
                        {:else if viewMode === "gallery"}
                            <div class="slide-body-scroll">
                                <GalleryView
                                    {tabs}
                                    {multiSelectedIds}
                                    {currentTab}
                                    bind:selectedTab
                                    on:activatetab={forwardTabActivate}
                                />
                            </div>
                        {:else}
                            <div class="list-slide-scroll">
                                <ListView
                                    {tabs}
                                    {multiSelectedIds}
                                    bind:currentTab
                                    bind:selectedTab
                                    on:activatetab={forwardTabActivate}
                                />
                            </div>
                        {/if}
                    </section>
                {/each}
                {#if includeEdgeSlides}
                    <section class="slide slide--column">
                        <div class="slide-body-scroll">
                            <CreateNewWindowView
                                bind:this={createNewWindowViewRef}
                            />
                        </div>
                    </section>
                {/if}
            </div>
        {/if}
        {#if showTabsFooter}
            <div
                class="tabs-footer"
                role="toolbar"
                aria-label="Navigation shortcuts"
            >
                <button
                    type="button"
                    class="footer-icon-btn"
                    class:footer-icon-btn--active={historyFooterActive}
                    aria-label="History"
                    aria-current={historyFooterActive ? "page" : undefined}
                    on:click={goFooterHistory}
                >
                    <img
                        src={historyIcon}
                        alt=""
                        class="footer-icon-img"
                        aria-hidden="true"
                    />
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
                    class:footer-icon-btn--active={createFooterActive}
                    aria-label="New window"
                    aria-current={createFooterActive ? "page" : undefined}
                    on:click={goFooterAdd}
                >
                    <img
                        src={addIcon}
                        alt=""
                        class="footer-icon-img"
                        aria-hidden="true"
                    />
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
        max-height: calc(100vh - 40px);

        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));

        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        min-height: 150px;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        overflow-x: hidden;
        overflow-y: hidden;
    }

    .track {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        max-height: min(50vh, 420px);
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scroll-behavior: smooth;
    }

    .track::-webkit-scrollbar {
        display: none;
    }

    .slide {
        flex: 0 0 100%;
        width: 100%;
        min-width: 0;
        scroll-snap-align: start;
        box-sizing: border-box;
    }

    .slide--column {
        display: flex;
        flex-direction: column;
        align-self: stretch;
        min-height: 0;
    }

    .list-slide-scroll,
    .slide-body-scroll {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .group-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0px 2px;
        margin: 0px 10px;
        min-height: 40px;
        height: 40px;
        border-bottom: 1px solid #333333;
    }

    .group-label {
        font-size: 14px;
        font-weight: 600;
        color: #555555;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .group-menu-key {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0px 2px;
        border-radius: 4px;
    }

    .group-menu-key kbd {
        padding: 0px 4px;
        border-radius: 4px;
        background: #333;
        opacity: 0.8;
        height: 20px;
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }

    .overview-wrap {
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        max-height: min(50vh, 420px);
        overflow-y: auto;
        scrollbar-width: thin;
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
        padding: 0px;
        margin: 0 10px;
        border-top: 1px solid #333333;
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

    .footer-icon-btn .footer-icon-img {
        width: 25px;
        height: 25px;
        object-fit: contain;
        opacity: 0.42;
    }

    .footer-icon-btn--active .footer-icon-img {
        opacity: 1;
        filter: brightness(0) invert(1);
    }
</style>
