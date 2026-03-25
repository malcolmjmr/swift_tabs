<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { chromeService } from "../services/chromeApi";

    export let query = "";
    export let activeTabId = null;
    export let windows = [];

    const dispatch = createEventDispatcher();

    const SECTIONS = [
        { id: "apps", label: "Apps", icon: "apps" },
        { id: "tabs", label: "Tabs", icon: "tab" },
        { id: "groups", label: "Groups", icon: "select_window_2" },
        { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
        { id: "history", label: "History", icon: "history" },
    ];

    let inputEl;
    let resultsListEl;
    let activeSections = ["tabs"];
    let selectedResultIndex = 0;
    let visibleResults = [];
    let loading = false;

    let groupsCache = [];
    let searchTimeout = null;
    let sectionScrollDelta = 0;
    let resultScrollDelta = 0;

    const SECTION_SCROLL_THRESHOLD = 50;
    const RESULT_SCROLL_THRESHOLD = 40;
    const SEARCH_DEBOUNCE_MS = 120;

    onMount(() => {
        inputEl?.focus();
        document.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });
        updateSearchResults(activeSections, query);
        return () =>
            document.removeEventListener("wheel", handleWheel, {
                capture: true,
            });
    });

    function handleInput() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            updateSearchResults(activeSections, query);
        }, SEARCH_DEBOUNCE_MS);
    }

    function selectSection(sectionId) {
        if (activeSections.length === 1 && activeSections[0] === sectionId)
            return;
        activeSections = [sectionId];
        selectedResultIndex = 0;
        updateSearchResults(activeSections, query);
    }

    function moveSection(direction) {
        const currentId = activeSections[0] || "tabs";
        const idx = SECTIONS.findIndex((s) => s.id === currentId);
        const newIdx = (idx + direction + SECTIONS.length) % SECTIONS.length;
        selectSection(SECTIONS[newIdx].id);
    }

    function moveSelection(direction) {
        const maxIndex = Math.max(0, visibleResults.length - 1);
        selectedResultIndex =
            (selectedResultIndex + direction + maxIndex + 1) % (maxIndex + 1);
        scrollSelectedIntoView();
    }

    function scrollSelectedIntoView() {
        const selected = resultsListEl?.querySelector(".result-item.selected");
        selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    async function updateSearchResults(activeSections, searchQuery) {
        const q = searchQuery.trim().toLowerCase();
        const results = [];
        let tabs = [];
        let history = [];

        if (activeSections.includes("tabs")) {
            tabs = filterTabs(q);
            results.push(...tabs);
        }
        if (activeSections.includes("groups")) {
            if (groupsCache.length === 0) await loadGroups();
            results.push(...filterGroups(q));
        }
        if (activeSections.includes("bookmarks")) {
            results.push(...(q ? await fetchBookmarks(q) : []));
        }
        if (activeSections.includes("history")) {
            history = q ? await fetchHistory(q) : [];
            results.push(...history);
        }
        if (activeSections.includes("apps")) {
            results.push(...filterApps(q, tabs, history));
        }
        console.log("search results");
        console.log(results);
        visibleResults = results;
        selectedResultIndex = 0;
    }

    function filterApps(q, tabs, history) {
        // group tabs by domain, group history by domain
        const tabsByDomain = groupBy(tabs, (t) => extractDomain(t.url));
        const historyByDomain = groupBy(history, (h) => extractDomain(h.url));
        const apps = [];
        for (const domain in tabsByDomain) {
            apps.push({
                type: "app",
                title: domain,
                url: `https://${domain}`,
                favIconUrl:
                    tabsByDomain[domain].length > 0
                        ? tabsByDomain[domain][0].favIconUrl
                        : `https://${domain}/favicon.ico`,
                tabs: tabsByDomain[domain],
                history: historyByDomain[domain] || [],
                tabCount: tabsByDomain[domain].length || 0,
                historyCount: historyByDomain[domain].length || 0,
            });
        }
        return apps.sort((a, b) => b.tabCount - a.tabCount);
    }

    function filterTabs(q) {
        const allTabs = (windows || [])
            .flatMap((w) => w.tabs || [])
            .filter(Boolean);
        const filtered = q
            ? allTabs.filter(
                  (t) =>
                      (t.title || "").toLowerCase().includes(q) ||
                      (t.url || "").toLowerCase().includes(q),
              )
            : allTabs;
        return filtered
            .sort(sortByRelevance)
            .map((t) => ({ ...t, type: "tab" }));
    }

    function sortByRelevance(a, b) {
        if (activeTabId && a.id === activeTabId) return -1;
        if (activeTabId && b.id === activeTabId) return 1;
        const aTime = a.lastAccessed ?? a.lastAccessedTime ?? 0;
        const bTime = b.lastAccessed ?? b.lastAccessedTime ?? 0;
        if (bTime !== aTime) return bTime - aTime;
        return (a.index ?? 0) - (b.index ?? 0);
    }

    function filterGroups(q) {
        if (!q) return groupsCache;
        return groupsCache.filter((g) =>
            (g.title || "").toLowerCase().includes(q),
        );
    }

    async function loadGroups() {
        try {
            loading = true;
            groupsCache = await chromeService.getTabGroups();
        } catch (e) {
            console.warn("Omnibox: failed to load groups", e);
            groupsCache = [];
        } finally {
            loading = false;
        }
    }

    async function fetchBookmarks(q) {
        try {
            loading = true;
            let bookmarks = await chromeService.getBookmarks();
            console.log("bookmarks", bookmarks);
            return bookmarks.filter((b) =>
                (b.title || "").toLowerCase().includes(q),
            );
        } catch (e) {
            console.warn("Omnibox: failed to search bookmarks", e);
            return [];
        } finally {
            loading = false;
        }
    }

    async function fetchHistory(q) {
        try {
            loading = true;
            let history = await chromeService.getHistory();
            console.log("history", history);
            return history;
        } catch (e) {
            console.warn("Omnibox: failed to search history", e);
            return [];
        } finally {
            loading = false;
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            dispatch("close");
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveSelection(-1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveSelection(1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            activateSelected();
        }
    }

    function handleWheel(event) {
        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);

        if (isHorizontal) {
            event.preventDefault();
            sectionScrollDelta += event.deltaX;
            if (Math.abs(sectionScrollDelta) >= SECTION_SCROLL_THRESHOLD) {
                const direction = sectionScrollDelta > 0 ? -1 : 1;
                sectionScrollDelta = 0;
                moveSection(direction);
            }
        } else {
            event.preventDefault();
            resultScrollDelta += event.deltaY;
            if (Math.abs(resultScrollDelta) >= RESULT_SCROLL_THRESHOLD) {
                const direction = resultScrollDelta > 0 ? -1 : 1;
                resultScrollDelta = 0;
                moveSelection(direction);
            }
        }
    }

    async function activateSelected() {
        const item = visibleResults[selectedResultIndex];
        if (!item) {
            dispatch("close");
            return;
        }

        if (item.type === "tab") {
            await chromeService.activateTab(item.id);
        } else if (item.type === "group") {
            if (item.firstTabId) {
                await chromeService.activateTab(item.firstTabId);
            } else if (item.windowId) {
                await chromeService.focusWindow(item.windowId);
            }
        } else if (item.type === "bookmark" || item.type === "history") {
            await chromeService.createTab({ url: item.url, active: true });
        }

        dispatch("submit");
        dispatch("close");
    }

    function getResultIcon(item) {
        const icons = {
            app: "apps",
            tab: "tab",
            group: "folder",
            bookmark: "bookmark",
            history: "history",
        };
        return icons[item.type] || "link";
    }

    function getResultSubtitle(item) {
        if (item.type === "group") return `${item.tabCount} tabs`;
        return item.url || "";
    }

    function getEmptyMessage() {
        const q = query.trim();
        const primarySection = activeSections[0] || "tabs";
        const messages = {
            tabs: q ? `No open tabs match '${q}'` : "No open tabs",
            groups: q ? `No tab groups match '${q}'` : "No tab groups",
            bookmarks: q
                ? `No bookmarks match '${q}'`
                : "Type to search bookmarks",
            history: q ? `No history matches '${q}'` : "Type to search history",
        };
        return messages[primarySection] || "";
    }

    function getSectionIndex(sectionId) {
        return SECTIONS.findIndex((s) => s.id === sectionId);
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
            <input
                bind:this={inputEl}
                type="text"
                class="omnibox-input"
                placeholder="Search or enter URL..."
                bind:value={query}
                on:input={handleInput}
                on:keydown={handleKeydown}
            />
            <div class="section-tabs">
                {#each SECTIONS as section}
                    <button
                        type="button"
                        class="section-tab"
                        class:active={activeSections.includes(section.id)}
                        on:click={() => selectSection(section.id)}
                    >
                        <span class="material-symbols-rounded section-icon"
                            >{section.icon}</span
                        >
                        <span class="section-label">{section.label}</span>
                    </button>
                {/each}
            </div>
        </div>

        <div class="results-container">
            {#if loading}
                <div class="empty-state">Loading...</div>
            {:else if visibleResults.length === 0}
                <div class="empty-state">{getEmptyMessage()}</div>
            {:else}
                <div
                    bind:this={resultsListEl}
                    class="results-list"
                    role="listbox"
                >
                    {#each visibleResults as item, i}
                        <div
                            role="option"
                            class="result-item"
                            class:selected={selectedResultIndex === i}
                            aria-selected={selectedResultIndex === i}
                        >
                            {#if !item.faviconUrl}
                                <span
                                    class="material-symbols-rounded result-icon"
                                >
                                    {getResultIcon(item)}
                                </span>
                            {:else}
                                <img
                                    src={item.faviconUrl}
                                    alt=""
                                    class="result-icon"
                                />
                            {/if}
                            <div class="result-content">
                                <div class="result-title">
                                    {item.title || "(Untitled)"}
                                </div>
                                <div class="result-subtitle">
                                    {getResultSubtitle(item)}
                                </div>
                            </div>
                        </div>
                    {/each}
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
        background: #333;
        border-radius: 8px;
        padding: 8px 16px 0px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        min-width: 600px;
        max-width: 600px;
    }

    .omnibox-header {
        display: flex;
        flex-direction: column;
        margin: 0px;
        width: calc(100% - 16px);
        padding: 8px 8px 0px 8px;
        border-radius: 8px;
        background: #444;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease-in-out;
        &:focus {
            outline: none;
            border-color: #007bff;
        }
    }

    .omnibox-input {
        width: 100%;
        font-size: 16px;
        border: none;
        outline: none;
        color: white;
        padding: 4px 0;
        padding: 8px;
        background: transparent;
        border-bottom: 1px solid #444;
    }

    .omnibox-input::placeholder {
        color: #888;
    }

    .section-tabs {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;
        gap: 4px;
        margin-top: 5px 0px 0px 0px;
        padding-bottom: 8px;
        border-top: 1px solid #444;
        overflow-x: auto;
        width: 100%;
    }

    .section-tab {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 13px;
        white-space: nowrap;
        opacity: 0.5;
        transition: all 0.2s ease-in-out;
        border-radius: 8px;
    }

    .section-tab:hover {
        opacity: 1;
        background: #555;
    }

    .section-tab.active {
        opacity: 1;
        background: #555;
    }

    .section-icon {
        font-size: 16px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
    }

    .results-container {
        max-height: 280px;
        overflow-y: auto;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: default;
    }

    .result-item:hover,
    .result-item.selected {
        background: #444;
    }

    .result-icon {
        font-size: 20px;
        color: #aaa;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
    }

    .result-content {
        flex: 1;
        min-width: 0;
    }

    .result-title {
        font-size: 14px;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .result-subtitle {
        font-size: 12px;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .empty-state {
        padding: 24px 12px;
        color: #888;
        font-size: 14px;
        text-align: center;
    }
</style>
