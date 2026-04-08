/**
 * @param {{
 *   onNavigationMode?: (message: { type: string, isInNavigationMode?: boolean }) => void;
 *   onTabSwitchingMode?: (message: unknown) => void;
 *   onTabsDataChanged?: () => void;
 *   onTabUpdated?: (message: { tabId?: number }) => void;
 *   onTabActivated?: () => void;
 * }} handlers
 * @returns {() => void} unsubscribe
 */
export function subscribeChromeAppMessages(handlers) {
    /** @param {unknown} message */
    const listener = (message) => {
        if (!message || typeof message !== "object") return;
        const m = /** @type {{ type?: string }} */ (message);
        if (m.type === "NAVIGATION_MODE") {
            handlers.onNavigationMode?.(
                /** @type {{ type: string, isInNavigationMode?: boolean }} */ (
                    message
                ),
            );
        } else if (m.type === "TAB_SWITCHING_MODE") {
            handlers.onTabSwitchingMode?.(message);
        } else if (m.type === "TABS_DATA_CHANGED") {
            handlers.onTabsDataChanged?.();
        } else if (m.type === "TAB_UPDATED") {
            handlers.onTabUpdated?.(
                /** @type {{ tabId?: number }} */ (message),
            );
        } else if (m.type === "TAB_ACTIVATED") {
            handlers.onTabActivated?.();
        }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
}
