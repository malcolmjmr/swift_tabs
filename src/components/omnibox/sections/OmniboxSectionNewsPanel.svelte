<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import {
        fetchNewsEventDetail,
        fetchTopNewsEvents,
    } from "../../../services/geminiClient";
    import OmniboxSectionNews from "./OmniboxSectionNews.svelte";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";
    import { resultFaviconKey } from "../omniboxShared.js";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    const dispatch = createEventDispatcher();

    let resultsListEl;
    let newsView = "list";
    /** @type {object[]} */
    let newsItems = [];
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
        newsView = "list";
        detailText = "";
        detailError = "";
    }

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadNews();
    }

    async function loadNews() {
        listError = "";
        listLoading = true;
        try {
            newsItems = await fetchTopNewsEvents();
        } catch (e) {
            const msg =
                e.message === "missing_api_key"
                    ? "Add a Google Gemini API key in Swift Tabs extension options."
                    : e.message || "Failed to load news.";
            listError = msg;
            newsItems = [];
        } finally {
            listLoading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, newsView === "list" && (selectedResultIndex = 0);
    $: visibleResults =
        newsView === "list" ? buildNewsRows(newsItems, q) : [];
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {object[]} items @param {string} q */
    function buildNewsRows(items, q) {
        const filtered = !q
            ? items
            : items.filter((row) =>
                  row.headline.toLowerCase().includes(q),
              );
        return filtered.map((row) => ({
            type: "news",
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
        if (newsView !== "list") return;
        const maxIndex = Math.max(0, visibleResults.length - 1);
        selectedResultIndex =
            (selectedResultIndex + direction + maxIndex + 1) % (maxIndex + 1);
        scrollSelectedIntoView();
    }

    function isNewsListWithSelection() {
        return (
            newsView === "list" &&
            visibleResults[selectedResultIndex]?.type === "news"
        );
    }

    async function openNewsGoogleSearch() {
        const item = visibleResults[selectedResultIndex];
        if (!item || item.type !== "news") return;
        const gq = item.searchQuery || item.title || item.headline;
        const url = `https://www.google.com/search?q=${encodeURIComponent(gq)}`;
        await chromeService.createTab({ url, active: true });
    }

    async function openNewsDetail() {
        const item = visibleResults[selectedResultIndex];
        if (!item || item.type !== "news") return;
        detailError = "";
        detailLoading = true;
        newsView = "detail";
        detailText = "";
        try {
            detailText = await fetchNewsEventDetail({
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

    function newsDetailBackToList() {
        newsView = "list";
        detailText = "";
        detailError = "";
    }

    /** @returns {boolean} */
    export function handleOmniboxBackspace() {
        if (newsView === "detail") {
            newsDetailBackToList();
            return true;
        }
        return false;
    }

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        const qEmpty = !query.trim();
        if (newsView === "detail") {
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
            void openNewsDetail();
            return true;
        }
        if (event.key === " " && qEmpty && isNewsListWithSelection()) {
            event.preventDefault();
            void openNewsGoogleSearch();
            return true;
        }
        return false;
    }

    function onResultRowClick(i, item) {
        selectedResultIndex = i;
        if (item?.type === "news") void openNewsDetail();
    }

    function onResultRowDblClick(i, item) {
        selectedResultIndex = i;
        if (item?.type === "news") void openNewsDetail();
    }
</script>

{#if newsView === "detail"}
    <OmniboxSectionNews
        detailLoading={detailLoading}
        detailError={detailError}
        detailText={detailText}
    />
{:else if listLoading && newsItems.length === 0 && !listError}
    <div class="empty-state">Loading news…</div>
{:else if listError && newsItems.length === 0}
    <div class="empty-state">{listError}</div>
{:else if visibleResults.length === 0}
    <div class="empty-state">
        {q
            ? `No headlines match '${query.trim()}'`
            : "No headlines"}
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
