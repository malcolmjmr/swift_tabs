<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import { extractDomain, resultFaviconKey } from "../omniboxShared.js";
    import OmniboxSectionResultList from "./OmniboxSectionResultList.svelte";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";

    const dispatch = createEventDispatcher();

    let resultsListEl;
    /** @type {object[]} */
    let bookmarksBarCache = [];
    /** @type {object[]} */
    let allBookmarksCache = [];
    let loading = false;
    let loadStarted = false;
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    const appsEditMode = false;

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadBookmarks();
    }

    async function loadBookmarks() {
        loading = true;
        try {
            const [barBookmarks, allBookmarks] = await Promise.all([
                chromeService.getBookmarksBar().catch(() => []),
                chromeService.getAllBookmarks().catch(() => []),
            ]);
            bookmarksBarCache = Array.isArray(barBookmarks) ? barBookmarks : [];
            allBookmarksCache = Array.isArray(allBookmarks) ? allBookmarks : [];
        } finally {
            loading = false;
        }
    }

    $: q = debouncedQuery.trim().toLowerCase();
    $: debouncedQuery, (selectedResultIndex = 0);
    $: visibleResults =
        dataEnabled &&
        (bookmarksBarCache.length > 0 || allBookmarksCache.length > 0)
            ? filterBookmarks(q)
            : [];

    $: {
        const max = Math.max(0, visibleResults.length - 1);
        if (selectedResultIndex > max) selectedResultIndex = max;
    }

    /** @param {string} q */
    function filterBookmarks(q) {
        const results = [];
        const filteredBar = q
            ? bookmarksBarCache.filter(
                  (b) =>
                      (b.title || "").toLowerCase().includes(q) ||
                      (b.url || "").toLowerCase().includes(q),
              )
            : bookmarksBarCache;

        results.push(
            ...filteredBar.map((b) => ({
                ...b,
                isBookmarkBar: true,
                type: "bookmark",
            })),
        );

        const filteredOther = q
            ? allBookmarksCache.filter(
                  (b) =>
                      (b.title || "").toLowerCase().includes(q) ||
                      (b.url || "").toLowerCase().includes(q),
              )
            : allBookmarksCache;

        results.push(
            ...filteredOther
                .filter((b) => !results.find((r) => r.id === b.id))
                .map((b) => ({ ...b, type: "bookmark" })),
        );

        return results;
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

{#if loading && bookmarksBarCache.length === 0 && allBookmarksCache.length === 0}
    <div class="empty-state">Loading…</div>
{:else if visibleResults.length === 0 && !query.trim() && bookmarksBarCache.length === 0}
    <div class="empty-state">No bookmarks</div>
{:else if visibleResults.length === 0 && query.trim()}
    <div class="empty-state">No bookmarks match '{query.trim()}'</div>
{:else}
    {#if bookmarksBarCache.length > 0 && !query.trim()}
        <div class="bookmark-bar-section">
            <div class="bookmark-bar-grid">
                {#each bookmarksBarCache as bookmark}
                    <button
                        type="button"
                        class="bookmark-bar-item"
                        on:click={() =>
                            void chromeService
                                .createTab({
                                    url: bookmark.url,
                                    active: true,
                                })
                                .then(() => {
                                    dispatch("submit");
                                    dispatch("close");
                                })}
                    >
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${extractDomain(bookmark.url)}&sz=32`}
                            alt=""
                            class="bookmark-bar-icon"
                            on:error={(e) => {
                                e.target.style.display = "none";
                            }}
                        />
                        <span class="bookmark-bar-title">{bookmark.title}</span>
                    </button>
                {/each}
            </div>
        </div>
    {/if}

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

    .section-header {
        padding: 12px 16px 8px;
        font-size: 11px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .bookmark-bar-section {
        padding-bottom: 8px;

        margin-bottom: 8px;
    }

    .bookmark-bar-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px;
    }

    .bookmark-bar-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: background 0.15s;
        max-width: 150px;
    }

    .bookmark-bar-item:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.12));
    }

    .bookmark-bar-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .bookmark-bar-title {
        font-size: 12px;
        color: var(--st-text-primary, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-height: 0;
    }
</style>
