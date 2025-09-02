import { writable, derived } from "svelte/store";
import { tabService } from "../services/tabService";

const createTabStore = () => {
    const { subscribe, set, update } = writable({
        tabs: [],
        windows: [],
        activeTabId: null,
        activeWindowId: null,
        initialized: false
    });

    let store = {
        subscribe,

        async init() {
            if (store.initialized) return;

            try {
                const windows = await tabService.getWindows();
                const activeWindow = windows.find(w => w.focused);
                const activeTab = activeWindow?.tabs.find(t => t.active);

                update(state => ({
                    ...state,
                    windows,
                    tabs: windows.flatMap(w => w.tabs),
                    activeWindowId: activeWindow?.id,
                    activeTabId: activeTab?.id,
                    initialized: true
                }));

                // Set up listeners for tab changes
                chrome.runtime.onMessage.addListener((message) => {
                    if (message.type === 'TAB_UPDATED') {
                        store.refreshState();
                    }
                });
            } catch (error) {
                console.error('Failed to initialize tab store:', error);
                throw error;
            }
        },

        async refreshState() {
            const windows = await tabService.getWindows();
            const activeWindow = windows.find(w => w.focused);
            const activeTab = activeWindow?.tabs.find(t => t.active);

            update(state => ({
                ...state,
                windows,
                tabs: windows.flatMap(w => w.tabs),
                activeWindowId: activeWindow?.id,
                activeTabId: activeTab?.id
            }));
        },

        async closeTab(tabId) {
            await tabService.closeTab(tabId);
            await store.refreshState();
        },

        async pinTab(tabId) {
            await tabService.pinTab(tabId);
            await store.refreshState();
        },

        async duplicateTab(tabId) {
            await tabService.duplicateTab(tabId);
            await store.refreshState();
        },

        async reloadTab(tabId) {
            await tabService.reloadTab(tabId);
            await store.refreshState();
        },

        async createTab(options = {}) {
            await tabService.createTab(options);
            await store.refreshState();
        },

        async activateTab(tabId) {
            await tabService.activateTab(tabId);
            await store.refreshState();
        },

        async moveTab(tabId, targetWindowId) {
            await tabService.moveTab(tabId, targetWindowId);
            await store.refreshState();
        }
    };

    return store;
};

export const tabStore = createTabStore();

// Derived stores
export const tabs = derived(tabStore, $store => $store.tabs);
export const windows = derived(tabStore, $store => $store.windows);
export const activeTabId = derived(tabStore, $store => $store.activeTabId);
export const activeWindowId = derived(tabStore, $store => $store.activeWindowId);
export const currentWindowTabs = derived(
    [tabStore, activeWindowId],
    ([$store, $activeWindowId]) =>
        $store.tabs.filter(t => t.windowId === $activeWindowId)
);