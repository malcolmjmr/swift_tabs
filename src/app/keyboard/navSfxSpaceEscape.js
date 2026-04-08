import { noModifiersStrict } from "../domUtils.js";
import { tabToSelectAfterClose } from "../navWindowModel.js";

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
        setSpaceLongPressTimer,
        longPressThreshold,
        openOmniboxFromShortcut,
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
    } = ctx;

    if (
        isInNavigationMode &&
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
            const selectedTabIndex = selectedTab.index;
            await tabStore.closeTab(selectedTab.id);
            await tabStore.refreshState();
            const windowsList = [...getWindowsList()]
                .filter((w) => w.tabs.length > 0)
                .sort((a, b) => a.id - b.id);
            const chromeWindow = windowsList.find(
                (w) => w.id === selectedTab.windowId,
            );
            const tabs = chromeWindow?.tabs?.length
                ? [...chromeWindow.tabs].sort((a, b) => a.index - b.index)
                : [];
            setSelectedTab(
                tabToSelectAfterClose(tabs, selectedTabIndex) ?? selectedTab,
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
        if (
            isInNavigationMode &&
            noModifiersStrict(event) &&
            (getTabsViewRef()?.getNavSlideKind?.() ?? navEdgeSlideKind()) ===
                "create"
        ) {
            return true;
        }
        setSpaceLongPressTimer(
            setTimeout(() => {
                ctx.setSpaceLongPressTimer(null);
                if (
                    ctx.getHelpMenuIsOpen() ||
                    ctx.getTabMenuIsOpen() ||
                    ctx.getOmniboxIsOpen() ||
                    ctx.getSystemMenuIsOpen() ||
                    ctx.getSettingsPageIsOpen()
                ) {
                    return;
                }
                setSpaceLongPressFired(true);
                openOmniboxFromShortcut();
            }, longPressThreshold),
        );
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
