<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import {
        fetchTopTrendingTopics,
        fetchTrendingTopicDetail,
    } from "../../../services/geminiClient";
    import OmniboxSectionTrending from "./OmniboxSectionTrending.svelte";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";
    import { resultFaviconKey } from "../omniboxShared.js";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    const dispatch = createEventDispatcher();

    let resultsListEl;
    let trendingView = "list";
    /** @type {object[]} */
    let trendingItems = [];
    let listError = "";
    let listLoading = false;
    let detailText = "";
    let detailError = "";
    let detailLoading = false;
    let loadStarted = false;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: if (!isActiveSlide) {
        trendingView = "list";
        detailText = "";
        detailError = "";
    }

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadTrending();
    }

    async function loadTrending() {
        listError = "";
        listLoading = true;
        try {
            trendingItems = await fetchTopTrendingTopics();
        } catch (e) {
            const msg =
                e.message === "missing_api_key"
                    ? "Add a Google Gemini API key in Swift Tabs extension options."
                    : e.message || "Failed to load trending topics.";
            listError = msg;
            trendingItems = [];
        } finally {
            listLoading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, trendingView === "list" && (selectedResultIndex = 0);
    $: visibleResults =
        trendingView === "list" ? buildTrendingRows(trendingItems, q) : [];
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {object[]} items @param {string} q */
    function buildTrendingRows(items, q) {
        const filtered = !q
            ? items
            : items.filter((row) =>
                  row.headline.toLowerCase().includes(q),
              );
        return filtered.map((row) => ({
            type: "trending",
            title: row.headline,
            headline: row.headline,
            searchQuery: row.searchQuery,
            subtitle: "Enter — details · Space — Google",
        }));
    }

    function markResultFaviconFailed(item) {
        faviconFailedByKey = {
            ...faviconFailedByKey,
            [resultFaviconKey(item)]: true,
        };
    }

    function scrollSelectedIntoView() {
        const selected = resultsListEl?.querySelector(".result-item.selected");
        selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function moveSelection(direction) {
        if (trendingView !== "list") return;
        const maxIndex = Math.max(0, visibleResults.length - 1);
        selectedResultIndex =
            (selectedResultIndex + direction + maxIndex + 1) % (maxIndex + 1);
        scrollSelectedIntoView();
    }

    function isTrendingListWithSelection() {
        return (
            trendingView === "list" &&
            visibleResults[selectedResultIndex]?.type === "trending"
        );
    }

    async function openTrendingGoogleSearch() {
        const item = visibleResults[selectedResultIndex];
        if (!item || item.type !== "trending") return;
        const gq = item.searchQuery || item.title || item.headline;
        const url = `https://www.google.com/search?q=${encodeURIComponent(gq)}`;
        await chromeService.createTab({ url, active: true });
    }

    async function openTrendingDetail() {
        const item = visibleResults[selectedResultIndex];
        if (!item || item.type !== "trending") return;
        detailError = "";
        detailLoading = true;
        trendingView = "detail";
        detailText = "";
        try {
            detailText = await fetchTrendingTopicDetail({
                headline: item.headline || item.title,
                searchQuery: item.searchQuery,
            });
        } catch (e) {
            detailError =
                e.message === "missing_api_key"
                    ? "Add a Google Gemini API key in Swift Tabs extension options."
                    : e.message || "Failed to load details.";
        } finally {
            detailLoading = false;
        }
    }

    function trendingDetailBackToList() {
        trendingView = "list";
        detailText = "";
        detailError = "";
    }

    /** @returns {boolean} */
    export function handleOmniboxBackspace() {
        if (trendingView === "detail") {
            trendingDetailBackToList();
            return true;
        }
        return false;
    }

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        const qEmpty = !query.trim();
        if (trendingView === "detail") {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                return true;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                return true;
            }
            return false;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            moveSelection(-1);
            return true;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveSelection(1);
            return true;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            return true;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            void openTrendingDetail();
            return true;
        }
        if (event.key === " " && qEmpty && isTrendingListWithSelection()) {
            event.preventDefault();
            void openTrendingGoogleSearch();
            return true;
        }
        return false;
    }

    function onResultRowClick(i, item) {
        selectedResultIndex = i;
        if (item?.type === "trending") void openTrendingDetail();
    }

    function onResultRowDblClick(i, item) {
        selectedResultIndex = i;
        if (item?.type === "trending") void openTrendingDetail();
    }
</script>

{#if trendingView === "detail"}
    <OmniboxSectionTrending
        detailLoading={detailLoading}
        detailError={detailError}
        detailText={detailText}
    />
{:else if listLoading && trendingItems.length === 0 && !listError}
    <div class="empty-state">Loading trending topics…</div>
{:else if listError && trendingItems.length === 0}
    <div class="empty-state">{listError}</div>
{:else if visibleResults.length === 0}
    <div class="empty-state">
        {q
            ? `No topics match '${query.trim()}'`
            : "No trending topics"}
    </div>
{:else}
    <div bind:this={resultsListEl} class="results-list" role="listbox">
        <OmniboxSectionResultList
            {visibleResults}
            {selectedResultIndex}
            {appsEditMode}
            {faviconFailedByKey}
            onFaviconError={markResultFaviconFailed}
            onRowClick={onResultRowClick}
            onRowDblClick={onResultRowDblClick}
            onAppsDragStart={() => {}}
            onAppsDragOver={() => {}}
            onAppsDrop={() => {}}
        />
    </div>
{/if}

<style>
    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-height: 0;
    }
</style>
