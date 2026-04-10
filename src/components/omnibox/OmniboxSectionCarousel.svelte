<script>
    /**
     * Horizontal section track + all omnibox section panels. Shared by Omnibox overlay and NewTabPage.
     */
    import { createEventDispatcher } from "svelte";
    import { PLACEHOLDER_SECTION_IDS, SECTIONS } from "./omniboxSections.js";
    import OmniboxSectionAppsPanel from "./sections/OmniboxSectionAppsPanel.svelte";
    import OmniboxSectionBookmarks from "./sections/OmniboxSectionBookmarks.svelte";
    import OmniboxSectionFiles from "./sections/OmniboxSectionFiles.svelte";
    import OmniboxSectionHighlights from "./sections/OmniboxSectionHighlights.svelte";
    import OmniboxSectionHistory from "./sections/OmniboxSectionHistory.svelte";
    import OmniboxSectionReading from "./sections/OmniboxSectionReading.svelte";
    import OmniboxSectionNewsPanel from "./sections/OmniboxSectionNewsPanel.svelte";
    import OmniboxSectionPlaceholder from "./sections/OmniboxSectionPlaceholder.svelte";
    import OmniboxSectionTabs from "./sections/OmniboxSectionTabs.svelte";
    import OmniboxSectionTrendingPanel from "./sections/OmniboxSectionTrendingPanel.svelte";
    import OmniboxSectionTrack from "./OmniboxSectionTrack.svelte";

    export let query = "";
    export let debouncedQuery = "";
    export let sectionResultsOpen = false;
    /** @type {chrome.windows.Window[]} */
    export let windows = [];
    export let activeTabId = null;
    /** Currently focused section id (sync with `sectionSlideIndex`). */
    export let activeSectionId = SECTIONS[0]?.id ?? "tabs";
    export let sectionSlideIndex = 0;
    /** @type {Record<string, boolean>} */
    export let visitedSectionIds = {};

    const dispatch = createEventDispatcher();

    const PLACEHOLDER_MESSAGES = {
        tasks: "Tasks are not available yet",
        shopping: "Shopping is not available yet",
        learning: "Learning is not available yet",
        data: "Data are not available yet",
    };

    /** @type {Record<string, import('svelte').SvelteComponent | null>} */
    let panelRefs = Object.fromEntries(SECTIONS.map((s) => [s.id, null]));

    /**
     * @param {string} sectionId
     * @returns {import('svelte').SvelteComponent | null}
     */
    export function getPanelForSection(sectionId) {
        return panelRefs[sectionId] ?? null;
    }

    $: {
        if (activeSectionId) {
            console.log("activeSectionId", activeSectionId);
            visitedSectionIds = {
                ...visitedSectionIds,
                [activeSectionId]: true,
            };
        }
    }
</script>

<div class="omnibox-section-carousel">
    <div class="omnibox-section-carousel__body">
        <OmniboxSectionTrack
            bind:activeIndex={sectionSlideIndex}
            slideCount={SECTIONS.length}
        >
            {#each SECTIONS as section (section.id)}
                <div class="omnibox-track-slide">
                    {#if section.id === "apps"}
                        <OmniboxSectionAppsPanel
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds[section.id]}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            {sectionResultsOpen}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if section.id === "tabs"}
                        <OmniboxSectionTabs
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds[section.id]}
                            isActiveSlide={activeSectionId === section.id}
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
                            dataEnabled={visitedSectionIds.history === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if section.id === "reading"}
                        <OmniboxSectionReading
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.reading === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if section.id === "news"}
                        <OmniboxSectionNewsPanel
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.news === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                        />
                    {:else if section.id === "trending"}
                        <OmniboxSectionTrendingPanel
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.trending === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                        />
                    {:else if section.id === "highlights"}
                        <OmniboxSectionHighlights
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.highlights === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if section.id === "bookmarks"}
                        <OmniboxSectionBookmarks
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.bookmarks === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if section.id === "files"}
                        <OmniboxSectionFiles
                            bind:this={panelRefs[section.id]}
                            dataEnabled={visitedSectionIds.files === true}
                            isActiveSlide={activeSectionId === section.id}
                            {query}
                            {debouncedQuery}
                            on:submit={() => dispatch("submit")}
                            on:close={() => dispatch("close")}
                        />
                    {:else if PLACEHOLDER_SECTION_IDS.has(section.id)}
                        <OmniboxSectionPlaceholder
                            bind:this={panelRefs[section.id]}
                            sectionId={section.id}
                            message={PLACEHOLDER_MESSAGES[section.id] ||
                                "Not available yet"}
                            isActiveSlide={activeSectionId === section.id}
                        />
                    {:else}
                        <OmniboxSectionPlaceholder
                            bind:this={panelRefs[section.id]}
                            sectionId={section.id}
                            message="Not available yet"
                            isActiveSlide={activeSectionId === section.id}
                        />
                    {/if}
                </div>
            {/each}
        </OmniboxSectionTrack>
    </div>
</div>

<style>
    .omnibox-section-carousel {
        --omnibox-track-max-height: 320px;

        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .omnibox-section-carousel__body {
        overflow: hidden;
        padding: 0;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    :global(.omnibox-section-track) .omnibox-track-slide {
        flex: 0 0 100%;
        width: 100%;
        scroll-snap-align: start;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;

        box-sizing: border-box;
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
</style>
