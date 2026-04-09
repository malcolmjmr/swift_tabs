import { noModifiersStrict } from "../domUtils.js";
import {
    tabToSelectAfterClose,
    targetTabsForNavBatch,
} from "../navWindowModel.js";

/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export async function tryNavSfxSpaceEscape(event, ctx) {
    const {
        isInNavigationMode,
        omniboxIsOpen,
        tabMenuIsOpen,
        helpMenuIsOpen,
        systemMenuIsOpen,
        settingsPageIsOpen,
        navEdgeSlideKind,
        getSelectedTab,
        getWindowsList,
        tabStore,
        clearSpaceLongPressTimer,
        setSpaceArm,
        setSpaceLongPressFired,
        getTabsViewRef,
        setSelectedTab,
        linkEsc,
        setSettingsPageIsOpen,
        setSystemMenuIsOpen,
        setHelpMenuIsOpen,
        isInTabSwitchingMode,
        setIsInTabSwitchingMode,
        tabSwitchingDismissTimeout,
        setTabSwitchingDismissTimeout,
        hideActiveTabInfo,
        getShowActiveTabInfo,
        getIsInTriageMode,
        sendTriageMode,
        getPersistentTabSelection,
        setPersistentTabSelection,
    } = ctx;

    if (
        (isInNavigationMode || getIsInTriageMode?.()) &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        noModifiersStrict(event) &&
        (event.key === "s" ||
            event.key === "S" ||
            event.key === "f" ||
            event.key === "F" ||
            event.key === "x" ||
            event.key === "X") &&
        navEdgeSlideKind() === "window" &&
        getSelectedTab()
    ) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "s" || event.key === "S") {
            // copy URL (commented in original)
        } else if (event.key === "f" || event.key === "F") {
        } else if (event.key === "x" || event.key === "X") {
            const selectedTab = getSelectedTab();
            if (!selectedTab) return true;
            const wid = selectedTab.windowId;
            const windowsList = [...getWindowsList()]
                .filter((w) => w.tabs.length > 0)
                .sort((a, b) => a.id - b.id);
            const chromeWindow = windowsList.find((w) => w.id === wid);
            const tabsSorted = chromeWindow?.tabs?.length
                ? [...chromeWindow.tabs].sort((a, b) => a.index - b.index)
                : [];
            const persistentTabSelection = getPersistentTabSelection?.() ?? new Set();
            const toClose = targetTabsForNavBatch(
                tabsSorted,
                selectedTab,
                persistentTabSelection,
            );
            if (toClose.length === 0) return true;
            const minClosedIndex = Math.min(...toClose.map((t) => t.index));
            const closeIds = new Set(toClose.map((t) => t.id));
            for (const t of [...toClose].sort((a, b) => b.index - a.index)) {
                await tabStore.closeTab(t.id);
            }
            await tabStore.refreshState();
            if (setPersistentTabSelection) {
                const nextSel = new Set(persistentTabSelection);
                for (const id of closeIds) nextSel.delete(id);
                setPersistentTabSelection(nextSel);
            }
            const winAfter = [...getWindowsList()]
                .filter((w) => w.tabs?.length > 0)
                .sort((a, b) => a.id - b.id)
                .find((w) => w.id === wid);
            const tabsAfter = winAfter?.tabs?.length
                ? [...winAfter.tabs].sort((a, b) => a.index - b.index)
                : [];
            setSelectedTab(
                tabToSelectAfterClose(tabsAfter, minClosedIndex) ?? selectedTab,
            );
        }
        return true;
    }

    if (event.key === " ") {
        if (event.repeat) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return true;
        }
        if (
            helpMenuIsOpen ||
            tabMenuIsOpen ||
            omniboxIsOpen ||
            systemMenuIsOpen ||
            settingsPageIsOpen
        ) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return true;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setSpaceArm(true);
        setSpaceLongPressFired(false);
        clearSpaceLongPressTimer();
        return true;
    }

    if (event.key === "Escape") {
        if (linkEsc.isDescriptionOpen()) {
            event.preventDefault();
            linkEsc.closeDescriptionForEscape();
            return true;
        }
        if (linkEsc.isPreviewOpen()) {
            event.preventDefault();
            linkEsc.closePreviewForEscape();
            return true;
        }
        if (linkEsc.isMenuOpen()) {
            event.preventDefault();
            linkEsc.closeMenuForEscape();
            return true;
        }
        if (settingsPageIsOpen) {
            event.preventDefault();
            setSettingsPageIsOpen(false);
            return true;
        }
        if (systemMenuIsOpen) {
            event.preventDefault();
            setSystemMenuIsOpen(false);
            return true;
        }
        if (helpMenuIsOpen) {
            event.preventDefault();
            setHelpMenuIsOpen(false);
            return true;
        }
        if (isInTabSwitchingMode) {
            event.preventDefault();
            if (tabSwitchingDismissTimeout) {
                clearTimeout(tabSwitchingDismissTimeout);
                setTabSwitchingDismissTimeout(null);
            }
            setIsInTabSwitchingMode(false);
            return true;
        }
        if (getShowActiveTabInfo()) {
            event.preventDefault();
            hideActiveTabInfo();
            return true;
        }
        if (getIsInTriageMode?.()) {
            event.preventDefault();
            event.stopPropagation();
            sendTriageMode?.(false);
            return true;
        }
        if (
            isInNavigationMode &&
            !omniboxIsOpen &&
            !tabMenuIsOpen &&
            !helpMenuIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            noModifiersStrict(event) &&
            (getTabsViewRef()?.getNavSlideKind?.() ?? navEdgeSlideKind()) ===
            "history"
        ) {
            if (getTabsViewRef()?.historyGoBack?.()) {
                event.preventDefault();
                event.stopPropagation();
            }
            return true;
        }
    }

    return false;
}
