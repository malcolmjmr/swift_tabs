<script>
    import { onMount, tick } from "svelte";
    import OmniboxSectionCarousel from "./components/omnibox/OmniboxSectionCarousel.svelte";
    import { isUrlLike } from "./components/omnibox/omniboxShared.js";
    import {
        DEFAULT_SECTION_ID,
        DEFAULT_SECTION_INDEX,
        SECTIONS,
    } from "./components/omnibox/omniboxSections.js";
    import { chromeService } from "./services/chromeApi";

    /** Prefetch these omnibox sections so data is ready without visiting each slide first. */
    const PREFETCH_SECTION_IDS = [];

    function baseVisitedSectionIds() {
        const o = { [DEFAULT_SECTION_ID]: true };
        for (const id of PREFETCH_SECTION_IDS) o[id] = true;
        return o;
    }

    let windows = [];
    /** @type {number | null} */
    let activeTabId = null;
    /** @type {any} */
    let carouselRef = null;
    let query = "";
    let debouncedQuery = "";
    let loadError = null;
    let inputEl = null;
    let searchTimeout = null;

    let activeSections = [DEFAULT_SECTION_ID];
    let sectionSlideIndex = DEFAULT_SECTION_INDEX;
    /** @type {Record<string, boolean>} */
    let visitedSectionIds = baseVisitedSectionIds();

    const SEARCH_DEBOUNCE_MS = 120;

    function ensureMaterialFonts() {
        if (document.querySelector("link[data-swift-tabs-fonts]")) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
        link.setAttribute("data-swift-tabs-fonts", "");
        document.head.appendChild(link);
    }

    function markSectionVisited(id) {
        if (!id || visitedSectionIds[id]) return;
        visitedSectionIds = { ...visitedSectionIds, [id]: true };
    }

    $: {
        const id = SECTIONS[sectionSlideIndex]?.id;
        if (id && activeSections[0] !== id) {
            activeSections = [id];
            markSectionVisited(id);
        }
    }

    $: activePanel =
        carouselRef?.getPanelForSection?.(activeSections[0]) ?? null;

    function expandIntoSection(sectionId) {
        const idx = SECTIONS.findIndex((s) => s.id === sectionId);
        if (idx >= 0) sectionSlideIndex = idx;
        activeSections = [sectionId];
        debouncedQuery = query;
        markSectionVisited(sectionId);
    }

    function handleInput() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedQuery = query;
        }, SEARCH_DEBOUNCE_MS);
    }

    function resetAfterOmniboxAction() {
        query = "";
        debouncedQuery = "";
        visitedSectionIds = baseVisitedSectionIds();
        sectionSlideIndex = DEFAULT_SECTION_INDEX;
        activeSections = [DEFAULT_SECTION_ID];
        clearTimeout(searchTimeout);
        searchTimeout = null;
        tick().then(() => inputEl?.focus());
    }

    function handleKeydown(/** @type {KeyboardEvent} */ event) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (activePanel?.handleOmniboxEscape?.()) return;
            if (query.trim()) {
                query = "";
                debouncedQuery = "";
                return;
            }
            inputEl?.blur();
            return;
        }

        const qEmpty = !query.trim();

        if (qEmpty && (event.key === "Backspace" || event.key === "Delete")) {
            event.preventDefault();
            if (activePanel?.handleOmniboxBackspace?.()) return;
            return;
        }

        if (event.key === "Enter" && isUrlLike(query)) {
            event.preventDefault();
            const url = query.trim();
            if (activeTabId != null) {
                void chromeService.updateTabUrl(activeTabId, url);
            } else {
                void chromeService.createTab({ url, active: true });
            }
            return;
        }

        if (qEmpty && !activePanel?.consumesEmptyQueryStripArrows?.()) {
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
            activePanel &&
            typeof activePanel.handleOmniboxKeydown === "function" &&
            activePanel.handleOmniboxKeydown(event)
        ) {
            return;
        }
    }

    onMount(() => {
        ensureMaterialFonts();
        void (async () => {
            try {
                const [w, tab] = await Promise.all([
                    chromeService.getWindows(),
                    chromeService.getCurrentTab(),
                ]);
                windows = Array.isArray(w) ? w : [];
                activeTabId = tab?.id ?? null;
            } catch (e) {
                const msg =
                    e && typeof e === "object" && "message" in e
                        ? String(e.message)
                        : String(e);
                loadError =
                    msg ||
                    "Could not connect to the extension. Try reloading the extension.";
            }
        })();

        return () => clearTimeout(searchTimeout);
    });
</script>

<div class="newtab-page">
    {#if loadError}
        <p class="newtab-error">{loadError}</p>
    {:else}
        <div class="newtab-inner">
            <div class="newtab-search">
                <span class="material-symbols-rounded newtab-search__icon"
                    >search</span
                >
                <input
                    bind:this={inputEl}
                    type="text"
                    class="newtab-search__input"
                    placeholder="Search or enter a URL…"
                    aria-label="Search tabs, bookmarks, and history"
                    bind:value={query}
                    on:input={handleInput}
                    on:keydown={handleKeydown}
                />
            </div>

            <div
                class="newtab-section-row"
                role="tablist"
                aria-label="Search sections"
            >
                {#each SECTIONS as section}
                    <button
                        type="button"
                        class="newtab-section-chip"
                        class:newtab-section-chip--active={activeSections[0] ===
                            section.id}
                        role="tab"
                        aria-selected={activeSections[0] === section.id}
                        on:click={() => expandIntoSection(section.id)}
                    >
                        <span
                            class="material-symbols-rounded newtab-section-chip__icon"
                            >{section.icon}</span
                        >
                        <span class="newtab-section-chip__label"
                            >{section.label}</span
                        >
                    </button>
                {/each}
            </div>

            <div class="newtab-track">
                <OmniboxSectionCarousel
                    bind:this={carouselRef}
                    bind:sectionSlideIndex
                    sectionResultsOpen={true}
                    {query}
                    {debouncedQuery}
                    {windows}
                    {activeTabId}
                    activeSectionId={activeSections[0]}
                    {visitedSectionIds}
                    on:close={resetAfterOmniboxAction}
                    on:submit={resetAfterOmniboxAction}
                />
            </div>

            {#if isUrlLike(query)}
                <p class="newtab-url-hint">
                    Press <kbd>Enter</kbd> to open
                    <code>{query.trim()}</code> in this tab
                </p>
            {/if}
        </div>
    {/if}
</div>

<style>
    :global(html, body) {
        overflow: hidden;
        min-height: 100vh;
        min-width: 100vw;
        background: var(--st-newtab-bg, #0f0f0f);
    }
    .newtab-page {
        min-height: 100vh;
        margin: 0;
        box-sizing: border-box;
        padding: 50px 50px 0px 50px;
        display: flex;
        flex-direction: column;

        color: var(--st-text-primary, #f5f5f5);
    }

    .newtab-inner {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .newtab-search {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        border-radius: 12px;
        border: none;
        background: var(--st-newtab-search-bg, rgba(255, 255, 255, 0.06));
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
        transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
    }

    .newtab-search:focus-within {
        border-color: var(
            --st-newtab-search-border-focus,
            rgba(120, 170, 255, 0.55)
        );
        box-shadow:
            0 4px 28px rgba(0, 0, 0, 0.3),
            0 0 0 3px rgba(120, 170, 255, 0.12);
        background: var(--st-newtab-search-bg-focus, rgba(255, 255, 255, 0.08));
    }

    .newtab-search__icon {
        font-size: 28px;
        color: var(--st-text-muted, #9ca3af);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 28;
        flex-shrink: 0;
    }

    .newtab-search__input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        font-size: 16px;
        line-height: 1.35;
        color: inherit;
        font-family: inherit;
    }

    .newtab-search__input::placeholder {
        color: var(--st-text-muted, #6b7280);
    }

    .newtab-section-row {
        display: flex;
        flex-wrap: nowrap;
        gap: 8px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 0 2px;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
    }

    .newtab-section-row::-webkit-scrollbar {
        height: 5px;
    }

    .newtab-section-row::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
    }

    .newtab-section-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        padding: 8px 14px;
        border: 1px solid transparent;
        color: #555555;
        background-color: transparent;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition:
            background 0.12s ease,
            color 0.12s ease,
            border-color 0.12s ease;
    }

    .newtab-section-chip:hover {
        color: #fff;
    }

    .newtab-section-chip--active {
        color: #fff;
    }

    .newtab-section-chip__icon {
        font-size: 18px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
    }

    .newtab-section-chip__label {
        line-height: 1.2;
        white-space: nowrap;
    }

    .newtab-track {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        max-height: calc(100vh - 190px);
    }

    .newtab-track :global(.omnibox-section-carousel) {
        --omnibox-track-max-height: min(560px, calc(100vh - 280px));
    }

    .newtab-url-hint {
        margin: 0;
        font-size: 13px;
        color: var(--st-text-muted, #9ca3af);
    }

    .newtab-url-hint kbd {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .newtab-url-hint code {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--st-text-primary, #fff);
    }

    .newtab-error {
        color: #f87171;
        font:
            15px/1.5 system-ui,
            sans-serif;
        padding: 24px;
        max-width: 40em;
        margin: 0 auto;
    }
</style>
