/**
 * Swift Tabs — persisted Apps registry + home layout (see docs).
 * @see docs/features/feature_apps_home.md
 */

/** @typedef {{ id: string, url: string, title?: string, savedAt: number }} SavedLink */
/** @typedef {{ text?: string, raw?: string, fetchedAt: number }} SuggestionsCache */

/**
 * @typedef {Object} AppRecord
 * @property {string} id
 * @property {string} domain
 * @property {string} defaultUrl
 * @property {string} title
 * @property {string} [displayTitle]
 * @property {SavedLink[]} [savedLinks]
 * @property {SuggestionsCache} [suggestionsCache]
 * @property {number} [lastOpenedAt]
 */

/** @typedef {{ kind: 'app', appId: string }} LayoutAppRef */
/** @typedef {{ kind: 'folder', id: string, title: string, items: LayoutItem[] }} LayoutFolder */
/** @typedef {LayoutAppRef | LayoutFolder} LayoutItem */

/**
 * @typedef {Object} AppHomeLayout
 * @property {number} version
 * @property {LayoutItem[]} items
 */

import { STORAGE_PREFIX } from "../domainStorage/constants.js";

export const APP_HOME_LAYOUT_KEY = `${STORAGE_PREFIX}:app_home_layout`;
export const APPS_SEED_FLAG_KEY = `${STORAGE_PREFIX}:apps_seeded_v1`;

export const APP_HOME_LAYOUT_VERSION = 1;

/** @returns {AppHomeLayout} */
export function emptyLayout() {
    return { version: APP_HOME_LAYOUT_VERSION, items: [] };
}

/**
 * @param {string} domain
 * @returns {string}
 */
export function normalizeDomain(domain) {
    if (!domain || typeof domain !== "string") return "";
    let d = domain.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").split("/")[0] || "";
    d = d.replace(/^www\./, "");
    return d;
}

/**
 * @param {string} domain
 * @returns {string}
 */
export function appIdFromDomain(domain) {
    const d = normalizeDomain(domain);
    if (!d) return "app_unknown";
    let h = 0;
    for (let i = 0; i < d.length; i++) {
        h = Math.imul(31, h) + d.charCodeAt(i) | 0;
    }
    return `app_${(h >>> 0).toString(16)}`;
}

/**
 * @param {string} domain
 * @returns {string}
 */
export function defaultUrlForDomain(domain) {
    const d = normalizeDomain(domain);
    if (!d) return "https://example.com";
    return `https://${d}`;
}

/**
 * @param {unknown} raw
 * @returns {AppHomeLayout}
 */
export function parseLayout(raw) {
    if (!raw || typeof raw !== "object") return emptyLayout();
    const o = /** @type {Record<string, unknown>} */ (raw);
    if (o.version !== APP_HOME_LAYOUT_VERSION) return emptyLayout();
    const items = o.items;
    if (!Array.isArray(items)) return emptyLayout();
    return { version: APP_HOME_LAYOUT_VERSION, items: /** @type {LayoutItem[]} */ (items) };
}

/**
 * @returns {string}
 */
export function newFolderId() {
    return `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
