<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";
    import { resultFaviconKey } from "../omniboxShared.js";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    const dispatch = createEventDispatcher();

    let resultsListEl;
    /** @type {object[]} */
    let readingCache = [];
    let loading = false;
    let loadStarted = false;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadReading();
    }

    async function loadReading() {
        loading = true;
        try {
            const list = await chromeService.getReadingList().catch(() => []);
            readingCache = Array.isArray(list) ? list : [];
        } finally {
            loading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, (selectedResultIndex = 0);
    $: visibleResults =
        dataEnabled && readingCache.length > 0 ? filterReading(q) : [];
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {string} q */
    function filterReading(q) {
        const list = !q
            ? readingCache
            : readingCache.filter(
                  (e) =>
                      (e.title || "").toLowerCase().includes(q) ||
                      (e.url || "").toLowerCase().includes(q),
              );
        return list.map((e) => ({ ...e, type: "reading" }));
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
        if (!item?.url) {
            dispatch("close");
            return;
        }
        await chromeService.createTab({ url: item.url, active: true });
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

{#if loading && readingCache.length === 0}
    <div class="empty-state">Loading…</div>
{:else if visibleResults.length === 0}
    <div class="empty-state">
        {q
            ? `No reading list matches '${query.trim()}'`
            : "Reading list is empty"}
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
