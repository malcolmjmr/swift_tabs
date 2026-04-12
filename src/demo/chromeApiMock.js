/**
 * In-memory chromeService for the static landing demo (replaces src/services/chromeApi.js via Rollup alias).
 */
import { cloneSampleWindows } from "./fixtures/sampleWindows.js";
import { emptyLayout } from "../services/apps/appsModel.js";

/** @type {chrome.windows.Window[]} */
let windowsState = [];
let nextSyntheticId = 10_000;

function recomputeNextId() {
    let max = 0;
    for (const w of windowsState) {
        max = Math.max(max, w.id ?? 0);
        for (const t of w.tabs || []) {
            max = Math.max(max, t.id ?? 0);
        }
    }
    nextSyntheticId = Math.max(nextSyntheticId, max + 1);
}

export function resetDemoState() {
    windowsState = cloneSampleWindows();
    nextSyntheticId = 10_000;
    recomputeNextId();
}

resetDemoState();

function cloneWindows() {
    return /** @type {chrome.windows.Window[]} */ (
        structuredClone(windowsState)
    );
}

/** @param {number} tabId */
function findTabEntry(tabId) {
    for (const w of windowsState) {
        const tabs = w.tabs || [];
        const index = tabs.findIndex((t) => t.id === tabId);
        if (index >= 0) return { win: w, index, tab: tabs[index] };
    }
    return null;
}

function reindexTabs(win) {
    if (!win.tabs) return;
    win.tabs.forEach((t, i) => {
        t.index = i;
        t.windowId = win.id;
    });
}

/** @param {number | undefined} windowId */
function ensureFocusedWindow(windowId) {
    for (const w of windowsState) {
        w.focused = w.id === windowId;
    }
}

export const chromeService = {
    async sendMessage() {
        throw new Error("Demo chromeService does not use sendMessage");
    },

    async getWindows() {
        return cloneWindows();
    },

    async getTabs() {
        return windowsState.flatMap((w) => w.tabs || []).map((t) => ({ ...t }));
    },

    async getCurrentWindow() {
        const w =
            windowsState.find((x) => x.focused) ?? windowsState[0] ?? null;
        return w ? structuredClone(w) : null;
    },

    async getCurrentTab() {
        const w = windowsState.find((x) => x.focused) ?? windowsState[0];
        if (!w?.tabs?.length) return null;
        const active = w.tabs.find((t) => t.active) ?? w.tabs[0];
        return active ? { ...active } : null;
    },

    /** @param {{ tabId: number }} p */
    async getTab({ tabId }) {
        const ent = findTabEntry(tabId);
        return ent ? { ...ent.tab } : null;
    },

    /** @param {number} tabId */
    async activateTab(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent) return null;
        for (const w of windowsState) {
            w.focused = w.id === ent.win.id;
            for (const t of w.tabs || []) {
                t.active = t.id === tabId;
            }
        }
        return { ...ent.tab, active: true };
    },

    /** @param {number} tabId */
    async closeTab(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent) return { success: true };

        const { win, index } = ent;
        const totalTabs = windowsState.reduce(
            (n, w) => n + (w.tabs?.length || 0),
            0,
        );
        if (totalTabs <= 1) {
            return { success: true };
        }

        win.tabs.splice(index, 1);
        reindexTabs(win);

        if (win.tabs.length === 0) {
            windowsState = windowsState.filter((w) => w.id !== win.id);
            if (windowsState.length > 0) {
                const nw = windowsState[0];
                nw.focused = true;
                if (nw.tabs?.length) {
                    const pick = nw.tabs.find((t) => t.active) ?? nw.tabs[0];
                    for (const t of nw.tabs) t.active = t.id === pick.id;
                }
            }
        } else {
            const hadActive = ent.tab.active;
            if (hadActive) {
                const ni = Math.min(index, win.tabs.length - 1);
                for (const t of win.tabs) t.active = t.id === win.tabs[ni].id;
            }
        }

        return { success: true };
    },

    /** @param {number} tabId */
    async pinTab(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent) return null;
        ent.tab.pinned = !ent.tab.pinned;
        return { ...ent.tab };
    },

    /** @param {number} tabId */
    async duplicateTab(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent || !ent.win.tabs) return null;
        const copy = {
            ...structuredClone(ent.tab),
            id: nextSyntheticId++,
            active: false,
            index: ent.index + 1,
        };
        ent.win.tabs.splice(ent.index + 1, 0, copy);
        reindexTabs(ent.win);
        return { ...copy };
    },

    /** @param {number} _tabId */
    async reloadTab(_tabId) {
        return { success: true };
    },

    /** @param {Record<string, unknown>} options */
    async createTab(options) {
        const w = windowsState.find((x) => x.focused) ?? windowsState[0];
        if (!w) return null;
        if (!w.tabs) w.tabs = [];
        const tab = {
            id: nextSyntheticId++,
            index: w.tabs.length,
            windowId: w.id,
            title: (options.title && String(options.title)) || "New tab",
            url:
                (options.url && String(options.url)) || "https://example.com/new",
            active: options.active !== false,
            pinned: false,
            favIconUrl: "https://www.google.com/s2/favicons?domain=example.com&sz=32",
        };
        if (tab.active) {
            for (const t of w.tabs) t.active = false;
        }
        w.tabs.push(tab);
        reindexTabs(w);
        return { ...tab };
    },

    /** @param {number} tabId @param {number} targetWindowId */
    async moveTab(tabId, targetWindowId) {
        const ent = findTabEntry(tabId);
        if (!ent) return { success: false };
        const target = windowsState.find((w) => w.id === targetWindowId);
        if (!target) return { success: false };

        ent.win.tabs.splice(ent.index, 1);
        reindexTabs(ent.win);
        if (!target.tabs) target.tabs = [];
        ent.tab.windowId = target.id;
        ent.tab.active = false;
        target.tabs.push(ent.tab);
        reindexTabs(target);

        if (ent.win.tabs.length === 0) {
            windowsState = windowsState.filter((w) => w.id !== ent.win.id);
        }

        return { success: true };
    },

    /** @param {number} tabId @param {number} delta */
    async moveTabWithinWindow(tabId, delta) {
        const ent = findTabEntry(tabId);
        if (!ent || !ent.win.tabs) return { success: false };
        const sorted = [...ent.win.tabs].sort((a, b) => a.index - b.index);
        const idx = sorted.findIndex((t) => t.id === tabId);
        if (idx < 0) return { success: false };
        const step = Number(delta) >= 0 ? 1 : -1;
        const newIdx = Math.max(0, Math.min(sorted.length - 1, idx + step));
        if (newIdx === idx) return { success: true };
        const [removed] = sorted.splice(idx, 1);
        sorted.splice(newIdx, 0, removed);
        ent.win.tabs = sorted;
        reindexTabs(ent.win);
        return { success: true };
    },

    /** @param {number} windowId */
    async focusWindow(windowId) {
        ensureFocusedWindow(windowId);
        return { success: true };
    },

    /** @param {number} _tabId */
    async muteTab(_tabId) {
        return { success: true };
    },

    /** @param {number} _tabId */
    async discardTab(_tabId) {
        return { success: true };
    },

    /** @param {number} tabId @param {{ focused?: boolean; asPopup?: boolean; incognito?: boolean }} [options] */
    async createWindowWithTab(tabId, options = {}) {
        return this.createWindowWithTabs([tabId], options);
    },

    /**
     * @param {number[]} tabIds
     * @param {{ focused?: boolean; asPopup?: boolean; incognito?: boolean }} [options]
     */
    async createWindowWithTabs(tabIds, options = {}) {
        const ids = [...new Set(tabIds)].filter((id) => id != null);
        if (ids.length === 0) {
            throw new Error("CREATE_WINDOW requires tabId or tabIds");
        }
        const metas = ids
            .map((id) => findTabEntry(id))
            .filter(Boolean)
            .map((e) => e.tab);
        if (metas.length !== ids.length) {
            throw new Error("Tab not found");
        }
        const sourceWindowId = metas[0].windowId;
        if (!metas.every((t) => t.windowId === sourceWindowId)) {
            throw new Error("All tabs must be in the same window");
        }
        const sorted = [...metas].sort((a, b) => a.index - b.index);
        const sourceWin = windowsState.find((w) => w.id === sourceWindowId);
        if (!sourceWin?.tabs) throw new Error("Source window missing");

        const wantIncognito = options.incognito === true;
        const sourceIncognito = sorted[0].incognito === true;

        if (wantIncognito && !sourceIncognito) {
            const url = sorted[0].url;
            if (!url || !/^https?:\/\//i.test(url)) {
                throw new Error(
                    "Only http(s) pages can be opened in a private window",
                );
            }
            const hadFocus = !!sourceWin.focused;
            const newId = nextSyntheticId++;
            /** @type {chrome.tabs.Tab} */
            const movedTab = {
                ...structuredClone(sorted[0]),
                id: nextSyntheticId++,
                windowId: newId,
                index: 0,
                incognito: true,
            };
            /** @type {chrome.windows.Window} */
            const newWin = {
                id: newId,
                focused: false,
                state: "normal",
                type: options.asPopup === true ? "popup" : "normal",
                incognito: true,
                tabs: [movedTab],
            };
            for (const t of sorted) {
                const ent = findTabEntry(t.id);
                if (ent) {
                    ent.win.tabs.splice(ent.index, 1);
                    reindexTabs(ent.win);
                }
            }
            if (sourceWin.tabs.length === 0) {
                windowsState = windowsState.filter((w) => w.id !== sourceWin.id);
            }
            windowsState.push(newWin);
            if (options.focused === true) {
                ensureFocusedWindow(newWin.id);
            } else if (hadFocus) {
                const anchor =
                    windowsState.find((w) => w.focused && (w.tabs?.length ?? 0) > 0) ??
                    windowsState.find((w) => (w.tabs?.length ?? 0) > 0);
                if (anchor) ensureFocusedWindow(anchor.id);
                else ensureFocusedWindow(newWin.id);
            }
            if (!windowsState.some((w) => w.focused)) {
                const pick =
                    windowsState.find((w) => (w.tabs?.length ?? 0) > 0) ?? newWin;
                ensureFocusedWindow(pick.id);
            }
            return structuredClone(newWin);
        }

        const hadFocus = !!sourceWin.focused;
        const newId = nextSyntheticId++;
        /** @type {chrome.windows.Window} */
        const newWin = {
            id: newId,
            focused: false,
            state: "normal",
            type: options.asPopup === true ? "popup" : "normal",
            incognito: wantIncognito ? true : sourceIncognito,
            tabs: [],
        };

        for (const t of sorted) {
            const ent = findTabEntry(t.id);
            if (ent) {
                ent.win.tabs.splice(ent.index, 1);
                reindexTabs(ent.win);
            }
            t.windowId = newWin.id;
            newWin.tabs.push(t);
        }
        reindexTabs(newWin);

        if (sourceWin.tabs.length === 0) {
            windowsState = windowsState.filter((w) => w.id !== sourceWin.id);
        }

        windowsState.push(newWin);

        if (options.focused === true) {
            ensureFocusedWindow(newWin.id);
        } else if (hadFocus) {
            const anchor =
                windowsState.find((w) => w.focused && (w.tabs?.length ?? 0) > 0) ??
                windowsState.find((w) => (w.tabs?.length ?? 0) > 0);
            if (anchor) ensureFocusedWindow(anchor.id);
            else ensureFocusedWindow(newWin.id);
        }

        if (!windowsState.some((w) => w.focused)) {
            const pick =
                windowsState.find((w) => (w.tabs?.length ?? 0) > 0) ?? newWin;
            ensureFocusedWindow(pick.id);
        }

        return structuredClone(newWin);
    },

    /** @param {number} tabId */
    async copyTabUrl(tabId) {
        const ent = findTabEntry(tabId);
        return { url: ent?.tab?.url ?? "" };
    },

    /**
     * @param {number} tabId
     * @param {string} url
     */
    async updateTabUrl(tabId, url) {
        const ent = findTabEntry(tabId);
        if (!ent?.tab) return null;
        ent.tab.url = url.trim();
        return { ...ent.tab };
    },

    /** @param {number} _tabId @param {number} _groupId */
    async addTabToGroup(_tabId, _groupId) {
        return { success: true };
    },

    /** @param {number} tabId */
    async closeOtherTabs(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent?.win.tabs) return { success: true };
        ent.win.tabs = ent.win.tabs.filter((t) => t.id === tabId);
        reindexTabs(ent.win);
        for (const t of ent.win.tabs) t.active = true;
        return { success: true };
    },

    /** @param {number} tabId */
    async closeTabsToRight(tabId) {
        const ent = findTabEntry(tabId);
        if (!ent?.win.tabs) return { success: true };
        const sorted = [...ent.win.tabs].sort((a, b) => a.index - b.index);
        const idx = sorted.findIndex((t) => t.id === tabId);
        if (idx < 0) return { success: true };
        ent.win.tabs = sorted.slice(0, idx + 1);
        reindexTabs(ent.win);
        return { success: true };
    },

    async searchBookmarks() {
        return [];
    },

    async searchHistory() {
        return [
            {
                id: "hist_1",
                url: "https://github.com/malcolmjmr/swift_tabs",
                title: "swift_tabs - GitHub",
                lastVisitTime: Date.now() - 1000 * 60 * 5,
                visitCount: 12,
            },
            {
                id: "hist_2",
                url: "https://linear.app/example",
                title: "Linear - Project Management",
                lastVisitTime: Date.now() - 1000 * 60 * 30,
                visitCount: 45,
            },
            {
                id: "hist_3",
                url: "https://www.notion.so",
                title: "Notion - Workspace",
                lastVisitTime: Date.now() - 1000 * 60 * 60,
                visitCount: 89,
            },
            {
                id: "hist_4",
                url: "https://docs.google.com",
                title: "Google Docs",
                lastVisitTime: Date.now() - 1000 * 60 * 60 * 2,
                visitCount: 23,
            },
            {
                id: "hist_5",
                url: "https://www.youtube.com",
                title: "YouTube",
                lastVisitTime: Date.now() - 1000 * 60 * 60 * 4,
                visitCount: 156,
            },
            {
                id: "hist_6",
                url: "https://news.ycombinator.com",
                title: "Hacker News",
                lastVisitTime: Date.now() - 1000 * 60 * 60 * 6,
                visitCount: 78,
            },
            {
                id: "hist_7",
                url: "https://www.reddit.com/r/programming",
                title: "Programming - Reddit",
                lastVisitTime: Date.now() - 1000 * 60 * 60 * 8,
                visitCount: 34,
            },
            {
                id: "hist_8",
                url: "https://stackoverflow.com",
                title: "Stack Overflow",
                lastVisitTime: Date.now() - 1000 * 60 * 60 * 12,
                visitCount: 67,
            },
        ];
    },

    async getTabGroups() {
        return [];
    },

    async getRecentlyClosed() {
        const fav = (host) =>
            `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
        return [
            {
                tab: {
                    id: 2001,
                    title: "Vercel Dashboard",
                    url: "https://vercel.com/dashboard",
                    favIconUrl: fav("vercel.com"),
                },
                lastModified: Date.now() - 1000 * 60 * 15,
            },
            {
                tab: {
                    id: 2002,
                    title: "Figma - Design System",
                    url: "https://www.figma.com/design",
                    favIconUrl: fav("figma.com"),
                },
                lastModified: Date.now() - 1000 * 60 * 45,
            },
            {
                window: {
                    id: 99,
                    tabs: [
                        {
                            id: 2003,
                            title: "MDN Web Docs",
                            url: "https://developer.mozilla.org",
                            favIconUrl: fav("developer.mozilla.org"),
                        },
                        {
                            id: 2004,
                            title: "Can I use...",
                            url: "https://caniuse.com",
                            favIconUrl: fav("caniuse.com"),
                        },
                        {
                            id: 2005,
                            title: "web.dev",
                            url: "https://web.dev",
                            favIconUrl: fav("web.dev"),
                        },
                    ],
                },
                lastModified: Date.now() - 1000 * 60 * 60 * 2,
            },
        ];
    },

    async getSessionsOtherDevices() {
        const fav = (host) =>
            `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
        return [
            {
                deviceName: "MacBook Pro",
                deviceType: "laptop",
                sessions: [
                    {
                        window: {
                            id: 301,
                            tabs: [
                                {
                                    id: 3001,
                                    title: "Stripe Dashboard",
                                    url: "https://dashboard.stripe.com",
                                    favIconUrl: fav("stripe.com"),
                                },
                                {
                                    id: 3002,
                                    title: "AWS Console",
                                    url: "https://console.aws.amazon.com",
                                    favIconUrl: fav("aws.amazon.com"),
                                },
                            ],
                        },
                        lastModified: Date.now() - 1000 * 60 * 30,
                    },
                    {
                        tab: {
                            id: 3003,
                            title: "Kubernetes Documentation",
                            url: "https://kubernetes.io/docs",
                            favIconUrl: fav("kubernetes.io"),
                        },
                        lastModified: Date.now() - 1000 * 60 * 60,
                    },
                ],
            },
            {
                deviceName: "iPhone 15 Pro",
                deviceType: "phone",
                sessions: [
                    {
                        tab: {
                            id: 4001,
                            title: "Maps - Directions to Restaurant",
                            url: "https://maps.google.com",
                            favIconUrl: fav("google.com"),
                        },
                        lastModified: Date.now() - 1000 * 60 * 5,
                    },
                ],
            },
            {
                deviceName: "iPad Air",
                deviceType: "tablet",
                sessions: [
                    {
                        window: {
                            id: 401,
                            tabs: [
                                {
                                    id: 4002,
                                    title: "YouTube - Tech Reviews",
                                    url: "https://www.youtube.com",
                                    favIconUrl: fav("youtube.com"),
                                },
                                {
                                    id: 4003,
                                    title: "Netflix",
                                    url: "https://www.netflix.com",
                                    favIconUrl: fav("netflix.com"),
                                },
                            ],
                        },
                        lastModified: Date.now() - 1000 * 60 * 60 * 3,
                    },
                ],
            },
        ];
    },

    async restoreSession() {
        return { success: true };
    },

    async createEmptyWindow() {
        const id = nextSyntheticId++;
        const tabId = nextSyntheticId++;
        /** @type {chrome.windows.Window} */
        const win = {
            id,
            focused: false,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                {
                    id: tabId,
                    index: 0,
                    windowId: id,
                    title: "New window",
                    url: "about:blank",
                    active: true,
                    pinned: false,
                },
            ],
        };
        windowsState.push(win);
        return structuredClone(win);
    },

    async createEmptyIncognitoWindow() {
        const w = await this.createEmptyWindow();
        if (w) w.incognito = true;
        return w;
    },

    async createEmptyPopupWindow() {
        return this.createEmptyWindow();
    },

    async activateTabGroup() {
        return { success: true };
    },

    async getSessionsFolderBookmarks() {
        return [];
    },

    async getFavoriteDomains() {
        return [];
    },

    async getRecentHistory() {
        return [];
    },

    async getRecentDownloads() {
        return [];
    },

    async openDownload() {
        return { success: true };
    },

    async getReadingList() {
        return [];
    },

    async getBookmarksBar() {
        return [];
    },

    async getAllBookmarks() {
        return [];
    },

    async appsGetState() {
        return { apps: [], layout: emptyLayout(), recentHistoryPreview: [] };
    },

    async appsDiscoverFromHistory() {
        return { added: 0, domains: [] };
    },

    async appsPutLayout() {
        return { ok: true };
    },

    async appsPutApp() {
        return { ok: true };
    },

    async appsDeleteApp() {
        return { ok: true };
    },

    async appsAddToHome() {
        return { ok: true };
    },

    async appsMergeIntoFolder() {
        return { ok: true };
    },

    async appsMoveAppIntoFolder() {
        return { ok: true };
    },

    async appsMoveAppToHomeRoot() {
        return { ok: true };
    },

    async appsRemoveFromHome() {
        return { ok: true };
    },

    async appsCreateFolder() {
        return {
            folder: {
                kind: "folder",
                id: "fld_demo",
                title: "Folder",
                items: [],
            },
        };
    },

    async appsRegisterApp() {
        return { appId: "app_demo", created: true };
    },

    async appsRunRoutine() {
        return { ok: true };
    },

    async linkQueuePush() {
        return { ok: true };
    },

    async linkQueueGet() {
        return { items: [] };
    },

    async linkQueueNavigateNext() {
        return { ok: true };
    },

    async plannerBacklogAddLink() {
        return { ok: true };
    },

    async createWindowWithUrl(url, options = {}) {
        const id = nextSyntheticId++;
        const tabId = nextSyntheticId++;
        /** @type {chrome.windows.Window} */
        const win = {
            id,
            focused: options.focused !== false,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                {
                    id: tabId,
                    index: 0,
                    windowId: id,
                    title: String(url),
                    url: String(url),
                    active: true,
                    pinned: false,
                    favIconUrl:
                        "https://www.google.com/s2/favicons?domain=example.com&sz=32",
                },
            ],
        };
        if (win.focused) {
            for (const w of windowsState) w.focused = false;
        }
        windowsState.push(win);
        return structuredClone(win);
    },
};
