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

    async focusWindow(windowId) {
        return this.sendMessage('FOCUS_WINDOW', { windowId });
    },

    async muteTab(tabId) {
        return this.sendMessage('MUTE_TAB', { tabId });
    },

    async discardTab(tabId) {
        return this.sendMessage('DISCARD_TAB', { tabId });
    },

    async createWindowWithTab(tabId) {
        return this.sendMessage('CREATE_WINDOW', { tabId });
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
    }
};
