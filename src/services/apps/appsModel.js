/**
 * Swift Tabs — persisted Apps registry + home layout (see docs).
 * @see docs/features/feature_apps_home.md
 */

/** @typedef {{ id: string, url: string, title?: string, savedAt: number }} SavedLink */
/** @typedef {{ text?: string, raw?: string, fetchedAt: number }} SuggestionsCache */

/**
 * One blocked time window (local or policy timezone). Minutes 0–1439 from midnight.
 * If end < start, the window spans midnight.
 *
 * @typedef {{ daysOfWeek: number[], startMinutes: number, endMinutes: number }} AccessBlockedWindow
 */

/**
 * @typedef {Object} AccessFrequencyRule
 * @property {number} windowHours — e.g. 24 or 168
 * @property {number} maxVisits — restrict when visit count exceeds this (>)
 * @property {'chrome_history'} [source]
 */

/**
 * @typedef {Object} AccessPolicy
 * @property {boolean} [enabled] — must be true for policy to apply
 * @property {boolean} [hideFromHomeWhenRestricted] — default true
 * @property {boolean} [blockNavigationWhenRestricted] — default true
 * @property {string} [timezone] — `"local"` (default) or IANA e.g. `America/New_York`
 * @property {AccessBlockedWindow[]} [blockedWindows] — if now falls in any window, schedule restricts
 * @property {AccessFrequencyRule} [frequency] — restrict when visits in window exceed maxVisits
 */

/**
 * @typedef {{ kind: 'interval', periodMinutes: number } | { kind: 'daily', hour: number, minute: number }} FetchRoutineSchedule
 */

/**
 * @typedef {Object} FetchRoutineLastOutput
 * @property {string} [text]
 * @property {{ title?: string, url: string }[]} [links]
 */

/**
 * @typedef {Object} FetchRoutine
 * @property {string} id
 * @property {boolean} [enabled]
 * @property {string} [label]
 * @property {string} instructions
 * @property {FetchRoutineSchedule} schedule
 * @property {'text'|'links'} [outputFormat]
 * @property {number} [lastRunAt]
 * @property {string} [lastError]
 * @property {FetchRoutineLastOutput} [lastOutput]
 */

/**
 * Derived at runtime (not persisted on AppRecord).
 *
 * @typedef {Object} AppAccessSnapshot
 * @property {boolean} restricted
 * @property {boolean} hideFromHome
 * @property {boolean} blockNavigation
 * @property {string[]} reasons
 */

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
 * @property {AccessPolicy} [accessPolicy]
 * @property {FetchRoutine[]} [fetchRoutines]
 * @property {AppAccessSnapshot} [access] — set by appsGetState only
 */

/** @typedef {{ kind: 'app', appId: string }} LayoutAppRef */
/**
 * @typedef {Object} LayoutFolder
 * @property {'folder'} kind
 * @property {string} id
 * @property {string} title
 * @property {LayoutItem[]} items
 * @property {AccessPolicy} [accessPolicy]
 * @property {FetchRoutine[]} [fetchRoutines]
 * @property {AppAccessSnapshot} [access] — derived on layout clone from appsGetState only
 */
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

/**
 * @returns {string}
 */
export function newRoutineId() {
    return `rtn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Remove UI-only `access` from folder nodes before persisting layout.
 *
 * @param {LayoutItem[]} items
 * @returns {LayoutItem[]}
 */
export function stripAccessFromLayoutItems(items) {
    return (items || []).map((it) => {
        if (it.kind === "folder") {
            const { access: _a, ...rest } = /** @type {LayoutFolder & { access?: unknown }} */ (it);
            return {
                ...rest,
                items: stripAccessFromLayoutItems(it.items || []),
            };
        }
        return it;
    });
}

/**
 * @param {AppHomeLayout} layout
 * @returns {AppHomeLayout}
 */
export function stripLayoutForPersist(layout) {
    return {
        version: layout.version,
        items: stripAccessFromLayoutItems(layout.items || []),
    };
}