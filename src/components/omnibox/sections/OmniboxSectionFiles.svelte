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
    let downloadsCache = [];
    let loading = false;
    let loadStarted = false;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadDownloads();
    }

    /** @param {string} path */
    function fileBasename(path) {
        if (!path) return "";
        const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
        return i >= 0 ? path.slice(i + 1) : path;
    }

    async function loadDownloads() {
        loading = true;
        try {
            const list = await chromeService
                .getRecentDownloads()
                .catch(() => []);
            downloadsCache = Array.isArray(list) ? list : [];
        } finally {
            loading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, (selectedResultIndex = 0);
    $: visibleResults =
        dataEnabled && downloadsCache.length > 0 ? filterDownloads(q) : [];
    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {string} q */
    function filterDownloads(q) {
        const list = !q
            ? downloadsCache
            : downloadsCache.filter((d) => {
                  const name = fileBasename(d.filename || "").toLowerCase();
                  const url = (d.url || "").toLowerCase();
                  const path = (d.filename || "").toLowerCase();
                  return (
                      name.includes(q) || url.includes(q) || path.includes(q)
                  );
              });
        return list.map((d) => ({
            ...d,
            type: "download",
            title: fileBasename(d.filename) || d.url || "Download",
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

    async function activateSelected() {
        const item = visibleResults[selectedResultIndex];
        if (item == null || item.id == null) {
            dispatch("close");
            return;
        }
        try {
            await chromeService.openDownload(item.id);
        } catch {
            /* background falls back to show in folder */
        }
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

{#if loading && downloadsCache.length === 0}
    <div class="empty-state">Loading…</div>
{:else if visibleResults.length === 0}
    <div class="empty-state">
        {q
            ? `No downloads match '${query.trim()}'`
            : "No files in Downloads (or files were removed)"}
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
