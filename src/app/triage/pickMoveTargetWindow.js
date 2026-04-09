/**
 * Pick destination window for triage "move tab" using most recently accessed other tab.
 * @param {chrome.windows.Window[]} windows
 * @param {number} tabId tab being moved
 * @param {number} recentWindowMs e.g. 30000 — use that tab's window if lastAccess within this window
 * @returns {{ windowId: number } | { createNew: true }}
 */
export function pickMoveTargetWindow(windows, tabId, recentWindowMs = 30000) {
    /** @type {chrome.tabs.Tab | null} */
    let moving = null;
    for (const w of windows || []) {
        const t = w.tabs?.find((x) => x.id === tabId);
        if (t) {
            moving = t;
            break;
        }
    }
    if (!moving?.id) return { createNew: true };

    const incog = !!moving.incognito;
    let bestTab = /** @type {chrome.tabs.Tab | null} */ (null);
    let bestTime = -1;

    for (const w of windows || []) {
        if (!!w.incognito !== incog) continue;
        for (const t of w.tabs || []) {
            if (t.id === tabId) continue;
            const time = t.lastAccessed ?? t.lastAccessedTime ?? 0;
            if (time > bestTime) {
                bestTime = time;
                bestTab = t;
            }
        }
    }

    if (
        bestTab &&
        bestTime > 0 &&
        Date.now() - bestTime < recentWindowMs
    ) {
        const wid = bestTab.windowId;
        if (wid != null) return { windowId: wid };
    }

    return { createNew: true };
}
