<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import { fetchHypothesisHighlightPages } from "../../../services/hypothesisClient";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";
    import { resultFaviconKey } from "../omniboxShared.js";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    const dispatch = createEventDispatcher();

    let resultsListEl;
    /** @type {object[]} */
    let highlightsPages = [];
    let listError = "";
    let listLoading = false;
    let loadStarted = false;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadHighlights();
    }

    async function loadHighlights() {
        listError = "";
        listLoading = true;
        try {
            const pages = await fetchHypothesisHighlightPages();
            highlightsPages = pages;
        } catch (e) {
            const msg =
                e.message === "missing_api_key"
                    ? "Add a Hypothes.is personal API token in Swift Tabs extension options."
                    : e.message || "Failed to load Hypothesis highlights.";
            listError = msg;
            highlightsPages = [];
        } finally {
            listLoading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, (selectedResultIndex = 0);
    $: visibleResults = applyHighlightsVisibleResults(q);
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {string} q */
    function applyHighlightsVisibleResults(q) {
        const filtered = !q
            ? highlightsPages
            : highlightsPages.filter((row) => {
                  const title = (row.title || "").toLowerCase();
                  const uri = (row.uri || "").toLowerCase();
                  const prev = (row.previewSnippet || "").toLowerCase();
                  let host = "";
                  try {
                      host = new URL(row.uri).hostname.toLowerCase();
                  } catch {
                      /* ignore */
                  }
                  return (
                      title.includes(q) ||
                      uri.includes(q) ||
                      prev.includes(q) ||
                      host.includes(q)
                  );
              });
        return filtered.map((row) => ({
            type: "hypothesisPage",
            title: row.title,
            url: row.uri,
            subtitle: `${row.count} highlight${row.count === 1 ? "" : "s"} · Space — open page`,
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
        const maxIndex = Math.max(0, visibleResults.length - 1);
        selectedResultIndex =
            (selectedResultIndex + direction + maxIndex + 1) % (maxIndex + 1);
        scrollSelectedIntoView();
    }

    async function openHypothesisPage() {
        const item = visibleResults[selectedResultIndex];
        if (!item || item.type !== "hypothesisPage") return;
        await chromeService.createTab({ url: item.url, active: true });
        dispatch("submit");
        dispatch("close");
    }

    async function activateSelected() {
        await openHypothesisPage();
    }

    function onResultRowClick(i, _item) {
        selectedResultIndex = i;
        void activateSelected();
    }

    function onResultRowDblClick(i, item) {
        selectedResultIndex = i;
        void activateSelected();
    }

    function isHighlightsListWithSelection() {
        return visibleResults[selectedResultIndex]?.type === "hypothesisPage";
    }

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        if (event.key === " " && isHighlightsListWithSelection()) {
            event.preventDefault();
            void openHypothesisPage();
            return true;
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
            void activateSelected();
            return true;
        }
        return false;
    }
</script>

{#if listLoading && highlightsPages.length === 0 && !listError}
    <div class="empty-state">Loading highlights…</div>
{:else if listError && highlightsPages.length === 0}
    <div class="empty-state">{listError}</div>
{:else if visibleResults.length === 0}
    <div class="empty-state">
        {q
            ? `No pages match '${query.trim()}'`
            : "No highlights on web pages yet"}
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
