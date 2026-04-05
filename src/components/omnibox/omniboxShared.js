/**
 * @param {string} url
 */
export function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

/**
 * @param {string} str
 */
export function isUrlLike(str) {
    const trimmed = str.trim();
    if (!trimmed) return false;
    if (/^https?:\/\//i.test(trimmed)) return true;
    if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return true;
    if (trimmed.includes(".") && !trimmed.includes(" ")) return true;
    return false;
}

/**
 * @param {object} item
 */
export function getResultIcon(item) {
    if (item.icon) return item.icon;

    const icons = {
        suggestion: "lightbulb",
        app: "apps",
        stApp: "apps",
        stLibApp: "apps",
        stFolder: "folder",
        stAllApps: "library_books",
        tab: "tab",
        bookmark: "bookmark",
        history: "history",
        news: "newspaper",
        trending: "trending_up",
        hypothesisPage: "highlight",
    };
    return icons[item.type] || "link";
}

/**
 * @param {object} item
 */
export function getResultSubtitle(item) {
    if (item.subtitle) return item.subtitle;
    if (item.type === "app")
        return `${item.visitCount} visits · ${item.domain}`;
    return item.url || "";
}

/**
 * @param {object} item
 */
export function resultFaviconKey(item) {
    if (item.type === "stApp" || item.type === "stLibApp") {
        return `${item.type}:${item.app?.id ?? ""}`;
    }
    return `${item.type}:${item.id ?? item.url ?? ""}`;
}

/**
 * @param {object} item
 * @param {Record<string, boolean>} faviconFailedByKey
 */
export function getResultFaviconSrc(item, faviconFailedByKey) {
    if (item.type === "stApp" || item.type === "stLibApp") {
        if (faviconFailedByKey[resultFaviconKey(item)]) return null;
        const domain = item.app?.domain || "";
        return domain
            ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
            : null;
    }
    if (item.type !== "tab" && item.type !== "history") return null;
    if (faviconFailedByKey[resultFaviconKey(item)]) return null;
    const domain = extractDomain(item.url || "");
    const google =
        domain &&
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    if (item.type === "tab") {
        if (item.favIconUrl) return item.favIconUrl;
        return google || null;
    }
    return google || null;
}

/**
 * @param {object | null | undefined} item
 */
export function isSwiftAppsRow(item) {
    const t = item?.type;
    return (
        t === "stApp" ||
        t === "stFolder" ||
        t === "stAllApps" ||
        t === "stLibApp"
    );
}
