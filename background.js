
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onMessage.addListener(onRuntimeMessage);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onActivated.addListener(onTabActivated);





async function onInstalled() {
    console.log('Swift Tabs installed');
    // const tabs = (await chrome.tabs.query({ currentWindow: true }));
    // const activeTabIndex = tabs.findIndex(tab => tab.active);
    // const tab = tabs[activeTabIndex - 1];
    // chrome.tabs.reload(tab.id);

    chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
            if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
                //injectContentScript(tab.id);
                chrome.tabs.reload(tab.id);
            }
        }
    });
}

function onTabUpdated(tabId, changeInfo, tab) {
    chrome.runtime.sendMessage({
        type: 'TAB_UPDATED',
        tabId: tabId,
        changeInfo: changeInfo,
        tab: tab,
    });
    // Content scripts do not receive runtime.sendMessage; broadcast so tab store
    // (audible / mutedInfo) and TabsView stay in sync.
    if (
        changeInfo.audible !== undefined ||
        changeInfo.mutedInfo !== undefined
    ) {
        void broadcastTabsDataChanged();
    }
}

async function onTabActivated(activeInfo) {
    try {
        await chrome.tabs.sendMessage(activeInfo.tabId, {
            type: 'TAB_ACTIVATED',
            tabId: activeInfo.tabId,
            windowId: activeInfo.windowId,
        });
    } catch (e) {
        // Content script may not be loaded (e.g. chrome://, new tab)
    }
    void broadcastTabsDataChanged();
}


function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["dist/content.js"]
    }).catch(e => {
        console.warn(`Could not inject content script into tab ${tab.id}:`, e);
    });
}

function onRuntimeMessage(message, sender, sendResponse) {
    if (message.type === "CHROME_API") {
        chromeApiHandlers[message.endpoint](message.data, sender)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
    } else if (message.type === 'SCROLL') {
        handleTabSwitch(message.scrollDelta, sender.tab.id);
    } else if (message.type === 'TAB_SWITCHED') {
        notifyActiveTabOfTabSwitchingMode();
    } else if (message.type === 'NAVIGATION_MODE') {
        onNavigationModeMessage(message);
    }
    return true; // Indicates that sendResponse will be called asynchronously
}

var popupWindowId = null;
var isInNavigationMode = false;
let scrollDelta = 0;
async function handleTabSwitch(scrollUpdate, tabId) {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab.id !== tabId) {
        return;
    }

    const scrollThreshold = 33;
    scrollDelta += scrollUpdate;
    if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });
    tabs.sort((a, b) => b.index - a.index);

    const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
    let newIndex = currentIndex;
    if (scrollDelta >= scrollThreshold) {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (scrollDelta <= -scrollThreshold) {
        newIndex = (currentIndex === 0) ? tabs.length - 1 : currentIndex - 1;
    }

    scrollDelta = 0;
    const newActiveTabId = tabs[newIndex].id;
    await chrome.tabs.update(newActiveTabId, { active: true });
    await notifyTabOfTabSwitchingMode(newActiveTabId);
}

async function notifyActiveTabOfTabSwitchingMode() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
        await notifyTabOfTabSwitchingMode(activeTab.id);
    }
}

async function notifyTabOfTabSwitchingMode(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, {
            type: "TAB_SWITCHING_MODE",
        });
    } catch (e) {
        // Content script may not be loaded (e.g. chrome:// pages)
    }
}


async function onNavigationModeMessage(message) {
    isInNavigationMode = message.isInNavigationMode;
    let tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
            type: "NAVIGATION_MODE",
            isInNavigationMode: isInNavigationMode,
        });
    }
}

async function broadcastTabsDataChanged() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "TABS_DATA_CHANGED",
                });
            } catch (e) {
                // Content script may not be loaded (e.g. chrome:// pages)
            }
        }
    }
}

// Helper function to get tabs in a window and current tab index
async function getTabsInWindow(windowId) {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    const activeTab = tabs.find(tab => tab.active);
    const activeTabIndex = activeTab ? tabs.indexOf(activeTab) : -1;
    return { tabs, activeTab, activeTabIndex };
}

const chromeApiHandlers = {

    async GET_CURRENT_TAB(_, { tab }) {
        console.log("GET_CURRENT_TAB", tab);
        return tab;
    },


    async GET_TAB({ tabId }) {
        return chrome.tabs.get(tabId);
    },

    async GET_TABS() {
        const windows = await chrome.windows.getAll({ populate: true });
        return windows.flatMap(w => w.tabs);
    },

    async GET_WINDOWS() {
        return chrome.windows.getAll({ populate: true });
    },

    async GET_CURRENT_WINDOW() {
        return chrome.windows.getCurrent({ populate: true });
    },

    async ACTIVATE_TAB({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tabId, { active: true });
        return tab;
    },

    async CLOSE_TAB({ tabId }) {
        await chrome.tabs.remove(tabId);
        broadcastTabsDataChanged();
        return { success: true };
    },

    async PIN_TAB({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        return chrome.tabs.update(tabId, { pinned: !tab.pinned });
    },

    async DUPLICATE_TAB({ tabId }) {
        return chrome.tabs.duplicate(tabId);
    },

    async RELOAD_TAB({ tabId }) {
        return chrome.tabs.reload(tabId);
    },

    async CREATE_TAB(options) {
        return chrome.tabs.create(options);
    },

    async MOVE_TAB({ tabId, targetWindowId }) {
        await chrome.tabs.move(tabId, { windowId: targetWindowId, index: -1 });
        broadcastTabsDataChanged();
        return { success: true };
    },

    async MOVE_TAB_WITHIN_WINDOW({ tabId, delta }) {
        const tab = await chrome.tabs.get(tabId);
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const sorted = [...tabs].sort((a, b) => a.index - b.index);
        const idx = sorted.findIndex((t) => t.id === tabId);
        if (idx < 0) return { success: false };
        const step = Number(delta) >= 0 ? 1 : -1;
        const newIdx = Math.max(
            0,
            Math.min(sorted.length - 1, idx + step),
        );
        if (newIdx === idx) return { success: true };
        await chrome.tabs.move(tabId, { index: newIdx });
        broadcastTabsDataChanged();
        return { success: true };
    },

    async FOCUS_WINDOW({ windowId }) {
        await chrome.windows.update(windowId, { focused: true });
        return { success: true };
    },

    async MUTE_TAB({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        await chrome.tabs.update(tabId, { muted: !tab.mutedInfo?.muted });
        return { success: true };
    },

    async DISCARD_TAB({ tabId }) {
        await chrome.tabs.discard(tabId);
        return { success: true };
    },

    async CREATE_WINDOW({ tabId, tabIds, focused = false }) {
        const useFocused = focused === true;
        const ids =
            Array.isArray(tabIds) && tabIds.length > 0
                ? [...new Set(tabIds)]
                : tabId != null
                    ? [tabId]
                    : [];

        if (ids.length === 0) {
            throw new Error("CREATE_WINDOW requires tabId or tabIds");
        }

        const metas = await Promise.all(ids.map((id) => chrome.tabs.get(id)));
        const sourceWindowId = metas[0].windowId;
        if (!metas.every((t) => t.windowId === sourceWindowId)) {
            throw new Error("All tabs must be in the same window");
        }
        const sorted = [...metas].sort((a, b) => a.index - b.index);
        const orderedIds = sorted.map((t) => t.id);

        // Always open an empty window first, then tabs.move — avoids Chrome
        // focusing/juggling tabId-on-create behavior.
        const newWindow = await chrome.windows.create({
            url: "about:blank",
            focused: useFocused,
            incognito: metas[0].incognito === true,
        });
        const blankTab = newWindow.tabs?.[0];
        for (const id of orderedIds) {
            await chrome.tabs.move(id, { windowId: newWindow.id, index: -1 });
        }
        if (blankTab?.id) {
            await chrome.tabs.remove(blankTab.id);
        }
        broadcastTabsDataChanged();
        return chrome.windows.get(newWindow.id, { populate: true });
    },

    async COPY_TAB_URL({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        return { url: tab.url };
    },

    async CLOSE_OTHER_TABS({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const toClose = tabs.filter((t) => t.id !== tabId);
        for (const t of toClose) {
            await chrome.tabs.remove(t.id);
        }
        broadcastTabsDataChanged();
        return { success: true };
    },

    async CLOSE_TABS_TO_RIGHT({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        const tabs = await chrome.tabs.query({
            windowId: tab.windowId,
        });
        const sorted = tabs.sort((a, b) => a.index - b.index);
        const idx = sorted.findIndex((t) => t.id === tabId);
        const toClose = sorted.slice(idx + 1);
        for (const t of toClose) {
            await chrome.tabs.remove(t.id);
        }
        broadcastTabsDataChanged();
        return { success: true };
    },

    async SEARCH_BOOKMARKS({ query }) {

        const results = await chrome.bookmarks.search({ query: query.trim() });
        return results
            .filter((b) => b.url)
            .slice(0, 50)
            .map((b) => ({
                id: b.id,
                title: b.title || extractDomain(b.url),
                url: b.url,
                type: "bookmark",
            }));
    },

    async SEARCH_HISTORY({ query }) {

        const results = await chrome.history.search({
            text: query.trim(),
            maxResults: 50,
        });
        return results.map((r) => ({
            id: r.id,
            title: r.title || extractDomain(r.url),
            url: r.url,
            type: "history",
        }));
    },

    async GET_TAB_GROUPS() {
        const groups = await chrome.tabGroups.query({});
        const windows = await chrome.windows.getAll({ populate: true });
        return groups.map((g) => {
            const window = windows.find((w) => w.id === g.windowId);
            const groupTabs = (window?.tabs || []).filter(
                (t) => t.groupId === g.id
            );
            const firstTab = groupTabs.sort((a, b) => a.index - b.index)[0];
            return {
                id: g.id,
                title: g.title || "(Untitled)",
                color: g.color,
                windowId: g.windowId,
                tabCount: groupTabs.length,
                firstTabId: firstTab?.id,
                type: "group",
            };
        });
    },

    async GET_RECENTLY_CLOSED() {
        return chrome.sessions.getRecentlyClosed({ maxResults: 25 });
    },

    async RESTORE_SESSION({ sessionId }) {
        await chrome.sessions.restore(sessionId);
        broadcastTabsDataChanged();
        return { success: true };
    },

    async CREATE_EMPTY_WINDOW() {
        const w = await chrome.windows.create({ focused: false, url: "about:blank" });
        broadcastTabsDataChanged();
        return w;
    },

    async ACTIVATE_TAB_GROUP({ groupId, windowId }) {
        const tabs = await chrome.tabs.query({ windowId });
        const inGroup = tabs.filter((t) => t.groupId === groupId);
        if (inGroup.length === 0) return { success: false };
        const first = [...inGroup].sort((a, b) => a.index - b.index)[0];
        await chrome.tabGroups.update(groupId, { collapsed: false });
        await chrome.windows.update(windowId, { focused: true });
        await chrome.tabs.update(first.id, { active: true });
        return { success: true };
    },

    async GET_SESSIONS_FOLDER_BOOKMARKS() {
        const { sessionsBookmarksFolderId } = await chrome.storage.local.get(
            "sessionsBookmarksFolderId"
        );
        if (!sessionsBookmarksFolderId) return [];
        const children = await chrome.bookmarks.getChildren(
            sessionsBookmarksFolderId
        );
        return children
            .filter((n) => !n.url)
            .map((f) => ({ id: f.id, title: f.title || "Untitled" }));
    },

    async GET_FAVORITE_DOMAINS() {
        // Get last 3 months of history to calculate favorite domains
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const history = await chrome.history.search({
            text: '',
            startTime: threeMonthsAgo,
            maxResults: 10000
        });

        // Group by domain and track unique visit dates
        const domainStats = new Map();

        for (const item of history) {
            const domain = extractDomain(item.url);
            if (!domain || domain === 'newtab') continue;

            const visitDate = new Date(item.lastVisitTime).toDateString();

            if (!domainStats.has(domain)) {
                domainStats.set(domain, {
                    domain,
                    urls: new Set(),
                    visitDates: new Set(),
                    lastVisitTime: item.lastVisitTime,
                    title: item.title || domain
                });
            }

            const stats = domainStats.get(domain);
            stats.urls.add(item.url);
            stats.visitDates.add(visitDate);
            if (item.lastVisitTime > stats.lastVisitTime) {
                stats.lastVisitTime = item.lastVisitTime;
                stats.title = item.title || stats.title;
            }
        }

        // Filter to domains with 3+ unique visit dates, sort by visit count
        const favorites = Array.from(domainStats.values())
            .filter(d => d.visitDates.size >= 3)
            .map(d => ({
                domain: d.domain,
                url: `https://${d.domain}`,
                title: d.title,
                visitCount: d.visitDates.size,
                lastVisitTime: d.lastVisitTime,
                type: 'app'
            }))
            .sort((a, b) => b.visitCount - a.visitCount || b.lastVisitTime - a.lastVisitTime)
            .slice(0, 20);

        return favorites;
    },

    async GET_RECENT_HISTORY() {
        // Get recent history with more results for deduplication
        const history = await chrome.history.search({
            text: '',
            maxResults: 200
        });

        // Deduplicate by URL (keep most recent)
        const seenUrls = new Set();
        const uniqueHistory = [];

        for (const item of history) {
            // Normalize URL for deduplication
            const normalizedUrl = item.url.replace(/#.*$/, '').replace(/\?.*$/, '');
            if (seenUrls.has(normalizedUrl)) continue;

            seenUrls.add(normalizedUrl);
            uniqueHistory.push({
                id: item.id,
                title: item.title || extractDomain(item.url),
                url: item.url,
                lastVisitTime: item.lastVisitTime,
                visitCount: item.visitCount,
                type: 'history'
            });
        }

        return uniqueHistory.slice(0, 50);
    },

    async GET_BOOKMARKS_BAR() {
        // Get the bookmark bar (id '1' is the bookmark bar in Chrome)
        const bookmarkBar = await chrome.bookmarks.getChildren('1');
        return bookmarkBar
            .filter(b => b.url) // Only bookmarks, not folders
            .map(b => ({
                id: b.id,
                title: b.title || extractDomain(b.url),
                url: b.url,
                dateAdded: b.dateAdded,
                type: 'bookmark'
            }))
            .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    },

    async GET_ALL_BOOKMARKS() {
        // Get all bookmarks recursively
        const allBookmarks = [];

        async function getBookmarksRecursively(id) {
            const children = await chrome.bookmarks.getChildren(id);
            for (const child of children) {
                if (child.url) {
                    allBookmarks.push({
                        id: child.id,
                        title: child.title || extractDomain(child.url),
                        url: child.url,
                        dateAdded: child.dateAdded,
                        type: 'bookmark'
                    });
                } else if (child.id !== '1') { // Skip bookmark bar, handled separately
                    await getBookmarksRecursively(child.id);
                }
            }
        }

        // Get other bookmarks folder (id '2')
        await getBookmarksRecursively('2');

        // Sort by date added (most recent first) 
        return allBookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    },
};

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
}



async function getTabsInfoForDisplay(activeTabId, allTabsInWindow) {
    const activeTab = allTabsInWindow.find(tab => tab.id === activeTabId);
    if (!activeTab) return null; // Should not happen

    const activeTabIndex = allTabsInWindow.indexOf(activeTab);

    const tabsInfo = [];
    // Active tab
    tabsInfo.push({ ...activeTab, isActive: true });

    // Adjacent tabs (one above, one below)
    if (allTabsInWindow.length > 1) {
        const prevIndex = (activeTabIndex - 1 + allTabsInWindow.length) % allTabsInWindow.length;
        const nextIndex = (activeTabIndex + 1) % allTabsInWindow.length;

        if (prevIndex !== activeTabIndex) {
            tabsInfo.unshift({ ...allTabsInWindow[prevIndex], isActive: false });
        }
        if (nextIndex !== activeTabIndex) {
            tabsInfo.push({ ...allTabsInWindow[nextIndex], isActive: false });
        }
    }
    return tabsInfo;
}
