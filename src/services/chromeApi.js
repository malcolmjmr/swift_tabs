/**
 * Background returns `{ error: string }` on failure; that must reject, not resolve,
 * or UI code assigns objects into "arrays" and breaks.
 * @param {unknown} r
 */
function isChromeApiErrorPayload(r) {
    return (
        r != null &&
        typeof r === "object" &&
        !Array.isArray(r) &&
        typeof /** @type {{ error?: unknown }} */ (r).error === "string" &&
        String(/** @type {{ error: string }} */ (r).error).length > 0
    );
}

// Service to handle tab operations through the background script
export const chromeService = {
    async sendMessage(endpoint, data = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    type: "CHROME_API",
                    endpoint,
                    data,
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(
                            new Error(
                                chrome.runtime.lastError.message ||
                                    "Extension messaging failed",
                            ),
                        );
                        return;
                    }
                    if (isChromeApiErrorPayload(response)) {
                        reject(
                            new Error(
                                String(
                                    /** @type {{ error: string }} */ (response)
                                        .error,
                                ),
                            ),
                        );
                        return;
                    }
                    resolve(response);
                },
            );
        });
    },

    async getCurrentTab() {
        return this.sendMessage('GET_CURRENT_TAB');
    },

    async getTab(tabId) {
        return this.sendMessage('GET_TAB', { tabId });
    },

    async getTabs() {
        return this.sendMessage('GET_TABS');
    },

    async getWindows() {
        return this.sendMessage('GET_WINDOWS');
    },

    async getCurrentWindow() {
        return this.sendMessage('GET_CURRENT_WINDOW');
    },

    async activateTab(tabId) {
        return this.sendMessage('ACTIVATE_TAB', { tabId });
    },

    async closeTab(tabId) {
        return this.sendMessage('CLOSE_TAB', { tabId });
    },

    async pinTab(tabId) {
        return this.sendMessage('PIN_TAB', { tabId });
    },

    async duplicateTab(tabId) {
        return this.sendMessage('DUPLICATE_TAB', { tabId });
    },

    async reloadTab(tabId) {
        return this.sendMessage('RELOAD_TAB', { tabId });
    },

    async createTab(options) {
        return this.sendMessage('CREATE_TAB', options);
    },

    async moveTab(tabId, targetWindowId) {
        return this.sendMessage('MOVE_TAB', { tabId, targetWindowId });
    },

    /**
     * @param {number} tabId
     * @param {number} groupId
     */
    async addTabToGroup(tabId, groupId) {
        return this.sendMessage("ADD_TAB_TO_GROUP", { tabId, groupId });
    },

    async moveTabWithinWindow(tabId, delta) {
        return this.sendMessage('MOVE_TAB_WITHIN_WINDOW', { tabId, delta });
    },

    async focusWindow(windowId) {
        return this.sendMessage('FOCUS_WINDOW', { windowId });
    },

    async muteTab(tabId) {
        return this.sendMessage('MUTE_TAB', { tabId });
    },

    async discardTab(tabId) {
        return this.sendMessage('DISCARD_TAB', { tabId });
    },

    /**
     * @param {number} tabId
     * @param {{ focused?: boolean; asPopup?: boolean }} [options] — default focused: false
     */
    async createWindowWithTab(tabId, options = {}) {
        return this.sendMessage("CREATE_WINDOW", {
            tabId,
            focused: options.focused === true,
            asPopup: options.asPopup === true,
        });
    },

    /**
     * Move multiple tabs from the same window into a new window (order preserved).
     * @param {number[]} tabIds
     * @param {{ focused?: boolean; asPopup?: boolean }} [options]
     */
    async createWindowWithTabs(tabIds, options = {}) {
        return this.sendMessage("CREATE_WINDOW", {
            tabIds,
            focused: options.focused === true,
            asPopup: options.asPopup === true,
        });
    },

    /**
     * @param {number} tabId
     * @param {string} url
     */
    async updateTabUrl(tabId, url) {
        return this.sendMessage("UPDATE_TAB_URL", { tabId, url });
    },

    async copyTabUrl(tabId) {
        const res = await this.sendMessage('COPY_TAB_URL', { tabId });
        return res?.url ?? null;
    },

    async closeOtherTabs(tabId) {
        return this.sendMessage('CLOSE_OTHER_TABS', { tabId });
    },

    async closeTabsToRight(tabId) {
        return this.sendMessage('CLOSE_TABS_TO_RIGHT', { tabId });
    },

    async searchBookmarks(query) {
        return this.sendMessage('SEARCH_BOOKMARKS', { query });
    },

    async searchHistory(query) {
        return this.sendMessage('SEARCH_HISTORY', { query });
    },

    async getTabGroups() {
        return this.sendMessage('GET_TAB_GROUPS');
    },

    async getRecentlyClosed() {
        return this.sendMessage('GET_RECENTLY_CLOSED');
    },

    async getSessionsOtherDevices() {
        const r = await this.sendMessage("GET_SESSIONS_OTHER_DEVICES");
        return Array.isArray(r) ? r : [];
    },

    async restoreSession(sessionId) {
        return this.sendMessage("RESTORE_SESSION", { sessionId });
    },

    async createEmptyWindow() {
        return this.sendMessage('CREATE_EMPTY_WINDOW');
    },

    async createEmptyIncognitoWindow() {
        return this.sendMessage("CREATE_EMPTY_INCOGNITO_WINDOW");
    },

    async createEmptyPopupWindow() {
        return this.sendMessage("CREATE_EMPTY_POPUP_WINDOW");
    },

    async activateTabGroup(groupId, windowId) {
        return this.sendMessage('ACTIVATE_TAB_GROUP', { groupId, windowId });
    },

    async getSessionsFolderBookmarks() {
        return this.sendMessage('GET_SESSIONS_FOLDER_BOOKMARKS');
    },

    async getFavoriteDomains() {
        return this.sendMessage('GET_FAVORITE_DOMAINS');
    },

    async getRecentHistory() {
        const r = await this.sendMessage("GET_RECENT_HISTORY");
        return Array.isArray(r) ? r : [];
    },

    async getRecentDownloads() {
        const r = await this.sendMessage("GET_RECENT_DOWNLOADS");
        return Array.isArray(r) ? r : [];
    },

    async openDownload(downloadId) {
        return this.sendMessage("OPEN_DOWNLOAD", { downloadId });
    },

    async getReadingList() {
        const r = await this.sendMessage("GET_READING_LIST");
        return Array.isArray(r) ? r : [];
    },

    async getBookmarksBar() {
        const r = await this.sendMessage("GET_BOOKMARKS_BAR");
        return Array.isArray(r) ? r : [];
    },

    async getAllBookmarks() {
        const r = await this.sendMessage("GET_ALL_BOOKMARKS");
        return Array.isArray(r) ? r : [];
    },

    async appsGetState() {
        return this.sendMessage("APPS_GET_STATE");
    },

    async appsPutLayout(layout) {
        return this.sendMessage("APPS_PUT_LAYOUT", { layout });
    },

    async appsPutApp(app) {
        return this.sendMessage("APPS_PUT_APP", { app });
    },

    async appsDeleteApp(appId) {
        return this.sendMessage("APPS_DELETE_APP", { appId });
    },

    async appsAddToHome(appId) {
        return this.sendMessage("APPS_ADD_TO_HOME", { appId });
    },

    async appsMergeIntoFolder(appIdA, appIdB, title) {
        return this.sendMessage("APPS_MERGE_INTO_FOLDER", {
            appIdA,
            appIdB,
            title,
        });
    },

    async appsMoveAppIntoFolder(appId, intoFolderId) {
        return this.sendMessage("APPS_MOVE_APP_INTO_FOLDER", {
            appId,
            intoFolderId,
        });
    },

    async appsMoveAppToHomeRoot(appId) {
        return this.sendMessage("APPS_MOVE_APP_TO_HOME_ROOT", { appId });
    },

    async appsRemoveFromHome(appId) {
        return this.sendMessage("APPS_REMOVE_FROM_HOME", { appId });
    },

    async linkQueuePush(url, title = "") {
        return this.sendMessage("LINK_QUEUE_PUSH", { url, title });
    },

    async linkQueueGet() {
        return this.sendMessage("LINK_QUEUE_GET", {});
    },

    async linkQueueNavigateNext() {
        return this.sendMessage("LINK_QUEUE_SHIFT_AND_NAVIGATE", {});
    },

    async plannerBacklogAddLink(url, title, timeframe) {
        return this.sendMessage("PLANNER_BACKLOG_ADD_LINK", {
            url,
            title,
            timeframe,
        });
    },

    async createWindowWithUrl(url, options = {}) {
        return this.sendMessage("CREATE_WINDOW_WITH_URL", {
            url,
            focused: options.focused !== false,
        });
    },
};
