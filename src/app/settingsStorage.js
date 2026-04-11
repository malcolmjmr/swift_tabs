export const SETTINGS_DEFAULTS = {
    toolbarInPopup: false,
    openToolbarWithMetaKey: false,
    queueLinkWithMetaKey: false,
    copyImageWithMetaKey: false,
    defaultView: "windows",
    longPressDelayMs: 500,
    scrollVerticalThreshold: 33,
    scrollHorizontalThreshold: 50,
};

/**
 * @param {unknown} raw
 * @returns {typeof SETTINGS_DEFAULTS}
 */
export function mergeStoredSettings(raw) {
    return {
        ...SETTINGS_DEFAULTS,
        ...(raw && typeof raw === "object" ? raw : {}),
    };
}

/** @param {typeof SETTINGS_DEFAULTS} settings */
export function persistSettings(settings) {
    chrome.storage.local.set({ settings });
}
