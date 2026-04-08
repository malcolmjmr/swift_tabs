/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export async function tryTabSwitchingArrows(event, ctx) {
    const {
        systemMenuIsOpen,
        settingsPageIsOpen,
        enterTabSwitchingMode,
        tabStore,
        getCurrentWindowTabs,
        getWindowsList,
        getActiveTabId,
        getActiveWindowId,
        chromeService,
        resetTabSwitchingDismissTimeout,
    } = ctx;

    if (
        systemMenuIsOpen ||
        settingsPageIsOpen ||
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key,
        )
    ) {
        return false;
    }

    event.preventDefault();
    event.stopPropagation();
    enterTabSwitchingMode();
    await tabStore.init();
    const tabs = [...getCurrentWindowTabs()].sort(
        (a, b) => a.index - b.index,
    );
    const windowsList = [...getWindowsList()]
        .filter((w) => w.tabs.length > 0)
        .sort((a, b) => a.id - b.id);
    const activeId = getActiveTabId();
    const activeWinId = getActiveWindowId();

    if (event.key === "ArrowUp" && tabs.length > 0) {
        const currentIndex = tabs.findIndex((t) => t.id === activeId);
        const idx = currentIndex >= 0 ? currentIndex : 0;
        const prevIndex = (idx - 1 + tabs.length) % tabs.length;
        await chromeService.activateTab(tabs[prevIndex].id);
        await tabStore.refreshState();
        chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
    } else if (event.key === "ArrowDown" && tabs.length > 0) {
        const currentIndex = tabs.findIndex((t) => t.id === activeId);
        const idx = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (idx + 1) % tabs.length;
        await chromeService.activateTab(tabs[nextIndex].id);
        await tabStore.refreshState();
        chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
    } else if (event.key === "ArrowLeft" && windowsList.length > 0) {
        const currentIndex = windowsList.findIndex(
            (w) => w.id === activeWinId,
        );
        const idx = currentIndex >= 0 ? currentIndex : 0;
        const prevIndex =
            (idx - 1 + windowsList.length) % windowsList.length;
        await chromeService.focusWindow(windowsList[prevIndex].id);
        await tabStore.refreshState();
        chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
    } else if (event.key === "ArrowRight" && windowsList.length > 0) {
        const currentIndex = windowsList.findIndex(
            (w) => w.id === activeWinId,
        );
        const idx = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (idx + 1) % windowsList.length;
        await chromeService.focusWindow(windowsList[nextIndex].id);
        await tabStore.refreshState();
        chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
    }
    resetTabSwitchingDismissTimeout();
    return true;
}
