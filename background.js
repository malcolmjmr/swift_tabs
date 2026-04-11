import {
    appsAddAppToHomeEnd,
    appsCreateEmptyFolder,
    appsDeleteApp,
    appsDiscoverMissingFromHistory,
    appsGetState,
    appsMergeIntoFolder,
    appsMoveAppIntoFolder,
    appsMoveAppToHomeRoot,
    appsPutApp,
    appsPutLayout,
    appsRecomputeAccessBlockList,
    appsRegisterOrEnsureApp,
    appsRemoveFromHome,
} from "./src/services/apps/appsBackground.js";
import {
    executeAppRoutine,
    executeFolderRoutine,
    handleRoutineAlarmName,
    syncAppRoutineAlarms,
} from "./src/services/apps/appsRoutines.js";
import {
    getCachedAccessBlockPatterns,
    hostnameMatchesBlockedPatterns,
} from "./src/services/apps/appsAccess.js";
import {
    createBlankObjective,
    isTimeframe,
} from "./src/planner/objectiveTypes.js";
import { saveObjective } from "./src/planner/objectiveRepository.js";

chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onStartup.addListener(() => {
    void appsRecomputeAccessBlockList();
    void syncAppRoutineAlarms();
});
void appsRecomputeAccessBlockList();
void syncAppRoutineAlarms();
chrome.runtime.onMessage.addListener(onRuntimeMessage);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.windows.onFocusChanged.addListener(onWindowFocusChanged);





const PLANNER_RECONCILE_ALARM = "plannerReconcile";

const LINK_QUEUE_SESSION_KEY = "swiftTabsLinkQueueByTab";

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === PLANNER_RECONCILE_ALARM) {
        chrome.runtime.sendMessage({ type: "PLANNER_RECONCILE" }).catch(() => { });
        return;
    }
    if (
        alarm.name.startsWith("appRoutine:") ||
        alarm.name.startsWith("folderRoutine:")
    ) {
        void handleRoutineAlarmName(alarm.name);
    }
});

chrome.alarms.get(PLANNER_RECONCILE_ALARM, (existing) => {
    if (!existing) {
        chrome.alarms.create(PLANNER_RECONCILE_ALARM, {
            periodInMinutes: 24 * 60,
        });
    }
});

async function onInstalled() {
    console.log('Swift Tabs installed');
    chrome.alarms.create(PLANNER_RECONCILE_ALARM, {
        periodInMinutes: 24 * 60,
    });
    void appsRecomputeAccessBlockList();
    void syncAppRoutineAlarms();

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
    const url = changeInfo.url || tab?.url;
    if (url && /^https?:\/\//i.test(url)) {
        void maybeCloseTabForAppAccess(tabId, url);
    }
    // Content scripts do not receive runtime.sendMessage; broadcast so tab store
    // (audible / mutedInfo) and TabsView stay in sync.
    if (
        changeInfo.audible !== undefined ||
        changeInfo.mutedInfo !== undefined
    ) {
        void broadcastTabsDataChanged();
    }
}

/**
 * @param {number} tabId
 * @param {string} url
 */
async function maybeCloseTabForAppAccess(tabId, url) {
    try {
        const hostname = new URL(url).hostname;
        const patterns = getCachedAccessBlockPatterns();
        if (hostnameMatchesBlockedPatterns(hostname, patterns)) {
            await chrome.tabs.remove(tabId);
        }
    } catch {
        /* ignore */
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
    try {
        await chrome.tabs.sendMessage(activeInfo.tabId, {
            type: "NAVIGATION_MODE",
            isInNavigationMode,
        });
        await chrome.tabs.sendMessage(activeInfo.tabId, {
            type: "TRIAGE_MODE",
            isInTriageMode,
        });
    } catch (e) {
        // Content script may not be loaded
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
        const endpoint =
            typeof message.endpoint === "string"
                ? message.endpoint.trim()
                : "";
        const handler = chromeApiHandlers[endpoint];
        if (typeof handler !== "function") {
            console.error(
                "[Swift Tabs] CHROME_API unknown endpoint:",
                message.endpoint,
                "trimmed:",
                endpoint,
            );
            sendResponse({
                error:
                    endpoint === ""
                        ? "CHROME_API missing endpoint"
                        : `Unknown CHROME_API endpoint: ${endpoint}`,
            });
            return true;
        }
        void (async () => {
            try {
                const result = await handler(message.data, sender);
                sendResponse(result);
            } catch (error) {
                const msg =
                    error && typeof error === "object" && "message" in error
                        ? String(error.message)
                        : String(error);
                sendResponse({ error: msg || "CHROME_API handler failed" });
            }
        })();
    } else if (message.type === 'SCROLL') {
        handleTabSwitch(message.scrollDelta, sender.tab.id);
    } else if (message.type === 'TAB_SWITCHED') {
        notifyActiveTabOfTabSwitchingMode();
    } else if (message.type === "NAVIGATION_MODE") {
        onNavigationModeMessage(message);
    } else if (message.type === "TRIAGE_MODE") {
        onTriageModeMessage(message, sender);
    } else if (message.type === 'OPEN_OPTIONS_PAGE') {
        chrome.runtime.openOptionsPage(() => {
            const err = chrome.runtime.lastError;
            sendResponse(err ? { error: err.message } : { ok: true });
        });
    } else if (message.type === 'OPEN_PLANNER_PAGE') {
        const url = chrome.runtime.getURL('planner.html');
        chrome.tabs.create({ url }, () => {
            const err = chrome.runtime.lastError;
            sendResponse(err ? { error: err.message } : { ok: true });
        });
    }
    return true; // Indicates that sendResponse will be called asynchronously
}

var popupWindowId = null;
var isInNavigationMode = false;
var isInTriageMode = false;
/** @type {number | null} */
let lastFocusedWindowId = null;
let scrollDelta = 0;

/**
 * Exit triage when the focused browser window changes (not just the active tab).
 */
function onWindowFocusChanged(windowId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        return;
    }
    if (
        isInTriageMode &&
        lastFocusedWindowId != null &&
        windowId !== lastFocusedWindowId
    ) {
        isInTriageMode = false;
        void broadcastSwiftTabsUIModes();
    }
    lastFocusedWindowId = windowId;
}
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


async function broadcastSwiftTabsUIModes() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (tab.id == null) continue;
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: "NAVIGATION_MODE",
                isInNavigationMode,
            });
        } catch (e) {
            // Content script may not be loaded
        }
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: "TRIAGE_MODE",
                isInTriageMode,
            });
        } catch (e) {
            // Content script may not be loaded
        }
    }
}

async function onNavigationModeMessage(message) {
    isInNavigationMode = message.isInNavigationMode === true;
    if (isInNavigationMode) {
        isInTriageMode = false;
    }
    await broadcastSwiftTabsUIModes();
}

/**
 * @param {{ isInTriageMode?: boolean }} message
 * @param {chrome.runtime.MessageSender} sender
 */
async function onTriageModeMessage(message, sender) {
    isInTriageMode = message.isInTriageMode === true;
    if (isInTriageMode) {
        isInNavigationMode = false;
        if (sender?.tab?.windowId != null) {
            lastFocusedWindowId = sender.tab.windowId;
        } else {
            try {
                const w = await chrome.windows.getLastFocused({ populate: false });
                if (w?.id != null) lastFocusedWindowId = w.id;
            } catch (e) {
                // ignore
            }
        }
    }
    await broadcastSwiftTabsUIModes();
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

/**
 * Devices with synced sessions, grouped into windows (each Chrome session is one
 * tab or one window with tabs). HistoryView segments the device drill-in by window.
 */
async function apiGetSessionsOtherDevices() {
    const devices = await chrome.sessions.getDevices();
    const result = [];
    for (const d of devices || []) {
        const deviceName = d.deviceName || "Device";
        const sessions = d.sessions || [];
        if (sessions.length === 0) {
            result.push({
                deviceName,
                isPlaceholder: true,
                windows: [],
            });
            continue;
        }
        const windows = [];
        for (let si = 0; si < sessions.length; si++) {
            const sess = sessions[si];
            const sid =
                sess.sessionId != null && sess.sessionId !== ""
                    ? String(sess.sessionId)
                    : null;
            const wkey = `w-${deviceName.replace(/\s+/g, "-")}-${sid ?? `i${si}`}`;
            if (sess.tab) {
                const t = sess.tab;
                const tabSid =
                    t.sessionId != null && t.sessionId !== ""
                        ? String(t.sessionId)
                        : sid;
                windows.push({
                    key: wkey,
                    windowSessionId: sid,
                    lastModified: sess.lastModified,
                    tabs: [
                        {
                            sessionId: tabSid,
                            label: t.title || t.url || "Tab",
                            url: t.url || "",
                            favIconUrl: t.favIconUrl || "",
                            lastModified: sess.lastModified,
                        },
                    ],
                });
            } else if (sess.window) {
                const wtabs = sess.window.tabs || [];
                windows.push({
                    key: wkey,
                    windowSessionId: sid,
                    lastModified: sess.lastModified,
                    tabs: wtabs.map((t) => ({
                        sessionId:
                            t.sessionId != null && t.sessionId !== ""
                                ? String(t.sessionId)
                                : null,
                        label: t.title || t.url || "Tab",
                        url: t.url || "",
                        favIconUrl: t.favIconUrl || "",
                        lastModified: sess.lastModified,
                    })),
                });
            }
        }
        result.push({ deviceName, windows });
    }
    return result;
}

/**
 * After cross-window tab moves, Chrome may focus the destination window.
 * Restore focus to the window that hosts the Swift Tabs content script so
 * "new window" / move flows stay in the TabsView until the user activates a tab.
 */
async function restoreChromeWindowFocus(preferredWindowId, avoidWindowIds = []) {
    if (
        preferredWindowId != null &&
        avoidWindowIds.includes(preferredWindowId)
    ) {
        preferredWindowId = null;
    }
    const tryFocus = async (id) => {
        try {
            await chrome.windows.get(id);
            await chrome.windows.update(id, { focused: true });
            return true;
        } catch {
            return false;
        }
    };
    if (preferredWindowId != null && (await tryFocus(preferredWindowId))) {
        return;
    }
    const wins = await chrome.windows.getAll({ windowTypes: ["normal"] });
    const pick = wins.find((w) => !avoidWindowIds.includes(w.id));
    if (pick) {
        try {
            await chrome.windows.update(pick.id, { focused: true });
        } catch {
            /* ignore */
        }
    }
}

const chromeApiHandlers = {

    async GET_CURRENT_TAB(_, sender) {
        if (sender.tab) {
            return sender.tab;
        }
        // Extension pages (e.g. content-dev.html) have no sender.tab; use focused tab.
        const [active] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        return active ?? null;
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

    async UPDATE_TAB_URL({ tabId, url }) {
        if (tabId == null || typeof url !== "string" || !url.trim()) {
            throw new Error("UPDATE_TAB_URL requires tabId and url");
        }
        return chrome.tabs.update(tabId, { url: url.trim() });
    },

    async CREATE_TAB(options) {
        return chrome.tabs.create(options);
    },

    async ADD_TAB_TO_GROUP({ tabId, groupId }) {
        if (tabId == null || groupId == null) {
            throw new Error("ADD_TAB_TO_GROUP requires tabId and groupId");
        }
        await chrome.tabs.group({ tabIds: [tabId], groupId });
        broadcastTabsDataChanged();
        return { success: true };
    },

    async MOVE_TAB({ tabId, targetWindowId }, sender) {
        const t = await chrome.tabs.get(tabId);
        const fromWindowId = t.windowId;
        const restoreToWindowId = sender?.tab?.windowId ?? null;
        await chrome.tabs.move(tabId, { windowId: targetWindowId, index: -1 });
        broadcastTabsDataChanged();
        if (
            restoreToWindowId != null &&
            fromWindowId !== targetWindowId
        ) {
            await restoreChromeWindowFocus(restoreToWindowId, []);
        }
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

    async CREATE_WINDOW(
        { tabId, tabIds, focused = false, asPopup = false, incognito = false },
        sender,
    ) {
        const useFocused = focused === true;
        const restoreToWindowId = sender?.tab?.windowId ?? null;
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

        const wantIncognito = incognito === true;
        const sourceIncognito = metas[0].incognito === true;

        // Normal tabs cannot be moved into an incognito window; open URL(s) there and close sources.
        if (wantIncognito && !sourceIncognito) {
            const url = metas[0].url;
            if (!url || !/^https?:\/\//i.test(url)) {
                throw new Error(
                    "Only http(s) pages can be opened in a private window",
                );
            }
            const newWindow = await chrome.windows.create({
                url,
                focused: useFocused,
                incognito: true,
                ...(asPopup === true ? { type: "popup" } : {}),
            });
            for (const id of orderedIds) {
                await chrome.tabs.remove(id);
            }
            if (!useFocused) {
                await restoreChromeWindowFocus(restoreToWindowId, [newWindow.id]);
            }
            broadcastTabsDataChanged();
            return chrome.windows.get(newWindow.id, { populate: true });
        }

        // Always open an empty window first, then tabs.move — avoids Chrome
        // focusing/juggling tabId-on-create behavior.
        const newWindow = await chrome.windows.create({
            url: "about:blank",
            focused: useFocused,
            incognito: wantIncognito ? true : sourceIncognito,
            ...(asPopup === true ? { type: "popup" } : {}),
        });
        const blankTab = newWindow.tabs?.[0];
        for (const id of orderedIds) {
            await chrome.tabs.move(id, { windowId: newWindow.id, index: -1 });
        }
        if (blankTab?.id) {
            await chrome.tabs.remove(blankTab.id);
        }
        if (!useFocused) {
            await restoreChromeWindowFocus(restoreToWindowId, [newWindow.id]);
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
            maxResults: 1000,
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

    GET_SESSIONS_OTHER_DEVICES: apiGetSessionsOtherDevices,

    async RESTORE_SESSION({ sessionId }) {
        await chrome.sessions.restore(sessionId);
        broadcastTabsDataChanged();
        return { success: true };
    },

    async CREATE_EMPTY_WINDOW() {
        const w = await chrome.windows.create({ focused: false, url: "chrome://newtab" });
        broadcastTabsDataChanged();
        return w;
    },

    async CREATE_EMPTY_INCOGNITO_WINDOW() {
        const w = await chrome.windows.create({
            focused: false,
            url: "chrome://newtab",
            incognito: true,
        });
        broadcastTabsDataChanged();
        return w;
    },

    async CREATE_EMPTY_POPUP_WINDOW() {
        const w = await chrome.windows.create({
            focused: false,
            url: "chrome://newtab",
            type: "popup",
        });
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

    async GET_RECENT_DOWNLOADS() {

        if (typeof chrome.downloads?.search !== "function") {
            return [];
        }
        try {
            const items = await chrome.downloads.search({
                orderBy: ["-startTime"],
                limit: 100,
            });
            return items.map((d) => ({
                id: d.id,
                url: d.url || "",
                filename: d.filename || "",
                startTime: d.startTime,
                state: d.state,
                type: "download",
            }));
        } catch {
            return [];
        }
    },

    async OPEN_DOWNLOAD({ downloadId }) {
        if (downloadId == null) {
            throw new Error("OPEN_DOWNLOAD requires downloadId");
        }
        try {
            await chrome.downloads.open(downloadId);
        } catch {
            await chrome.downloads.show(downloadId);
        }
        return { success: true };
    },

    async GET_READING_LIST() {
        if (typeof chrome.readingList?.query !== "function") {
            return [];
        }
        try {
            const entries = await chrome.readingList.query({});
            return entries.map((e) => ({
                url: e.url,
                title: e.title || extractDomain(e.url),
                hasBeenRead: e.hasBeenRead === true,
                creationTime: e.creationTime,
                lastUpdateTime: e.lastUpdateTime,
                type: "reading",
            }));
        } catch {
            return [];
        }
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

        const endTime = Date.now();
        // 180 days
        const timeFrame = 180 * 24 * 60 * 60 * 1000;
        const startTime = endTime - timeFrame;
        const history = await chrome.history.search({
            text: "",
            startTime,
            endTime,
            maxResults: 1000,
        });


        const seenUrls = new Set();
        const uniqueHistory = [];

        for (const item of history) {
            if (!item.url || typeof item.url !== "string") continue;
            const colon = item.url.indexOf(":");
            if (colon > 0) {
                const scheme = item.url.slice(0, colon).toLowerCase();
                if (scheme === "chrome" || scheme === "chrome-extension") {
                    continue;
                }
            }

            const normalizedUrl = item.url
                .replace(/#.*$/, "")
                .replace(/\?.*$/, "");
            if (seenUrls.has(normalizedUrl)) continue;

            seenUrls.add(normalizedUrl);
            uniqueHistory.push({
                id: item.id,
                title: item.title || extractDomain(item.url),
                url: item.url,
                lastVisitTime: item.lastVisitTime,
                visitCount: item.visitCount,
                type: "history",
            });
        }



        return uniqueHistory;
    },

    async GET_BOOKMARKS_BAR() {
        const flat = [];

        async function walkFolder(folderId) {
            const children = await chrome.bookmarks.getChildren(folderId);
            for (const child of children) {
                if (child.url) {
                    flat.push({
                        id: child.id,
                        title: child.title || extractDomain(child.url),
                        url: child.url,
                        dateAdded: child.dateAdded,
                        type: "bookmark",
                    });
                } else {
                    await walkFolder(child.id);
                }
            }
        }

        await walkFolder("1");
        return flat.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    },

    async GET_ALL_BOOKMARKS() {
        const tree = await chrome.bookmarks.getTree();
        const allBookmarks = [];

        function walk(nodes) {
            for (const n of nodes) {
                if (n.url) {
                    allBookmarks.push({
                        id: n.id,
                        title: n.title || extractDomain(n.url),
                        url: n.url,
                        dateAdded: n.dateAdded,
                        type: "bookmark",
                    });
                }
                if (n.children?.length) walk(n.children);
            }
        }

        walk(tree);
        return allBookmarks.sort(
            (a, b) => (b.dateAdded || 0) - (a.dateAdded || 0),
        );
    },

    async APPS_GET_STATE() {
        return appsGetState();
    },

    async APPS_DISCOVER_FROM_HISTORY({ maxCandidates } = {}) {
        const n =
            typeof maxCandidates === "number" && maxCandidates > 0
                ? Math.min(200, maxCandidates)
                : undefined;
        return appsDiscoverMissingFromHistory(n);
    },

    async APPS_PUT_LAYOUT({ layout }) {
        await appsPutLayout(layout);
        return { ok: true };
    },

    async APPS_PUT_APP({ app }) {
        await appsPutApp(app);
        return { ok: true };
    },

    async APPS_RUN_ROUTINE({ scope, id, routineId }) {
        if (scope === "folder") {
            await executeFolderRoutine(id, routineId);
        } else {
            await executeAppRoutine(id, routineId);
        }
        return { ok: true };
    },

    async APPS_DELETE_APP({ appId }) {
        await appsDeleteApp(appId);
        return { ok: true };
    },

    async APPS_ADD_TO_HOME({ appId }) {
        const added = await appsAddAppToHomeEnd(appId);
        return { added };
    },

    async APPS_MERGE_INTO_FOLDER({ appIdA, appIdB, title }) {
        const folder = await appsMergeIntoFolder(appIdA, appIdB, title);
        return { folder };
    },

    async APPS_MOVE_APP_INTO_FOLDER({ appId, intoFolderId }) {
        await appsMoveAppIntoFolder(appId, intoFolderId);
        return { ok: true };
    },

    async APPS_MOVE_APP_TO_HOME_ROOT({ appId }) {
        await appsMoveAppToHomeRoot(appId);
        return { ok: true };
    },

    async APPS_REMOVE_FROM_HOME({ appId }) {
        await appsRemoveFromHome(appId);
        return { ok: true };
    },

    async APPS_CREATE_FOLDER({ title, parentFolderId } = {}) {
        const folder = await appsCreateEmptyFolder(
            typeof title === "string" ? title : "Folder",
            parentFolderId || null,
        );
        return { folder };
    },

    /**
     * @param {{ domainOrUrl: string, title?: string, addTo?: string }} p
     */
    async APPS_REGISTER_APP({ domainOrUrl, title, addTo } = {}) {
        const raw = typeof domainOrUrl === "string" ? domainOrUrl : "";
        /** @type {'registry_only' | 'home_end' | { folderId: string }} */
        let placement = "registry_only";
        if (addTo === "home") placement = "home_end";
        else if (typeof addTo === "string" && addTo.startsWith("fld_")) {
            placement = { folderId: addTo };
        }
        return appsRegisterOrEnsureApp(raw, title, placement);
    },

    async LINK_QUEUE_PUSH({ url, title }, sender) {
        const tabId = sender.tab?.id;
        if (tabId == null) throw new Error("LINK_QUEUE_PUSH requires sender tab");
        const sess = await chrome.storage.session.get(LINK_QUEUE_SESSION_KEY);
        const map = sess[LINK_QUEUE_SESSION_KEY] || {};
        const key = String(tabId);
        const q = map[key] || { urls: [] };
        q.urls.push({
            id: `lnk_${Date.now().toString(36)}`,
            url,
            title: title || "",
            savedAt: Date.now(),
        });
        map[key] = q;
        await chrome.storage.session.set({ [LINK_QUEUE_SESSION_KEY]: map });
        return { ok: true, size: q.urls.length };
    },

    async LINK_QUEUE_GET(_, sender) {
        const tabId = sender.tab?.id;
        if (tabId == null) return { urls: [] };
        const sess = await chrome.storage.session.get(LINK_QUEUE_SESSION_KEY);
        const map = sess[LINK_QUEUE_SESSION_KEY] || {};
        return { urls: map[String(tabId)]?.urls ?? [] };
    },

    async LINK_QUEUE_SHIFT_AND_NAVIGATE(_, sender) {
        const tabId = sender.tab?.id;
        if (tabId == null) throw new Error("LINK_QUEUE_SHIFT_AND_NAVIGATE requires sender tab");
        const sess = await chrome.storage.session.get(LINK_QUEUE_SESSION_KEY);
        const map = sess[LINK_QUEUE_SESSION_KEY] || {};
        const key = String(tabId);
        const q = map[key];
        if (!q?.urls?.length) return { opened: false };
        const [first, ...rest] = q.urls;
        q.urls = rest;
        map[key] = q;
        await chrome.storage.session.set({ [LINK_QUEUE_SESSION_KEY]: map });
        await chrome.tabs.update(tabId, { url: first.url });
        return { opened: true, url: first.url };
    },

    async PLANNER_BACKLOG_ADD_LINK({ url, title, timeframe }) {
        if (!url || !/^https?:\/\//i.test(url)) {
            throw new Error("Invalid URL");
        }
        if (!isTimeframe(timeframe)) {
            throw new Error("Invalid timeframe");
        }
        let t = typeof title === "string" ? title.trim() : "";
        if (!t) {
            try {
                t = new URL(url).hostname;
            } catch {
                t = "Link";
            }
        }
        const objective = createBlankObjective({
            timeframe,
            title: t,
            description: "",
            url,
        });
        await saveObjective(objective);
        chrome.runtime
            .sendMessage({ type: "PLANNER_OBJECTIVES_CHANGED" })
            .catch(() => { });
        return { ok: true, id: objective.id };
    },

    async CREATE_WINDOW_WITH_URL({ url, focused = true }) {
        if (!url || !/^https?:\/\//i.test(url)) {
            throw new Error("CREATE_WINDOW_WITH_URL requires http(s) URL");
        }
        const win = await chrome.windows.create({
            url,
            focused: focused !== false,
        });
        return win;
    },
};

chromeApiHandlers.GET_SESSIONS_OTHER_DEVICES = apiGetSessionsOtherDevices;

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
