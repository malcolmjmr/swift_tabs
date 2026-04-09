/**
 * @param {chrome.windows.Window[]} windowsList
 * @returns {chrome.windows.Window[]}
 */
export function sortedOpenWindows(windowsList) {
    return [...windowsList]
        .filter((w) => w.tabs?.length > 0)
        .sort((a, b) => a.id - b.id);
}

/**
 * Matches TabsView slide kind when `includeEdgeSlides` is true.
 * @param {chrome.windows.Window[]} windowsList
 * @param {number} navSlideIndex
 * @param {string} navViewMode
 * @returns {"history" | "window" | "create" | null}
 */
export function navEdgeSlideKindFromState(
    windowsList,
    navSlideIndex,
    navViewMode,
) {
    if (navViewMode === "overview") return "window";
    const wl = sortedOpenWindows(windowsList);
    const n = wl.length;
    if (n === 0) return null;
    if (navSlideIndex === 0) return "history";
    if (navSlideIndex === n + 1) return "create";
    return "window";
}

/**
 * @param {chrome.windows.Window[]} windowsList
 * @param {number} tabId
 * @returns {chrome.tabs.Tab | undefined}
 */
export function findTabById(windowsList, tabId) {
    for (const w of windowsList) {
        const t = w.tabs?.find((x) => x.id === tabId);
        if (t) return t;
    }
    return undefined;
}

/**
 * @param {chrome.windows.Window[]} windowsList
 * @param {number} windowId
 * @param {string} navViewMode
 * @returns {{ navSlideIndex?: number, overviewFocusedWindowIndex?: number } | null}
 */
export function syncNavSlideToWindowId(windowsList, windowId, navViewMode) {
    const wl = sortedOpenWindows(windowsList);
    const idx = wl.findIndex((w) => w.id === windowId);
    if (idx < 0) return null;
    if (navViewMode === "overview") {
        return { overviewFocusedWindowIndex: idx };
    }
    return { navSlideIndex: idx + 1 };
}

/**
 * @param {chrome.windows.Window[]} windowsList
 * @param {number} navSlideIndex
 * @param {string} navViewMode
 * @param {number} overviewFocusedWindowIndex
 * @returns {chrome.windows.Window | null}
 */
export function currentNavWindow(
    windowsList,
    navSlideIndex,
    navViewMode,
    overviewFocusedWindowIndex,
) {
    const wl = sortedOpenWindows(windowsList);
    if (wl.length === 0) return null;
    if (navViewMode === "overview")
        return wl[overviewFocusedWindowIndex] ?? null;
    if (
        navEdgeSlideKindFromState(windowsList, navSlideIndex, navViewMode) !==
        "window"
    )
        return null;
    return wl[navSlideIndex - 1] ?? null;
}

/**
 * After closing a tab at `closedTabIndex` (its index before the close), pick
 * the tab for keyboard selection: the tab now occupying that index (former
 * right neighbor), or if that slot is empty (closed tab was last), the tab at
 * `closedTabIndex - 1`.
 * @param {chrome.tabs.Tab[]} tabsSortedByIndex
 * @param {number} closedTabIndex
 * @returns {chrome.tabs.Tab | undefined}
 */
export function tabToSelectAfterClose(tabsSortedByIndex, closedTabIndex) {
    if (!tabsSortedByIndex?.length) return undefined;
    return (
        tabsSortedByIndex[closedTabIndex] ??
        tabsSortedByIndex[closedTabIndex - 1]
    );
}

/**
 * Tabs to close or move in nav/triage: persistent multi-select in the same
 * window as the keyboard highlight, or the highlighted tab alone.
 * @param {chrome.tabs.Tab[]} tabsSortedInWindow
 * @param {chrome.tabs.Tab | null | undefined} selectedTab
 * @param {Iterable<number>} persistentTabIds
 * @returns {chrome.tabs.Tab[]}
 */
export function targetTabsForNavBatch(
    tabsSortedInWindow,
    selectedTab,
    persistentTabIds,
) {
    if (!selectedTab) return [];
    const windowId = selectedTab.windowId;
    const fromPersistent = [...persistentTabIds]
        .map((id) =>
            tabsSortedInWindow.find(
                (t) => t.id === id && t.windowId === windowId,
            ),
        )
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);
    if (fromPersistent.length > 0) return fromPersistent;
    const one = tabsSortedInWindow.find(
        (t) => t.id === selectedTab.id && t.windowId === windowId,
    );
    return one ? [one] : [];
}
