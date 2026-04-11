/**
 * App / folder access evaluation (schedules, history frequency) for appsGetState and tab blocking.
 */

import { normalizeDomain } from "./appsModel.js";

/** @typedef {import('./appsModel.js').AccessPolicy} AccessPolicy */
/** @typedef {import('./appsModel.js').AppRecord} AppRecord */
/** @typedef {import('./appsModel.js').AppHomeLayout} AppHomeLayout */
/** @typedef {import('./appsModel.js').LayoutItem} LayoutItem */
/** @typedef {import('./appsModel.js').LayoutFolder} LayoutFolder */
/** @typedef {import('./appsModel.js').AppAccessSnapshot} AppAccessSnapshot */

const VISIT_CACHE_TTL_MS = 60_000;
/** @type {Map<string, { count: number, at: number }>} */
const visitCountCache = new Map();

/** @type {{ domain: string }[]} */
let cachedAccessBlockPatterns = [];

/** @param {{ domain: string }[]} patterns */
export function setCachedAccessBlockPatterns(patterns) {
    cachedAccessBlockPatterns = Array.isArray(patterns) ? patterns : [];
}

/** @returns {{ domain: string }[]} */
export function getCachedAccessBlockPatterns() {
    return cachedAccessBlockPatterns;
}

/**
 * @param {string} hostname
 * @param {string} appDomainNorm
 */
export function hostMatchesAppDomain(hostname, appDomainNorm) {
    const h = normalizeDomain(hostname);
    const d = normalizeDomain(appDomainNorm);
    if (!h || !d) return false;
    return h === d || h.endsWith("." + d);
}

/**
 * @param {string} url
 */
function extractHostFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
}

/**
 * @param {string[]} domains
 * @param {number} startTimeMs
 */
function visitCacheKey(domains, startTimeMs) {
    return `${startTimeMs}:${[...new Set(domains.map(normalizeDomain))].filter(Boolean).sort().join("|")}`;
}

/**
 * @param {string[]} domains
 * @param {number} startTimeMs
 * @returns {Promise<number>}
 */
async function countVisitsForDomains(domains, startTimeMs) {
    const norm = [...new Set(domains.map(normalizeDomain))].filter(Boolean);
    if (norm.length === 0 || !chrome.history?.search) return 0;

    const key = visitCacheKey(norm, startTimeMs);
    const now = Date.now();
    const hit = visitCountCache.get(key);
    if (hit && now - hit.at < VISIT_CACHE_TTL_MS) return hit.count;

    const history = await chrome.history.search({
        text: "",
        startTime: startTimeMs,
        maxResults: 15000,
    });

    let count = 0;
    for (const row of history) {
        const host = extractHostFromUrl(row.url || "");
        if (!host) continue;
        for (const d of norm) {
            if (hostMatchesAppDomain(host, d)) {
                count += 1;
                break;
            }
        }
    }

    visitCountCache.set(key, { count, at: now });
    return count;
}

export function clearAppsAccessVisitCache() {
    visitCountCache.clear();
}

/**
 * @param {number} dateMs
 * @param {string} [timezone] — `"local"` or IANA
 * @returns {{ day: number, minutes: number }}
 */
function getDayAndMinutesInZone(dateMs, timezone) {
    if (!timezone || timezone === "local") {
        const d = new Date(dateMs);
        return {
            day: d.getDay(),
            minutes: d.getHours() * 60 + d.getMinutes(),
        };
    }
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short",
    });
    const parts = fmt.formatToParts(new Date(dateMs));
    const hour = parseInt(
        parts.find((p) => p.type === "hour")?.value || "0",
        10,
    );
    const minute = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0",
        10,
    );
    const wd = parts.find((p) => p.type === "weekday")?.value;
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[/** @type {keyof typeof dayMap} */ (wd)] ?? 0;
    return { day, minutes: hour * 60 + minute };
}

/**
 * @param {import('./appsModel.js').AccessBlockedWindow[]} windows
 * @param {number} now
 * @param {string} [timezone]
 */
function isInBlockedWindows(windows, now, timezone) {
    if (!windows?.length) return false;
    const zoneArg =
        !timezone || timezone === "local" ? "local" : timezone;
    const { day, minutes } = getDayAndMinutesInZone(now, zoneArg);

    for (const w of windows) {
        const days = w.daysOfWeek;
        if (Array.isArray(days) && days.length > 0 && !days.includes(day)) {
            continue;
        }
        const start = Number(w.startMinutes) || 0;
        const end =
            w.endMinutes === undefined || w.endMinutes === null
                ? 24 * 60
                : Number(w.endMinutes);
        if (start <= end) {
            if (minutes >= start && minutes < end) return true;
        } else {
            if (minutes >= start || minutes < end) return true;
        }
    }
    return false;
}

/** @param {AccessPolicy | undefined} p */
function policyApplies(p) {
    return !!(p && p.enabled === true);
}

/** @param {AccessPolicy | undefined} p */
function hideWhenRestricted(p) {
    if (!policyApplies(p)) return false;
    return p.hideFromHomeWhenRestricted !== false;
}

/** @param {AccessPolicy | undefined} p */
function blockWhenRestricted(p) {
    if (!policyApplies(p)) return false;
    return p.blockNavigationWhenRestricted !== false;
}

/**
 * @param {AccessPolicy | undefined} policy
 * @param {{ type: 'app', domain: string } | { type: 'folder', domains: string[] }} context
 * @param {number} now
 */
async function evaluatePolicy(policy, context, now) {
    if (!policyApplies(policy)) {
        return {
            restricted: false,
            scheduleRestricted: false,
            frequencyRestricted: false,
        };
    }

    let scheduleRestricted = false;
    if (policy.blockedWindows?.length) {
        const tz = policy.timezone && policy.timezone !== "local"
            ? policy.timezone
            : undefined;
        scheduleRestricted = isInBlockedWindows(
            policy.blockedWindows,
            now,
            tz,
        );
    }

    let frequencyRestricted = false;
    const freq = policy.frequency;
    if (
        freq &&
        freq.windowHours > 0 &&
        typeof freq.maxVisits === "number"
    ) {
        const start = now - freq.windowHours * 60 * 60 * 1000;
        const domains =
            context.type === "app"
                ? [context.domain]
                : context.domains;
        const count = await countVisitsForDomains(domains, start);
        if (count > freq.maxVisits) frequencyRestricted = true;
    }

    const restricted = scheduleRestricted || frequencyRestricted;
    return { restricted, scheduleRestricted, frequencyRestricted };
}

/**
 * @param {LayoutItem[]} items
 * @param {Record<string, AppRecord>} appsById
 * @returns {string[]}
 */
export function collectDescendantDomains(items, appsById) {
    /** @type {string[]} */
    const out = [];
    function walk(arr) {
        for (const it of arr || []) {
            if (it.kind === "app") {
                const a = appsById[it.appId];
                const d = normalizeDomain(a?.domain || "");
                if (d) out.push(d);
            } else if (it.kind === "folder") {
                walk(it.items || []);
            }
        }
    }
    walk(items);
    return [...new Set(out)];
}

/**
 * @param {LayoutItem[]} items
 * @param {string} appId
 * @param {LayoutFolder[]} path
 * @returns {LayoutFolder[] | null}
 */
function findAncestorFoldersForApp(items, appId, path = []) {
    for (const it of items || []) {
        if (it.kind === "app" && it.appId === appId) {
            return path;
        }
        if (it.kind === "folder") {
            const r = findAncestorFoldersForApp(
                it.items || [],
                appId,
                [...path, it],
            );
            if (r) return r;
        }
    }
    return null;
}

/**
 * @param {LayoutItem[]} items
 * @param {LayoutFolder[]} out
 */
function listAllFoldersDeep(items, out) {
    for (const it of items || []) {
        if (it.kind === "folder") {
            out.push(it);
            listAllFoldersDeep(it.items || [], out);
        }
    }
}

/**
 * @param {AccessPolicy | undefined} policy
 * @param {Awaited<ReturnType<typeof evaluatePolicy>>} ev
 */
function flagsFromEvaluation(policy, ev) {
    if (!ev.restricted) {
        return {
            restricted: false,
            hideFromHome: false,
            blockNavigation: false,
        };
    }
    return {
        restricted: true,
        hideFromHome: hideWhenRestricted(policy),
        blockNavigation: blockWhenRestricted(policy),
    };
}

/**
 * @param {AppRecord[]} apps
 * @param {AppHomeLayout} layout
 * @param {number} [now]
 * @returns {Promise<{ apps: AppRecord[], layout: AppHomeLayout, blockedHostsPattern: { domain: string }[] }>}
 */
export async function enrichAppsStateWithAccess(apps, layout, now = Date.now()) {
    const appsById = Object.fromEntries(apps.map((a) => [a.id, a]));

    /** @type {Map<string, AppAccessSnapshot>} */
    const folderSnap = new Map();

    /** @type {LayoutFolder[]} */
    const allFolders = [];
    listAllFoldersDeep(layout.items || [], allFolders);

    for (const folder of allFolders) {
        const domains = collectDescendantDomains(folder.items || [], appsById);
        const ev = await evaluatePolicy(
            folder.accessPolicy,
            { type: "folder", domains },
            now,
        );
        const flags = flagsFromEvaluation(folder.accessPolicy, ev);
        const reasons = [];
        if (ev.restricted) {
            if (ev.scheduleRestricted) reasons.push("schedule");
            if (ev.frequencyRestricted) reasons.push("frequency");
        }
        folderSnap.set(folder.id, {
            ...flags,
            reasons: reasons.length
                ? [`Folder policy (${reasons.join(", ")})`]
                : [],
        });
    }

    /** @type {AppAccessSnapshot} */
    const neutral = {
        restricted: false,
        hideFromHome: false,
        blockNavigation: false,
        reasons: [],
    };

    /** @type {{ domain: string }[]} */
    const blockedHostsPattern = [];

    const enrichedApps = apps.map((app) => {
        const ancestors =
            findAncestorFoldersForApp(layout.items || [], app.id) || [];

        const selfEv = app.accessPolicy
            ? evaluatePolicy(
                  app.accessPolicy,
                  { type: "app", domain: app.domain || "" },
                  now,
              )
            : Promise.resolve({
                  restricted: false,
                  scheduleRestricted: false,
                  frequencyRestricted: false,
              });

        return { app, ancestors, selfEv };
    });

    const resolved = await Promise.all(
        enrichedApps.map(async ({ app, ancestors, selfEv }) => {
            const ev = await selfEv;
            const selfFlags = flagsFromEvaluation(app.accessPolicy, ev);

            /** @type {AppAccessSnapshot} */
            const snap = { ...neutral };
            const reasons = [];

            if (selfFlags.restricted) {
                snap.restricted = true;
                snap.hideFromHome = selfFlags.hideFromHome;
                snap.blockNavigation = selfFlags.blockNavigation;
                if (ev.scheduleRestricted) reasons.push("App: blocked hours");
                if (ev.frequencyRestricted) reasons.push("App: visit limit");
            }

            for (const f of ancestors) {
                const fs = folderSnap.get(f.id);
                if (!fs?.restricted) continue;
                snap.restricted = true;
                if (fs.hideFromHome) snap.hideFromHome = true;
                if (fs.blockNavigation) snap.blockNavigation = true;
                reasons.push(`Folder "${f.title || f.id}"`);
            }

            snap.reasons = reasons;

            if (snap.blockNavigation && snap.restricted) {
                const d = normalizeDomain(app.domain || "");
                if (d) blockedHostsPattern.push({ domain: d });
            }

            return { ...app, access: snap };
        }),
    );

    const layoutForUi = {
        version: layout.version,
        items: cloneLayoutWithFolderAccess(
            layout.items || [],
            folderSnap,
        ),
    };

    setCachedAccessBlockPatterns(blockedHostsPattern);

    return {
        apps: resolved,
        layout: layoutForUi,
        blockedHostsPattern,
    };
}

/**
 * @param {LayoutItem[]} items
 * @param {Map<string, AppAccessSnapshot>} folderSnap
 */
function cloneLayoutWithFolderAccess(items, folderSnap) {
    return (items || []).map((it) => {
        if (it.kind === "folder") {
            const acc = folderSnap.get(it.id);
            return {
                ...it,
                items: cloneLayoutWithFolderAccess(it.items || [], folderSnap),
                ...(acc
                    ? {
                          access: {
                              restricted: acc.restricted,
                              hideFromHome: acc.hideFromHome,
                              blockNavigation: acc.blockNavigation,
                              reasons: acc.reasons,
                          },
                      }
                    : {}),
            };
        }
        return { ...it };
    });
}

/**
 * @param {string} hostname
 * @param {{ domain: string }[]} patterns
 */
export function hostnameMatchesBlockedPatterns(hostname, patterns) {
    const h = normalizeDomain(hostname);
    if (!h) return false;
    for (const p of patterns) {
        if (hostMatchesAppDomain(h, p.domain)) return true;
    }
    return false;
}
