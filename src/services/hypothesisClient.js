/**
 * Hypothesis (hypothes.is) API — user highlights for Omnibox.
 * @see https://h.readthedocs.io/en/latest/api/
 */

const API_BASE = "https://api.hypothes.is/api";

/**
 * @returns {Promise<string>}
 */
export function getHypothesisApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["settings"], (data) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            const key = data.settings?.apiKeys?.hypothesisApiKey?.trim();
            if (!key) {
                reject(new Error("missing_api_key"));
                return;
            }
            resolve(key);
        });
    });
}

/**
 * @param {unknown} ann
 * @returns {boolean}
 */
function isTextHighlight(ann) {
    const targets = ann?.target;
    if (!Array.isArray(targets) || targets.length === 0) return false;
    const selectors = targets[0]?.selector;
    if (!Array.isArray(selectors)) return false;
    return selectors.some((s) => s?.type === "TextQuoteSelector");
}

/**
 * @param {string} uri
 * @returns {boolean}
 */
function isHttpUri(uri) {
    if (!uri || typeof uri !== "string") return false;
    try {
        const u = new URL(uri);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * @param {string} token
 * @returns {Promise<string>} userid e.g. acct:user@hypothes.is
 */
async function fetchUserId(token) {
    const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
        throw new Error(
            "Hypothesis rejected this token. Check Hypothes.is in extension options.",
        );
    }
    if (!res.ok) {
        throw new Error(`Hypothesis profile failed (${res.status}).`);
    }
    const data = await res.json();
    const userid = data?.userid;
    if (!userid || typeof userid !== "string") {
        throw new Error("Hypothesis profile response missing userid.");
    }
    return userid;
}

/**
 * @param {unknown} ann
 * @returns {string}
 */
function firstQuoteExact(ann) {
    const targets = ann?.target;
    if (!Array.isArray(targets) || targets.length === 0) return "";
    const selectors = targets[0]?.selector;
    if (!Array.isArray(selectors)) return "";
    const quote = selectors.find((s) => s?.type === "TextQuoteSelector");
    const exact = quote?.exact;
    return typeof exact === "string" ? exact.trim() : "";
}

/**
 * @param {unknown} ann
 * @returns {string}
 */
function annotationTitle(ann) {
    const titles = ann?.document?.title;
    if (Array.isArray(titles) && titles.length > 0 && titles[0]) {
        return String(titles[0]);
    }
    try {
        return new URL(ann.uri).hostname;
    } catch {
        return ann.uri || "(Untitled)";
    }
}

/**
 * @param {unknown} ann
 * @returns {string}
 */
function updatedIso(ann) {
    const u = ann?.updated || ann?.created;
    return typeof u === "string" ? u : "";
}

/**
 * Fetches up to 200 recent user annotations from Hypothesis, keeps text highlights
 * on http(s) pages, groups by URI, sorts pages by latest highlight activity.
 *
 * @returns {Promise<Array<{ uri: string, title: string, count: number, previewSnippet: string }>>}
 */
export async function fetchHypothesisHighlightPages() {
    const token = await getHypothesisApiKey();
    const userid = await fetchUserId(token);

    const params = new URLSearchParams({
        user: userid,
        limit: "200",
        sort: "updated",
        order: "desc",
    });

    const res = await fetch(`${API_BASE}/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error(
            "Hypothesis rejected this token. Check Hypothes.is in extension options.",
        );
    }
    if (!res.ok) {
        throw new Error(`Hypothesis search failed (${res.status}).`);
    }

    const data = await res.json();
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    const highlightRows = rows.filter(
        (ann) => isTextHighlight(ann) && isHttpUri(ann.uri),
    );

    /** @type {Map<string, { uri: string, title: string, count: number, previewSnippet: string, lastUpdated: string }>} */
    const byUri = new Map();

    for (const ann of highlightRows) {
        const uri = ann.uri;
        const quote = firstQuoteExact(ann);
        const upd = updatedIso(ann);
        const existing = byUri.get(uri);
        if (!existing) {
            byUri.set(uri, {
                uri,
                title: annotationTitle(ann),
                count: 1,
                previewSnippet: quote,
                lastUpdated: upd,
            });
        } else {
            existing.count += 1;
            if (!existing.previewSnippet && quote) {
                existing.previewSnippet = quote;
            }
            if (upd > existing.lastUpdated) {
                existing.lastUpdated = upd;
                existing.title = annotationTitle(ann);
            }
        }
    }

    const pages = [...byUri.values()].sort((a, b) =>
        b.lastUpdated.localeCompare(a.lastUpdated),
    );

    return pages.map(({ uri, title, count, previewSnippet }) => ({
        uri,
        title,
        count,
        previewSnippet,
    }));
}
