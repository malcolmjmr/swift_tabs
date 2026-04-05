<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";
    import { resultFaviconKey } from "../omniboxShared.js";

    /** Shell marks first visit; tabs use live window data only. */
    export let dataEnabled = false;
    export let isActiveSlide = false;

    $: void dataEnabled;
    export let query = "";
    /** Filtered search text (debounced by shell). */
    export let debouncedQuery = "";
    /** @type {any[]} */
    export let windows = [];
    export let activeTabId = null;

    const dispatch = createEventDispatcher();

    let resultsListEl;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, (selectedResultIndex = 0);
    $: visibleResults = filterTabs(windows, q, activeTabId);
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {any[]} wins @param {string} q */
    function filterTabs(wins, q) {
        const allTabs = (wins || [])
            .flatMap((w) => w.tabs || [])
            .filter(Boolean);
        const filtered = q
            ? allTabs.filter(
                  (t) =>
                      (t.title || "").toLowerCase().includes(q) ||
                      (t.url || "").toLowerCase().includes(q),
              )
            : allTabs;
        return filtered.sort(sortByRelevance).map((t) => ({ ...t, type: "tab" }));
    }

    function sortByRelevance(a, b) {
        if (activeTabId && a.id === activeTabId) return -1;
        if (activeTabId && b.id === activeTabId) return 1;
        const aTime = a.lastAccessed ?? a.lastAccessedTime ?? 0;
        const bTime = b.lastAccessed ?? b.lastAccessedTime ?? 0;
        if (bTime !== aTime) return bTime - aTime;
        return (a.index ?? 0) - (b.index ?? 0);
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

    async function activateSelected() {
        const item = visibleResults[selectedResultIndex];
        if (!item) {
            dispatch("close");
            return;
        }
        await chromeService.activateTab(item.id);
        dispatch("submit");
        dispatch("close");
    }

    function onResultRowClick(i, _item) {
        selectedResultIndex = i;
        void activateSelected();
    }

    function onResultRowDblClick(i, item) {
        selectedResultIndex = i;
        void activateSelected();
    }

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        const qEmpty = !query.trim();
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
        if (event.key === " " && qEmpty) {
            event.preventDefault();
            void activateSelected();
            return true;
        }
        return false;
    }

</script>

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

<style>
    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-height: 0;
    }
</style>
