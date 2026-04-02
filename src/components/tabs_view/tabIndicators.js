/** Tab row/tile indicators for List / Icon / Gallery views. See tab store + Chrome Tab type. */

function lastAccessedTime(tab) {
    return tab?.lastAccessed ?? tab?.lastAccessedTime ?? 0;
}

/**
 * The "last active" tab in a window: among tabs that are **not** the current
 * `active` tab, the one with the highest `lastAccessed`. Excludes the current
 * tab so it is never the same as the window-active indicator.
 * Returns null if every inactive tab has no meaningful timestamp (≤ 0).
 * @param {Array<{ id?: number, active?: boolean, lastAccessed?: number, lastAccessedTime?: number }>} tabs
 * @returns {number | null}
 */
export function lastActiveTabId(tabs) {
    const list = tabs || [];
    const inactive = list.filter((t) => t?.id != null && !t.active);
    if (inactive.length === 0) return null;

    let bestId = null;
    let bestTime = -1;
    for (const t of inactive) {
        const time = lastAccessedTime(t);
        if (time > bestTime) {
            bestTime = time;
            bestId = t.id;
        } else if (time === bestTime && bestId != null && t.id > bestId) {
            bestId = t.id;
        }
    }

    return bestTime > 0 ? bestId : null;
}
