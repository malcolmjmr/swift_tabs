/**
 * Apps registry (domain storage `apps` collection) + home layout blob.
 * Used from the extension service worker (background).
 */

import { getDomainStorage } from "../domainStorage/storageService.js";
import {
    APP_HOME_LAYOUT_KEY,
    APPS_SEED_FLAG_KEY,
    appIdFromDomain,
    defaultUrlForDomain,
    newFolderId,
    normalizeDomain,
    parseLayout,
    stripLayoutForPersist,
} from "./appsModel.js";
import { enrichAppsStateWithAccess } from "./appsAccess.js";
import { syncAppRoutineAlarms } from "./appsRoutines.js";

/**
 * Registered apps whose domains appear in Chrome history, ordered by most recent visit.
 *
 * @param {number} limit
 * @returns {Promise<import('./appsModel.js').AppRecord[]>}
 */
export async function appsRecentFromBrowserHistory(limit = 9) {
    const apps = await appsListAll();
    if (apps.length === 0 || !chrome.history?.search) return [];

    /** @type {Map<string, import('./appsModel.js').AppRecord>} */
    const domainToApp = new Map();
    for (const a of apps) {
        const d = normalizeDomain(a.domain);
        if (d) domainToApp.set(d, a);
    }
    if (domainToApp.size === 0) return [];

    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const history = await chrome.history.search({
        text: "",
        startTime: threeMonthsAgo,
        maxResults: 8000,
    });

    /** @type {Map<string, number>} */
    const domainLastVisit = new Map();
    for (const h of history) {
        const d = normalizeDomain(extractDomain(h.url));
        if (!d || !domainToApp.has(d)) continue;
        const prev = domainLastVisit.get(d) || 0;
        if (h.lastVisitTime > prev) domainLastVisit.set(d, h.lastVisitTime);
    }

    return [...domainLastVisit.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([d]) => domainToApp.get(d))
        .filter(Boolean);
}

const COLLECTION = "apps";

/**
 * @returns {Promise<import('./appsModel.js').AppHomeLayout>}
 */
export async function appsGetLayout() {
    const data = await chrome.storage.local.get(APP_HOME_LAYOUT_KEY);
    const raw = data[APP_HOME_LAYOUT_KEY];
    return parseLayout(raw);
}

/**
 * Remove folders whose items array is empty after pruning children.
 *
 * @param {import('./appsModel.js').LayoutItem[]} items
 * @returns {import('./appsModel.js').LayoutItem[]}
 */
export function pruneEmptyFolders(items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const it of items) {
        if (it.kind === "folder") {
            const inner = pruneEmptyFolders(it.items || []);
            if (inner.length === 0) continue;
            out.push({ ...it, items: inner });
        } else {
            out.push(it);
        }
    }
    return out;
}

/**
 * @param {import('./appsModel.js').AppHomeLayout} layout
 */
export async function appsPutLayout(layout) {
    const cleaned = stripLayoutForPersist(layout);
    const items = pruneEmptyFolders(cleaned.items || []);
    await chrome.storage.local.set({
        [APP_HOME_LAYOUT_KEY]: { ...cleaned, items },
    });
    await appsRecomputeAccessBlockList();
    void syncAppRoutineAlarms();
}

/**
 * @returns {Promise<import('./appsModel.js').AppRecord[]>}
 */
export async function appsListAll() {
    const storage = getDomainStorage();
    const ids = await storage.listIds(COLLECTION, null);
    if (ids.length === 0) return [];
    const rows = await storage.getMany(COLLECTION, ids);
    return /** @type {import('./appsModel.js').AppRecord[]} */ (
        rows.filter(Boolean)
    );
}

/**
 * @param {string} id
 * @returns {Promise<import('./appsModel.js').AppRecord | null>}
 */
export async function appsGet(id) {
    const storage = getDomainStorage();
    const r = await storage.get(COLLECTION, id);
    return r ? /** @type {import('./appsModel.js').AppRecord} */ (r) : null;
}

/**
 * Merge partial into existing record (or create).
 * @param {Partial<import('./appsModel.js').AppRecord> & { id: string }} patch
 */
export async function appsPutApp(patch) {
    const storage = getDomainStorage();
    const prev = (await storage.get(COLLECTION, patch.id)) || {};
    const next = { ...prev, ...patch, id: patch.id };
    await storage.put(COLLECTION, /** @type {{ id: string }} */ (next));
    await appsRecomputeAccessBlockList();
    void syncAppRoutineAlarms();
}

/**
 * Refresh tab-blocking host list after app/layout changes (also run from appsGetState).
 */
export async function appsRecomputeAccessBlockList() {
    const [apps, layout] = await Promise.all([appsListAll(), appsGetLayout()]);
    await enrichAppsStateWithAccess(apps, layout);
}

/**
 * @param {import('./appsModel.js').LayoutItem[]} items
 * @param {string} appId
 * @returns {import('./appsModel.js').LayoutItem[]}
 */
function pruneAppFromItems(items, appId) {
    const out = [];
    for (const it of items) {
        if (it.kind === "app") {
            if (it.appId !== appId) out.push(it);
        } else if (it.kind === "folder") {
            const inner = pruneAppFromItems(it.items || [], appId);
            if (inner.length > 0) {
                out.push({ ...it, items: inner });
            }
        }
    }
    return out;
}

/**
 * @param {string} appId
 */
export async function appsDeleteApp(appId) {
    const storage = getDomainStorage();
    await storage.delete(COLLECTION, appId);
    const layout = await appsGetLayout();
    layout.items = pruneAppFromItems(layout.items, appId);
    await appsPutLayout(layout);
}

/** Remove app from home layout only (keep registry record). */
export async function appsRemoveFromHome(appId) {
    const layout = await appsGetLayout();
    layout.items = pruneAppFromItems(layout.items, appId);
    await appsPutLayout(layout);
}

/**
 * @returns {Promise<{ domain: string, url: string, title: string, visitCount: number, lastVisitTime: number }[]>}
 */
async function computeFavoriteDomainsFromHistory() {
    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const history = await chrome.history.search({
        text: "",
        startTime: threeMonthsAgo,
        maxResults: 10000,
    });

    /** @type {Map<string, { domain: string, urls: Set<string>, visitDates: Set<string>, lastVisitTime: number, title: string }>} */
    const domainStats = new Map();

    for (const item of history) {
        const domain = extractDomain(item.url);
        if (!domain || domain === "newtab") continue;
        const visitDate = new Date(item.lastVisitTime).toDateString();

        if (!domainStats.has(domain)) {
            domainStats.set(domain, {
                domain,
                urls: new Set(),
                visitDates: new Set(),
                lastVisitTime: item.lastVisitTime,
                title: item.title || domain,
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

    return Array.from(domainStats.values())
        .filter((d) => d.visitDates.size >= 3)
        .map((d) => ({
            domain: d.domain,
            url: `https://${d.domain}`,
            title: d.title,
            visitCount: d.visitDates.size,
            lastVisitTime: d.lastVisitTime,
        }))
        .sort(
            (a, b) =>
                b.visitCount - a.visitCount ||
                b.lastVisitTime - a.lastVisitTime,
        )
        .slice(0, 20);
}

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
}

/**
 * One-time seed: create registry + linear home from history favorites when empty.
 */
export async function appsSeedFromFavoritesIfEmpty() {
    const data = await chrome.storage.local.get(APPS_SEED_FLAG_KEY);
    if (data[APPS_SEED_FLAG_KEY]) {
        return { seeded: false };
    }

    const existing = await appsListAll();
    const layout = await appsGetLayout();
    if (existing.length > 0 || layout.items.length > 0) {
        await chrome.storage.local.set({ [APPS_SEED_FLAG_KEY]: true });
        return { seeded: false };
    }

    const favorites = await computeFavoriteDomainsFromHistory();
    if (favorites.length === 0) {
        await chrome.storage.local.set({ [APPS_SEED_FLAG_KEY]: true });
        return { seeded: false, reason: "no_favorites" };
    }

    const storage = getDomainStorage();
    /** @type {object[]} */
    const records = [];
    /** @type {import('./appsModel.js').LayoutItem[]} */
    const items = [];

    for (const fav of favorites) {
        const domain = normalizeDomain(fav.domain);
        const id = appIdFromDomain(domain);
        records.push({
            id,
            domain,
            defaultUrl: defaultUrlForDomain(domain),
            title: fav.title || domain,
            savedLinks: [],
        });
        items.push({ kind: "app", appId: id });
    }

    await storage.putMany(COLLECTION, records);
    await appsPutLayout({ version: 1, items });
    await chrome.storage.local.set({ [APPS_SEED_FLAG_KEY]: true });
    return { seeded: true, count: records.length };
}

/**
 * @param {string} appId
 * @returns {Promise<boolean>}
 */
export async function appsAddAppToHomeEnd(appId) {
    const layout = await appsGetLayout();
    const exists = layoutRefersToApp(layout.items, appId);
    if (exists) return false;
    layout.items = [...layout.items, { kind: "app", appId }];
    await appsPutLayout(layout);
    return true;
}

/**
 * @param {import('./appsModel.js').LayoutItem[]} items
 * @param {string} appId
 */
function layoutRefersToApp(items, appId) {
    for (const it of items) {
        if (it.kind === "app" && it.appId === appId) return true;
        if (it.kind === "folder" && layoutRefersToApp(it.items || [], appId)) {
            return true;
        }
    }
    return false;
}

/**
 * @param {string} appId
 * @param {string} intoFolderId
 */
export async function appsMoveAppIntoFolder(appId, intoFolderId) {
    const layout = await appsGetLayout();
    const removed = removeAppRef(layout.items, appId);
    const inserted = insertAppIntoFolder(removed, intoFolderId, appId);
    await appsPutLayout({ ...layout, items: inserted });
}

/**
 * Remove app from anywhere in the layout, then append it to the home root.
 *
 * @param {string} appId
 */
export async function appsMoveAppToHomeRoot(appId) {
    const layout = await appsGetLayout();
    const items = removeAppRef(layout.items, appId);
    await appsPutLayout({
        ...layout,
        items: [...items, { kind: "app", appId }],
    });
}

/**
 * @param {import('./appsModel.js').LayoutItem[]} items
 * @param {string} appId
 */
function removeAppRef(items, appId) {
    const out = [];
    for (const it of items) {
        if (it.kind === "app") {
            if (it.appId !== appId) out.push(it);
        } else if (it.kind === "folder") {
            out.push({
                ...it,
                items: removeAppRef(it.items || [], appId),
            });
        }
    }
    return out;
}

/**
 * @param {import('./appsModel.js').LayoutItem[]} items
 * @param {string} folderId
 * @param {string} appId
 */
function insertAppIntoFolder(items, folderId, appId) {
    return items.map((it) => {
        if (it.kind === "folder" && it.id === folderId) {
            return {
                ...it,
                items: [...(it.items || []), { kind: "app", appId }],
            };
        }
        if (it.kind === "folder") {
            return {
                ...it,
                items: insertAppIntoFolder(it.items || [], folderId, appId),
            };
        }
        return it;
    });
}

/**
 * Create a folder containing two app ids (merge). Removes both app refs from top-level/items then adds folder.
 * @param {string} appIdA
 * @param {string} appIdB
 * @param {string} [title]
 */
export async function appsMergeIntoFolder(appIdA, appIdB, title = "Folder") {
    let layout = await appsGetLayout();
    let items = removeAppRef(layout.items, appIdA);
    items = removeAppRef(items, appIdB);
    const folder = {
        kind: "folder",
        id: newFolderId(),
        title,
        items: [
            { kind: "app", appId: appIdA },
            { kind: "app", appId: appIdB },
        ],
    };
    items.push(folder);
    await appsPutLayout({ ...layout, items });
    return folder;
}

/**
 * @returns {Promise<{ apps: import('./appsModel.js').AppRecord[], layout: import('./appsModel.js').AppHomeLayout, seedMeta?: object }>}
 */
export async function appsGetState() {
    await appsSeedFromFavoritesIfEmpty();
    const [apps, layout, recentHistoryPreview] = await Promise.all([
        appsListAll(),
        appsGetLayout(),
        appsRecentFromBrowserHistory(9),
    ]);
    const { apps: enrichedApps, layout: enrichedLayout } =
        await enrichAppsStateWithAccess(apps, layout);
    return {
        apps: enrichedApps,
        layout: enrichedLayout,
        recentHistoryPreview,
    };
}
