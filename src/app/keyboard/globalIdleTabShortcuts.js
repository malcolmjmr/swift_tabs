import { isInTypingContext, noModifiersStrict } from "../domUtils.js";

/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export async function tryGlobalIdleTabShortcuts(event, ctx) {
    if (isInTypingContext()) return false;
    const {
        isIdleForGlobalTabActions,
        getCurrentTab,
        chromeService,
        tabStore,
        fetchTabInfo,
        getShowActiveTabInfo,
        hideActiveTabInfo,
        showActiveTabInfoForCurrentTab,
    } = ctx;

    if (
        !isIdleForGlobalTabActions() ||
        !noModifiersStrict(event) ||
        !(
            event.key === "Delete" ||
            event.key === "Backspace" ||
            event.key === "Enter" ||
            event.key === "c" ||
            event.key === "C" ||
            event.key === "r" ||
            event.key === "R" ||
            event.key === "i" ||
            event.key === "I" ||
            event.key === "d" ||
            event.key === "D"
        )
    ) {
        return false;
    }

    const tab = getCurrentTab() ?? (await chromeService.getCurrentTab());
    if (!tab) {
        return false;
    }
    if (
        (event.key === "Delete" || event.key === "Backspace") &&
        window.getSelection().toString().length === 0 &&
        !event.repeat
    ) {
        event.preventDefault();
        event.stopPropagation();
        await tabStore.closeTab(tab.id);
        await fetchTabInfo();
        return true;
    }
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        await chromeService.createWindowWithTab(tab.id);
        await tabStore.refreshState();
        await fetchTabInfo();
        return true;
    }
    if (
        (event.key === "c" || event.key === "C") &&
        window.getSelection().toString().length === 0
    ) {
        event.preventDefault();
        event.stopPropagation();
        const url = await chromeService.copyTabUrl(tab.id);
        if (url) await navigator.clipboard.writeText(url);
        return true;
    }
    if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        event.stopPropagation();
        await chromeService.reloadTab(tab.id);
        return true;
    }
    if (event.key === "i" || event.key === "I") {
        event.preventDefault();
        event.stopPropagation();
        if (getShowActiveTabInfo()) {
            hideActiveTabInfo();
        } else {
            showActiveTabInfoForCurrentTab();
        }
        return true;
    }
    if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        event.stopPropagation();
        await chromeService.duplicateTab(tab.id);
        await tabStore.refreshState();
        return true;
    }
    return false;
}
