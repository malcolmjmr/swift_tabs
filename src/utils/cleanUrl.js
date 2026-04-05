/**
 * Remove common tracking/query junk from HTTP(S) URLs for "clean copy".
 * @param {string} urlString
 * @returns {string}
 */
export function cleanUrl(urlString) {
    if (!urlString || typeof urlString !== "string") return urlString;
    let u;
    try {
        u = new URL(urlString);
    } catch {
        return urlString;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return urlString;

    const exactStrip = new Set([
        "fbclid",
        "gclid",
        "gclsrc",
        "dclid",
        "msclkid",
        "mc_eid",
        "_ga",
        "_gl",
        "igshid",
        "si",
    ]);

    const params = u.searchParams;
    const toDelete = [];
    for (const key of params.keys()) {
        const lower = key.toLowerCase();
        if (lower.startsWith("utm_") || exactStrip.has(lower)) {
            toDelete.push(key);
        }
    }
    for (const k of toDelete) params.delete(k);

    u.search = params.toString() ? `?${params.toString()}` : "";
    return u.toString();
}
