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
        reading: "menu_book",
        download: "download",
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
    if (item.url) return item.domain ? item.domain.replace('www.', '') : extractDomain(item.url);

    if (item.type === "app")
        return `${item.visitCount} visits · ${item.domain}`;
    if (item.type === "reading") {
        const status = item.hasBeenRead ? "Read" : "Unread";
        return item.url ? `${status} · ${item.url}` : status;
    }
    if (item.type === "download") {
        return item.filename || item.url || "";
    }
    if (item.subtitle) return item.subtitle;
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
 * @param {string} domain
 */
export function getUrlFaviconSrc(url) {
    const domain = extractDomain(url);
    return domain
        ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
        : null;
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

/** App hidden from home/folder strip when access policy applies. */
export function appHiddenFromHomeStrip(app) {
    return !!(app?.access?.restricted && app.access?.hideFromHome);
}

/** Folder tile hidden on home when folder access policy applies. */
export function folderHiddenFromHomeStrip(folder) {
    return !!(folder?.access?.restricted && folder.access?.hideFromHome);
}
