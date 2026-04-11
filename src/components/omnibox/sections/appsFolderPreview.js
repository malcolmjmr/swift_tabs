/**
 * Walk folder items in order; collect up to `limit` app records from the registry.
 *
 * @param {object} folder
 * @param {Record<string, object>} registryById
 * @param {number} limit
 * @param {(app: object) => boolean} [includeApp] — if provided, only include when it returns true
 * @returns {object[]}
 */
export function collectFirstAppsFromFolder(
    folder,
    registryById,
    limit,
    includeApp,
) {
    /** @type {object[]} */
    const out = [];
    function walk(items) {
        for (const ch of items || []) {
            if (out.length >= limit) return;
            if (ch.kind === "app") {
                const app = registryById[ch.appId];
                if (app && (!includeApp || includeApp(app))) out.push(app);
            } else if (ch.kind === "folder") {
                walk(ch.items || []);
            }
        }
    }
    walk(folder?.items || []);
    return out;
}
