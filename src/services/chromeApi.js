// Service to handle tab operations through the background script
export const chromeService = {
    async sendMessage(endpoint, data = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: "CHROME_API",
                endpoint,
                data
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
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
     * @param {{ focused?: boolean }} [options] — default focused: false
     */
    async createWindowWithTab(tabId, options = {}) {
        return this.sendMessage("CREATE_WINDOW", {
            tabId,
            focused: options.focused === true,
        });
    },

    /**
     * Move multiple tabs from the same window into a new window (order preserved).
     * @param {number[]} tabIds
     * @param {{ focused?: boolean }} [options]
     */
    async createWindowWithTabs(tabIds, options = {}) {
        return this.sendMessage("CREATE_WINDOW", {
            tabIds,
            focused: options.focused === true,
        });
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

    async restoreSession(sessionId) {
        return this.sendMessage('RESTORE_SESSION', { sessionId });
    },

    async createEmptyWindow() {
        return this.sendMessage('CREATE_EMPTY_WINDOW');
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
        return this.sendMessage('GET_RECENT_HISTORY');
    },

    async getBookmarksBar() {
        return this.sendMessage('GET_BOOKMARKS_BAR');
    },

    async getAllBookmarks() {
        return this.sendMessage('GET_ALL_BOOKMARKS');
    },
};
