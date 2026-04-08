/** @param {EventTarget | null} target */
export function isHttpLinkFromEventTarget(target) {
    if (!target || typeof target.closest !== "function") return null;
    const link = target.closest("a");
    if (!link?.href) return null;
    const href = link.href;
    if (!href.startsWith("http://") && !href.startsWith("https://"))
        return null;
    return link;
}
