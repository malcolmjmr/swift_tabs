<script>
    /**
     * Omnibox shell: query, horizontal section index / track, visited flags,
     * picker + strip UI, and keyboard/wheel routing to the active section panel.
     */
    import { createEventDispatcher, onMount } from "svelte";
    import { chromeService } from "../services/chromeApi";
    import {
        DEFAULT_SECTION_ID,
        DEFAULT_SECTION_INDEX,
        PLACEHOLDER_SECTION_IDS,
        SECTIONS,
    } from "./omnibox/omniboxSections.js";
    import { isUrlLike } from "./omnibox/omniboxShared.js";
    import OmniboxSectionAppsPanel from "./omnibox/sections/OmniboxSectionAppsPanel.svelte";
    import OmniboxSectionBookmarks from "./omnibox/sections/OmniboxSectionBookmarks.svelte";
    import OmniboxSectionHighlights from "./omnibox/sections/OmniboxSectionHighlights.svelte";
    import OmniboxSectionHistory from "./omnibox/sections/OmniboxSectionHistory.svelte";
    import OmniboxSectionNewsPanel from "./omnibox/sections/OmniboxSectionNewsPanel.svelte";
    import OmniboxSectionPlaceholder from "./omnibox/sections/OmniboxSectionPlaceholder.svelte";
    import OmniboxSectionTabs from "./omnibox/sections/OmniboxSectionTabs.svelte";
    import OmniboxSectionTrendingPanel from "./omnibox/sections/OmniboxSectionTrendingPanel.svelte";
    import OmniboxSectionTrack from "./omnibox/OmniboxSectionTrack.svelte";

    export let query = "";
    export let activeTabId = null;
    export let windows = [];

    const dispatch = createEventDispatcher();

    let inputEl;
    let activeSections = [DEFAULT_SECTION_ID];
    let sectionResultsOpen = false;
    let selectedSectionIndex = DEFAULT_SECTION_INDEX;
    let searchTimeout = null;
    let sectionScrollDelta = 0;

    let sectionSlideIndex = DEFAULT_SECTION_INDEX;
    /** @type {Record<string, boolean>} */
    let visitedSectionIds = {};

    let debouncedQuery = "";

    /** @type {Record<string, import('svelte').SvelteComponent | null>} */
    let panelRefs = Object.fromEntries(SECTIONS.map((s) => [s.id, null]));

    $: activeOmniboxSectionRef = panelRefs[activeSections[0]] ?? null;

    const SECTION_SCROLL_THRESHOLD = 50;
    const SEARCH_DEBOUNCE_MS = 120;

    const PLACEHOLDER_MESSAGES = {
        tasks: "Tasks are not available yet",
        reading: "Reading is not available yet",
        shopping: "Shopping is not available yet",
        learning: "Learning is not available yet",
        data: "Data are not available yet",
        files: "Files are not available yet",
    };

    $: showSectionPicker = !query.trim() && !sectionResultsOpen;
    $: showSectionStrip = !showSectionPicker;

    onMount(() => {
        inputEl?.focus();
        document.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });

        return () =>
            document.removeEventListener("wheel", handleWheel, {
                capture: true,
            });
    });

    function markSectionVisited(id) {
        if (!id || visitedSectionIds[id]) return;
        visitedSectionIds = { ...visitedSectionIds, [id]: true };
    }

    function handleInput() {
        const q = query.trim();
        if (!q.length) {
            sectionResultsOpen = false;
            return;
        }
        if (!sectionResultsOpen) {
            sectionResultsOpen = true;
            activeSections = [SECTIONS[selectedSectionIndex].id];
            sectionSlideIndex = selectedSectionIndex;
            markSectionVisited(activeSections[0]);
            debouncedQuery = query;
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedQuery = query;
        }, SEARCH_DEBOUNCE_MS);
    }

    function expandIntoSection(sectionId) {
        const idx = SECTIONS.findIndex((s) => s.id === sectionId);
        if (idx >= 0) {
            selectedSectionIndex = idx;
            sectionSlideIndex = idx;
        }
        activeSections = [sectionId];
        sectionResultsOpen = true;
        debouncedQuery = query;
        markSectionVisited(sectionId);
    }

    $: if (sectionResultsOpen) {
        const id = SECTIONS[sectionSlideIndex]?.id;
        if (id && activeSections[0] !== id) {
            selectedSectionIndex = sectionSlideIndex;
            activeSections = [id];
            markSectionVisited(id);
        }
    }

    function goBackToSectionPicker() {
        sectionResultsOpen = false;
    }

    function movePickerSection(direction) {
        selectedSectionIndex =
            (selectedSectionIndex + direction + SECTIONS.length) %
            SECTIONS.length;
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (activeOmniboxSectionRef?.handleOmniboxEscape?.()) return;
            dispatch("close");
            return;
        }

        const qEmpty = !query.trim();
        const inPicker = qEmpty && !sectionResultsOpen;

        if (inPicker) {
            if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                expandIntoSection(SECTIONS[selectedSectionIndex].id);
                return;
            }
            if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp" ||
                event.key === "ArrowRight" ||
                event.key === "ArrowDown"
            ) {
                event.preventDefault();
                movePickerSection(
                    event.key === "ArrowLeft" || event.key === "ArrowUp"
                        ? -1
                        : 1,
                );
            }
            return;
        }

        if (
            qEmpty &&
            sectionResultsOpen &&
            (event.key === "Backspace" || event.key === "Delete")
        ) {
            event.preventDefault();
            if (activeOmniboxSectionRef?.handleOmniboxBackspace?.()) return;
            goBackToSectionPicker();
            return;
        }

        if (event.key === "Enter" && sectionResultsOpen && isUrlLike(query)) {
            event.preventDefault();
            void chromeService.createTab({
                url: query.trim(),
                active: true,
            });
            dispatch("close");
            return;
        }

        if (
            qEmpty &&
            sectionResultsOpen &&
            !activeOmniboxSectionRef?.consumesEmptyQueryStripArrows?.()
        ) {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                const i = SECTIONS.findIndex((s) => s.id === activeSections[0]);
                const prev =
                    SECTIONS[(i - 1 + SECTIONS.length) % SECTIONS.length];
                expandIntoSection(prev.id);
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                const i = SECTIONS.findIndex((s) => s.id === activeSections[0]);
                const next = SECTIONS[(i + 1) % SECTIONS.length];
                expandIntoSection(next.id);
                return;
            }
        }

        if (
            sectionResultsOpen &&
            activeOmniboxSectionRef &&
            typeof activeOmniboxSectionRef.handleOmniboxKeydown === "function" &&
            activeOmniboxSectionRef.handleOmniboxKeydown(event)
        ) {
            return;
        }
    }

    function handleWheel(event) {
        const t = event.target;
        const el = t instanceof Element ? t : t?.parentElement;
        if (!el?.closest(".omnibox-overlay")) {
            return;
        }
        if (el?.closest(".section-strip-scroll")) {
            return;
        }
        if (el?.closest("[data-omnibox-section-track]")) {
            return;
        }
        if (
            el?.closest(".news-detail-scroll") ||
            el?.closest(".trending-detail-scroll") ||
            el?.closest(".apps-detail-scroll") ||
            el?.closest(".apps-icon-scroll")
        ) {
            return;
        }

        const qEmpty = !query.trim();
        const inPicker = qEmpty && !sectionResultsOpen;

        if (inPicker) {
            if (!el?.closest(".section-chips")) {
                return;
            }
            event.preventDefault();
            const delta = event.deltaY + event.deltaX;
            sectionScrollDelta += delta;
            if (Math.abs(sectionScrollDelta) >= SECTION_SCROLL_THRESHOLD) {
                const direction = sectionScrollDelta > 0 ? -1 : 1;
                sectionScrollDelta = 0;
                movePickerSection(direction);
            }
            return;
        }

        return;
    }
</script>

<div
    class="omnibox-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Search or enter URL"
>
    <div class="omnibox-container">
        <div class="omnibox-header">
            <div class="search-field">
                <span class="material-symbols-rounded search-icon">search</span>
                <input
                    bind:this={inputEl}
                    type="text"
                    class="omnibox-input"
                    placeholder="Search or enter URL..."
                    bind:value={query}
                    on:input={handleInput}
                    on:keydown={handleKeydown}
                />
            </div>
            {#if showSectionStrip}
                <div
                    class="section-strip-scroll"
                    role="tablist"
                    aria-label="Search sections"
                >
                    <div class="section-strip-padding"></div>
                    {#each SECTIONS as section}
                        <button
                            type="button"
                            class="section-chip"
                            class:selected={activeSections[0] === section.id}
                            role="tab"
                            aria-selected={activeSections[0] === section.id}
                            on:click={() => expandIntoSection(section.id)}
                        >
                            <span
                                class="material-symbols-rounded section-chip-icon"
                                >{section.icon}</span
                            >
                            <span class="section-chip-text"
                                >{section.label}</span
                            >
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <div
            class="results-container"
            class:results-container--expanded={!showSectionPicker}
        >
            {#if showSectionPicker}
                <div
                    class="section-chips"
                    role="listbox"
                    aria-label="Search sections"
                >
                    {#each SECTIONS as section, i}
                        <button
                            type="button"
                            class="section-chip"
                            class:selected={selectedSectionIndex === i}
                            role="option"
                            aria-selected={selectedSectionIndex === i}
                            on:click={() => expandIntoSection(section.id)}
                        >
                            <span
                                class="material-symbols-rounded section-chip-icon"
                                >{section.icon}</span
                            >
                            <span class="section-chip-text"
                                >{section.label}</span
                            >
                        </button>
                    {/each}
                </div>
            {/if}
            <div
                class="omnibox-expanded-shell"
                class:omnibox-expanded-shell--concealed={showSectionPicker}
            >
                <div class="results-body results-body--with-track">
                    <OmniboxSectionTrack
                        bind:activeIndex={sectionSlideIndex}
                        slideCount={SECTIONS.length}
                    >
                        {#each SECTIONS as section (section.id)}
                            <div class="omnibox-track-slide">
                                {#if section.id === "apps"}
                                    <OmniboxSectionAppsPanel
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                        {sectionResultsOpen}
                                        on:submit={() => dispatch("submit")}
                                        on:close={() => dispatch("close")}
                                    />
                                {:else if section.id === "tabs"}
                                    <OmniboxSectionTabs
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                        {windows}
                                        {activeTabId}
                                        on:submit={() => dispatch("submit")}
                                        on:close={() => dispatch("close")}
                                    />
                                {:else if section.id === "history"}
                                    <OmniboxSectionHistory
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                        on:submit={() => dispatch("submit")}
                                        on:close={() => dispatch("close")}
                                    />
                                {:else if section.id === "news"}
                                    <OmniboxSectionNewsPanel
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                    />
                                {:else if section.id === "trending"}
                                    <OmniboxSectionTrendingPanel
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                    />
                                {:else if section.id === "highlights"}
                                    <OmniboxSectionHighlights
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                        on:submit={() => dispatch("submit")}
                                        on:close={() => dispatch("close")}
                                    />
                                {:else if section.id === "bookmarks"}
                                    <OmniboxSectionBookmarks
                                        bind:this={panelRefs[section.id]}
                                        dataEnabled={!!visitedSectionIds[section
                                            .id]}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                        {query}
                                        {debouncedQuery}
                                        on:submit={() => dispatch("submit")}
                                        on:close={() => dispatch("close")}
                                    />
                                {:else if PLACEHOLDER_SECTION_IDS.has(section.id)}
                                    <OmniboxSectionPlaceholder
                                        bind:this={panelRefs[section.id]}
                                        sectionId={section.id}
                                        message={PLACEHOLDER_MESSAGES[
                                            section.id
                                        ] || "Not available yet"}
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                    />
                                {:else}
                                    <OmniboxSectionPlaceholder
                                        bind:this={panelRefs[section.id]}
                                        sectionId={section.id}
                                        message="Not available yet"
                                        isActiveSlide={activeSections[0] ===
                                            section.id}
                                    />
                                {/if}
                            </div>
                        {/each}
                    </OmniboxSectionTrack>
                </div>
            </div>

            {#if isUrlLike(query)}
                <div class="url-hint">
                    Press Enter to open <code>{query.trim()}</code>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .omnibox-overlay {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000001;
        pointer-events: auto;
    }

    .omnibox-container {
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        min-width: 600px;
        max-width: 600px;
        overflow: hidden;
    }

    .omnibox-header {
        display: flex;
        flex-direction: column;
        padding: 0px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .search-field {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
    }

    .search-icon {
        font-size: 20px;
        color: var(--st-text-muted, #808080);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .omnibox-input {
        flex: 1;
        font-size: 15px;
        border: none;
        outline: none;
        color: var(--st-text-primary, #ffffff);
        background: transparent;
    }

    .omnibox-input::placeholder {
        color: var(--st-text-muted, #808080);
    }

    .section-strip-scroll {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0px 0px 10px 0px;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
    }

    .section-strip-scroll::-webkit-scrollbar {
        height: 6px;
    }

    .section-strip-scroll::-webkit-scrollbar-thumb {
        background: var(--st-border-color, rgba(255, 255, 255, 0.2));
        border-radius: 3px;
    }

    .section-strip-padding {
        width: 15px;
    }

    .section-strip-scroll .section-chip {
        flex-shrink: 0;
        white-space: nowrap;
    }

    .section-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 6px 16px 8px;
        align-items: flex-start;
        align-content: flex-start;
    }

    .section-chip {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        padding: 5px 11px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 999px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-muted, #aaa);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 0.15s,
            color 0.15s,
            border-color 0.15s;
        font-family: inherit;
    }

    .section-chip-icon {
        font-size: 16px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
    }

    .section-chip-text {
        line-height: 1.2;
    }

    .section-chip:hover {
        color: var(--st-text-primary, #fff);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .section-chip.selected {
        color: var(--st-text-primary, #fff);
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.25));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.14));
    }

    .results-container {
        padding: 8px 0;
    }

    .results-container--expanded {
        display: flex;
        flex-direction: column;
        padding: 0;
        min-height: 320px;
    }

    .omnibox-expanded-shell {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .omnibox-expanded-shell--concealed {
        display: none;
    }

    .results-body--with-track {
        overflow: hidden;
        padding: 0;
    }

    :global(.omnibox-section-track) .omnibox-track-slide {
        flex: 0 0 100%;
        width: 100%;
        scroll-snap-align: start;
        min-height: 0;
        max-height: 320px;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 8px 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }

    .results-body {
        flex: 1;
        min-height: 320px;
        max-height: 320px;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
    }

    .omnibox-track-slide :global(.empty-state) {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
    }

    .url-hint {
        padding: 8px 16px;
        border-top: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        font-size: 12px;
        color: var(--st-text-muted, #888);
    }

    .url-hint code {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--st-text-primary, #fff);
    }
</style>
