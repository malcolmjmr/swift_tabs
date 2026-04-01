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
        { id: "tasks", label: "Tasks", icon: "task_alt" },
        { id: "history", label: "History", icon: "history" },
        { id: "news", label: "News", icon: "newspaper" },
        { id: "trending", label: "Trending", icon: "trending_up" },
        { id: "reading", label: "Reading", icon: "menu_book" },
        { id: "shopping", label: "Shopping", icon: "shopping_bag" },
        { id: "learning", label: "Learning", icon: "school" },
        { id: "data", label: "Data", icon: "database" },
        { id: "files", label: "Files", icon: "folder" },
        { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
    ];

    const PLACEHOLDER_SECTION_IDS = new Set([
        "tasks",
        "news",
        "trending",
        "reading",
        "shopping",
        "learning",
        "data",
        "files",
    ]);

    let inputEl;
    let resultsListEl;
    let activeSections = [SECTIONS[0].id];
    let sectionResultsOpen = false;
    let selectedSectionIndex = 0;
    let selectedResultIndex = 0;
    let visibleResults = [];
    let loading = false;

    let favoriteDomainsCache = [];
    let recentHistoryCache = [];
    let bookmarksBarCache = [];
    let allBookmarksCache = [];

    let searchTimeout = null;
    let sectionScrollDelta = 0;
    let resultScrollDelta = 0;

    const SECTION_SCROLL_THRESHOLD = 50;
    const RESULT_SCROLL_THRESHOLD = 40;
    const SEARCH_DEBOUNCE_MS = 120;

    $: showSectionPicker = !query.trim() && !sectionResultsOpen;
    $: showSectionStrip = !showSectionPicker;

    onMount(() => {
        inputEl?.focus();
        document.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });

        loadAllData();

        return () =>
            document.removeEventListener("wheel", handleWheel, {
                capture: true,
            });
    });

    async function loadAllData() {
        loading = true;
        try {
            const [favorites, history, barBookmarks, allBookmarks] =
                await Promise.all([
                    chromeService.getFavoriteDomains().catch(() => []),
                    chromeService.getRecentHistory().catch(() => []),
                    chromeService.getBookmarksBar().catch(() => []),
                    chromeService.getAllBookmarks().catch(() => []),
                ]);

            favoriteDomainsCache = favorites;
            recentHistoryCache = history;
            bookmarksBarCache = barBookmarks;
            allBookmarksCache = allBookmarks;
        } catch (e) {
            console.warn("Omnibox: failed to load data", e);
        } finally {
            loading = false;
            if (sectionResultsOpen) {
                updateSearchResults(activeSections, query);
            }
        }
    }

    function handleInput() {
        const q = query.trim();
        if (!q.length) {
            sectionResultsOpen = false;
            visibleResults = [];
            selectedResultIndex = 0;
            return;
        }
        if (!sectionResultsOpen) {
            sectionResultsOpen = true;
            activeSections = [SECTIONS[selectedSectionIndex].id];
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            updateSearchResults(activeSections, query);
        }, SEARCH_DEBOUNCE_MS);
    }

    function expandIntoSection(sectionId) {
        const idx = SECTIONS.findIndex((s) => s.id === sectionId);
        if (idx >= 0) selectedSectionIndex = idx;
        activeSections = [sectionId];
        sectionResultsOpen = true;
        selectedResultIndex = 0;
        updateSearchResults(activeSections, query);
    }

    function goBackToSectionPicker() {
        sectionResultsOpen = false;
        visibleResults = [];
        selectedResultIndex = 0;
    }

    function movePickerSection(direction) {
        selectedSectionIndex =
            (selectedSectionIndex + direction + SECTIONS.length) %
            SECTIONS.length;
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
        const appSel = resultsListEl?.querySelector(".app-grid-item.selected");
        appSel?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function updateSearchResults(sections, searchQuery) {
        const q = searchQuery.trim().toLowerCase();
        const results = [];
        const primary = sections[0] || "apps";

        if (PLACEHOLDER_SECTION_IDS.has(primary)) {
            visibleResults = [];
            selectedResultIndex = 0;
            return;
        }

        if (primary === "apps") {
            results.push(...filterApps(q));
        }
        if (primary === "tabs") {
            results.push(...filterTabs(q));
        }
        if (primary === "bookmarks") {
            results.push(...filterBookmarks(q));
        }
        if (primary === "history") {
            results.push(...filterHistory(q));
        }

        visibleResults = results;
        selectedResultIndex = 0;
    }

    function filterApps(q) {
        const list = !q
            ? favoriteDomainsCache
            : favoriteDomainsCache.filter(
                  (item) =>
                      (item.title || "").toLowerCase().includes(q) ||
                      (item.domain || "").toLowerCase().includes(q),
              );
        return list.map((item) => ({ ...item, type: item.type || "app" }));
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

    function filterHistory(q) {
        const list = !q
            ? recentHistoryCache
            : recentHistoryCache.filter(
                  (h) =>
                      (h.title || "").toLowerCase().includes(q) ||
                      (h.url || "").toLowerCase().includes(q),
              );
        return list.map((h) => ({ ...h, type: "history" }));
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            dispatch("close");
            return;
        }

        const qEmpty = !query.trim();
        if (
            qEmpty &&
            sectionResultsOpen &&
            (event.key === "Backspace" || event.key === "Delete")
        ) {
            event.preventDefault();
            goBackToSectionPicker();
            return;
        }

        const inPicker = qEmpty && !sectionResultsOpen;

        if (qEmpty && event.key === " ") {
            event.preventDefault();
            if (inPicker) {
                expandIntoSection(SECTIONS[selectedSectionIndex].id);
            } else {
                activateSelected();
            }
            return;
        }

        if (qEmpty && event.key === "Enter") {
            event.preventDefault();
            if (inPicker) {
                expandIntoSection(SECTIONS[selectedSectionIndex].id);
            } else {
                activateSelected();
            }
            return;
        }

        if (inPicker) {
            if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp" ||
                event.key === "ArrowRight" ||
                event.key === "ArrowDown"
            ) {
                event.preventDefault();
                movePickerSection(
                    event.key === "ArrowLeft" || event.key === "ArrowUp"
                        ? -1
                        : 1,
                );
            }
            return;
        }

        if (qEmpty && sectionResultsOpen) {
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

        if (event.key === "ArrowUp") {
            event.preventDefault();
            moveSelection(-1);
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveSelection(1);
            return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            activateSelected();
        }
    }

    /** Same model as pre-refactor omnibox: document capture + horizontal = change section, vertical = move selection. Picker uses both axes. Native scroll allowed only over `.section-strip-scroll`. */
    function handleWheel(event) {
        const t = event.target;
        const el = t instanceof Element ? t : t?.parentElement;
        if (el?.closest(".section-strip-scroll")) {
            return;
        }

        const qEmpty = !query.trim();
        const inPicker = qEmpty && !sectionResultsOpen;

        if (inPicker) {
            event.preventDefault();
            const delta = event.deltaY + event.deltaX;
            sectionScrollDelta += delta;
            if (Math.abs(sectionScrollDelta) >= SECTION_SCROLL_THRESHOLD) {
                const direction = sectionScrollDelta > 0 ? -1 : 1;
                sectionScrollDelta = 0;
                movePickerSection(direction);
            }
            return;
        }

        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);

        if (isHorizontal) {
            event.preventDefault();
            sectionScrollDelta += event.deltaX;
            if (Math.abs(sectionScrollDelta) >= SECTION_SCROLL_THRESHOLD) {
                const direction = sectionScrollDelta > 0 ? -1 : 1;
                sectionScrollDelta = 0;
                const currentId = activeSections[0] || SECTIONS[0].id;
                const idx = SECTIONS.findIndex((s) => s.id === currentId);
                const newIdx =
                    (idx + direction + SECTIONS.length) % SECTIONS.length;
                expandIntoSection(SECTIONS[newIdx].id);
            }
            return;
        }

        event.preventDefault();
        resultScrollDelta += event.deltaY;
        if (Math.abs(resultScrollDelta) >= RESULT_SCROLL_THRESHOLD) {
            const direction = resultScrollDelta > 0 ? -1 : 1;
            resultScrollDelta = 0;
            moveSelection(direction);
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
        } else if (
            item.type === "bookmark" ||
            item.type === "history" ||
            item.type === "app" ||
            item.type === "suggestion"
        ) {
            await chromeService.createTab({ url: item.url, active: true });
        }

        dispatch("submit");
        dispatch("close");
    }

    function getResultIcon(item) {
        if (item.icon) return item.icon;

        const icons = {
            suggestion: "lightbulb",
            app: "apps",
            tab: "tab",
            bookmark: "bookmark",
            history: "history",
        };
        return icons[item.type] || "link";
    }

    function getResultSubtitle(item) {
        if (item.subtitle) return item.subtitle;
        if (item.type === "app")
            return `${item.visitCount} visits · ${item.domain}`;
        return item.url || "";
    }

    function getEmptyMessage() {
        const q = query.trim();
        const primarySection = activeSections[0] || "apps";
        const messages = {
            apps: q
                ? `No apps match '${q}'`
                : "No favorite apps yet - visit sites 3+ times",
            tabs: q ? `No open tabs match '${q}'` : "No open tabs",
            bookmarks: q ? `No bookmarks match '${q}'` : "No bookmarks",
            history: q ? `No history matches '${q}'` : "No recent history",
            tasks: "Tasks are not available yet",
            news: "News is not available yet",
            trending: "Trending is not available yet",
            reading: "Reading is not available yet",
            shopping: "Shopping is not available yet",
            learning: "Learning is not available yet",
            data: "Data is not available yet",
            files: "Files are not available yet",
        };
        return messages[primarySection] || "";
    }

    function isUrlLike(str) {
        const trimmed = str.trim();
        if (!trimmed) return false;
        if (/^https?:\/\//i.test(trimmed)) return true;
        if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return true;
        if (trimmed.includes(".") && !trimmed.includes(" ")) return true;
        return false;
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
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
            <div class="search-field">
                <span class="material-symbols-rounded search-icon">search</span>
                <input
                    bind:this={inputEl}
                    type="text"
                    class="omnibox-input"
                    placeholder="Search or enter URL..."
                    bind:value={query}
                    on:input={handleInput}
                    on:keydown={handleKeydown}
                />
            </div>
            {#if showSectionStrip}
                <div
                    class="section-strip-scroll"
                    role="tablist"
                    aria-label="Search sections"
                >
                    <div class="section-strip-padding"></div>
                    {#each SECTIONS as section}
                        <button
                            type="button"
                            class="section-chip"
                            class:selected={activeSections[0] === section.id}
                            role="tab"
                            aria-selected={activeSections[0] === section.id}
                            on:click={() => expandIntoSection(section.id)}
                        >
                            <span
                                class="material-symbols-rounded section-chip-icon"
                                >{section.icon}</span
                            >
                            <span class="section-chip-text"
                                >{section.label}</span
                            >
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <div
            class="results-container"
            class:results-container--expanded={!showSectionPicker}
        >
            {#if showSectionPicker}
                <div
                    class="section-chips"
                    role="listbox"
                    aria-label="Search sections"
                >
                    {#each SECTIONS as section, i}
                        <button
                            type="button"
                            class="section-chip"
                            class:selected={selectedSectionIndex === i}
                            role="option"
                            aria-selected={selectedSectionIndex === i}
                            on:click={() => expandIntoSection(section.id)}
                        >
                            <span
                                class="material-symbols-rounded section-chip-icon"
                                >{section.icon}</span
                            >
                            <span class="section-chip-text"
                                >{section.label}</span
                            >
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="results-body">
                    {#if loading && visibleResults.length === 0}
                        <div class="empty-state">Loading...</div>
                    {:else if visibleResults.length === 0}
                        <div class="empty-state">{getEmptyMessage()}</div>
                    {:else}
                        <div
                            bind:this={resultsListEl}
                            class="results-list"
                            role="listbox"
                        >
                            {#if activeSections[0] === "bookmarks" && bookmarksBarCache.length > 0 && !query.trim()}
                                <div class="bookmark-bar-section">
                                    <div class="section-header">
                                        Bookmark Bar
                                    </div>
                                    <div class="bookmark-bar-grid">
                                        {#each bookmarksBarCache as bookmark}
                                            <button
                                                type="button"
                                                class="bookmark-bar-item"
                                                on:click={() =>
                                                    chromeService.createTab({
                                                        url: bookmark.url,
                                                        active: true,
                                                    })}
                                            >
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${extractDomain(bookmark.url)}&sz=32`}
                                                    alt=""
                                                    class="bookmark-bar-icon"
                                                    on:error={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                    }}
                                                />
                                                <span class="bookmark-bar-title"
                                                    >{bookmark.title}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                {#if allBookmarksCache.length > 0}
                                    <div class="section-header">
                                        All Bookmarks
                                    </div>
                                {/if}
                            {/if}

                            {#if activeSections[0] === "apps" && favoriteDomainsCache.length > 0 && !query.trim()}
                                <div class="apps-grid">
                                    {#each favoriteDomainsCache as app, i}
                                        <button
                                            type="button"
                                            class="app-grid-item"
                                            class:selected={selectedResultIndex ===
                                                i}
                                            on:click={() => {
                                                selectedResultIndex = i;
                                                activateSelected();
                                            }}
                                        >
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${app.domain}&sz=64`}
                                                alt=""
                                                class="app-grid-icon"
                                                on:error={(e) => {
                                                    e.target.src =
                                                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🌐</text></svg>';
                                                }}
                                            />
                                            <span class="app-grid-title"
                                                >{app.title || app.domain}</span
                                            >
                                            <span class="app-grid-subtitle"
                                                >{app.visitCount} visits</span
                                            >
                                        </button>
                                    {/each}
                                </div>
                            {:else}
                                {#each visibleResults as item, i}
                                    <button
                                        type="button"
                                        role="option"
                                        class="result-item"
                                        class:selected={selectedResultIndex ===
                                            i}
                                        class:bookmark-bar-item-list={item.isBookmarkBar}
                                        aria-selected={selectedResultIndex ===
                                            i}
                                        on:click={() => {
                                            selectedResultIndex = i;
                                            activateSelected();
                                        }}
                                    >
                                        <span
                                            class="material-symbols-rounded result-icon"
                                        >
                                            {getResultIcon(item)}
                                        </span>
                                        <div class="result-content">
                                            <div class="result-title">
                                                {item.title || "(Untitled)"}
                                            </div>
                                            <div class="result-subtitle">
                                                {getResultSubtitle(item)}
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if isUrlLike(query)}
                <div class="url-hint">
                    Press Enter to open <code>{query.trim()}</code>
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
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        min-width: 600px;
        max-width: 600px;
        overflow: hidden;
    }

    .omnibox-header {
        display: flex;
        flex-direction: column;
        padding: 0px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .search-field {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
    }

    .search-icon {
        font-size: 20px;
        color: var(--st-text-muted, #808080);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .omnibox-input {
        flex: 1;
        font-size: 15px;
        border: none;
        outline: none;
        color: var(--st-text-primary, #ffffff);
        background: transparent;
    }

    .omnibox-input::placeholder {
        color: var(--st-text-muted, #808080);
    }

    .section-strip-scroll {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0px 0px 10px 0px;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
    }

    .section-strip-scroll::-webkit-scrollbar {
        height: 6px;
    }

    .section-strip-scroll::-webkit-scrollbar-thumb {
        background: var(--st-border-color, rgba(255, 255, 255, 0.2));
        border-radius: 3px;
    }

    .section-strip-padding {
        width: 10px;
    }

    .section-strip-scroll .section-chip {
        flex-shrink: 0;
        white-space: nowrap;
    }

    .section-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 6px 16px 8px;
        align-items: flex-start;
        align-content: flex-start;
    }

    .section-chip {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        padding: 5px 11px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 999px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-muted, #aaa);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 0.15s,
            color 0.15s,
            border-color 0.15s;
        font-family: inherit;
    }

    .section-chip-icon {
        font-size: 16px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
    }

    .section-chip-text {
        line-height: 1.2;
    }

    .section-chip:hover {
        color: var(--st-text-primary, #fff);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .section-chip.selected {
        color: var(--st-text-primary, #fff);
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.25));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.14));
    }

    .results-container {
        padding: 8px 0;
    }

    .results-container--expanded {
        display: flex;
        flex-direction: column;
        padding: 0;
        min-height: 320px;
    }

    .results-body {
        flex: 1;
        min-height: 320px;
        max-height: 320px;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
    }

    .results-body > .empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
    }

    .results-container--expanded .results-list {
        flex: 1;
        min-height: 0;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .section-header {
        padding: 12px 16px 8px;
        font-size: 11px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.1s;
        color: var(--st-text-primary, #fff);
        background: transparent;
        border: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
        font-size: inherit;
    }

    .result-item:hover,
    .result-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .result-icon {
        font-size: 20px;
        color: var(--st-text-muted, #aaa);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
        flex-shrink: 0;
    }

    .result-content {
        flex: 1;
        min-width: 0;
    }

    .result-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--st-text-primary, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .result-subtitle {
        font-size: 12px;
        color: var(--st-text-muted, #888);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }

    .url-hint {
        padding: 8px 16px;
        border-top: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        font-size: 12px;
        color: var(--st-text-muted, #888);
    }

    .url-hint code {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--st-text-primary, #fff);
    }

    /* Apps Grid Layout */
    .apps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 12px;
        padding: 12px 16px;
    }

    .app-grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
        color: var(--st-text-primary, #fff);
    }

    .app-grid-item:hover,
    .app-grid-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.12));
    }

    .app-grid-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        object-fit: contain;
    }

    .app-grid-title {
        font-size: 11px;
        font-weight: 500;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .app-grid-subtitle {
        font-size: 10px;
        color: var(--st-text-muted, #888);
    }

    /* Bookmark Bar Grid */
    .bookmark-bar-section {
        padding-bottom: 8px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
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
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 6px;
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

    .bookmark-bar-item-list {
        opacity: 0.8;
    }
</style>
