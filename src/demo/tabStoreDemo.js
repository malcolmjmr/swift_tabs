/**
 * Demo build: same as src/stores/tabStore.js but without chrome.runtime.onMessage
 * (TAB_UPDATED / TABS_DATA_CHANGED never fire on a static page).
 */
import { writable, derived } from "svelte/store";
import { chromeService } from "../services/chromeApi";

const createTabStore = () => {
    const { subscribe, set, update } = writable({
        tabs: [],
        windows: [],
        activeTabId: null,
        activeWindowId: null,
        initialized: false,
    });

    let store = {
        subscribe,

        async init() {
            if (store.initialized) return;

            try {
                const windows = await chromeService.getWindows();
                const activeWindow = windows.find((w) => w.focused);
                const activeTab = activeWindow?.tabs.find((t) => t.active);

                update((state) => ({
                    ...state,
                    windows,
                    tabs: windows.flatMap((w) => w.tabs),
                    activeWindowId: activeWindow?.id,
                    activeTabId: activeTab?.id,
                    initialized: true,
                }));
            } catch (error) {
                console.error("Failed to initialize tab store:", error);
                throw error;
            }
        },

        async refreshState() {
            const windows = await chromeService.getWindows();
            const activeWindow = windows.find((w) => w.focused);
            const activeTab = activeWindow?.tabs.find((t) => t.active);

            update((state) => ({
                ...state,
                windows,
                tabs: windows.flatMap((w) => w.tabs),
                activeWindowId: activeWindow?.id,
                activeTabId: activeTab?.id,
            }));
        },

        async closeTab(tabId) {
            await chromeService.closeTab(tabId);
            await store.refreshState();
        },

        async pinTab(tabId) {
            await chromeService.pinTab(tabId);
            await store.refreshState();
        },

        async duplicateTab(tabId) {
            await chromeService.duplicateTab(tabId);
            await store.refreshState();
        },

        async reloadTab(tabId) {
            await chromeService.reloadTab(tabId);
            await store.refreshState();
        },

        async createTab(options = {}) {
            await chromeService.createTab(options);
            await store.refreshState();
        },

        async activateTab(tabId) {
            await chromeService.activateTab(tabId);
            await store.refreshState();
        },

        async moveTab(tabId, targetWindowId) {
            await chromeService.moveTab(tabId, targetWindowId);
            await store.refreshState();
        },

        async moveTabWithinWindow(tabId, delta) {
            await chromeService.moveTabWithinWindow(tabId, delta);
            await store.refreshState();
        },
    };

    return store;
};

export const tabStore = createTabStore();

export const tabs = derived(tabStore, ($store) => $store.tabs);
export const windows = derived(tabStore, ($store) => $store.windows);
export const activeTabId = derived(tabStore, ($store) => $store.activeTabId);
export const activeWindowId = derived(tabStore, ($store) => $store.activeWindowId);
export const currentWindowTabs = derived(
    [tabStore, activeWindowId],
    ([$store, $activeWindowId]) =>
        $store.tabs.filter((t) => t.windowId === $activeWindowId),
);
