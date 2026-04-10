import { noModifiersStrict } from "../domUtils.js";
import {
    sortedOpenWindows,
    tabToSelectAfterClose,
    targetTabsForNavBatch,
} from "../navWindowModel.js";

/**
 * Nav-mode delete/shift/enter, history backspace, arrow keys.
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export async function tryNavModeMoreKeys(event, ctx) {
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
        getPersistentTabSelection,
        setPersistentTabSelection,
        setSelectedTab,
        togglePersistentTabSelection,
        handleNavModeEnterToNewWindowBatch,
        getTabsViewRef,
        sortedOpenWindows: sortedOpenWindowsFn,
        getNavSlideIndex,
        setNavSlideIndex,
        getNavViewMode,
        getOverviewFocusedWindowIndex,
        setOverviewFocusedWindowIndex,
        getIsInTriageMode,
    } = ctx;

    const inTriage = getIsInTriageMode?.() === true;
    const inNavOrTriage = isInNavigationMode || inTriage;
    const windowSlideOrTriage =
        navEdgeSlideKind() === "window" || inTriage;

    const wl = () =>
        sortedOpenWindowsFn ? sortedOpenWindowsFn() : sortedOpenWindows(getWindowsList());

    if (
        (event.key === "Delete" || event.key === "Backspace") &&
        inNavOrTriage &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        getSelectedTab() &&
        windowSlideOrTriage
    ) {
        event.preventDefault();
        event.stopPropagation();
        const selectedTab = getSelectedTab();
        if (!selectedTab) return true;
        const closedWindowId = selectedTab.windowId;
        const windowsList = [...getWindowsList()]
            .filter((w) => w.tabs.length > 0)
            .sort((a, b) => a.id - b.id);
        const win = windowsList.find((w) => w.id === closedWindowId);
        if (!win?.tabs?.length) return true;
        const tabsSorted = [...win.tabs].sort((a, b) => a.index - b.index);
        const persistentTabSelection = getPersistentTabSelection();
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
        const nextSel = new Set(persistentTabSelection);
        for (const id of closeIds) nextSel.delete(id);
        setPersistentTabSelection(nextSel);
        const winAfter = [...getWindowsList()]
            .filter((w) => w.tabs?.length > 0)
            .sort((a, b) => a.id - b.id)
            .find((w) => w.id === closedWindowId);
        const tabsAfter = winAfter?.tabs?.length
            ? [...winAfter.tabs].sort((a, b) => a.index - b.index)
            : [];
        setSelectedTab(tabToSelectAfterClose(tabsAfter, minClosedIndex));
        return true;
    }

    if (
        inNavOrTriage &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        getSelectedTab() &&
        windowSlideOrTriage &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.repeat &&
        (event.code === "ShiftLeft" || event.code === "ShiftRight")
    ) {
        event.preventDefault();
        event.stopPropagation();
        const st = getSelectedTab();
        if (st) togglePersistentTabSelection(st.id);
        return true;
    }

    if (
        event.key === "Enter" &&
        inNavOrTriage &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        getSelectedTab() &&
        windowSlideOrTriage
    ) {
        await handleNavModeEnterToNewWindowBatch(event);
        return true;
    }

    if (
        isInNavigationMode &&
        !tabMenuIsOpen &&
        !omniboxIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        noModifiersStrict(event) &&
        !event.repeat &&
        (event.key === "Backspace" || event.key === "Delete") &&
        (getTabsViewRef()?.getNavSlideKind?.() ?? navEdgeSlideKind()) ===
        "history"
    ) {
        event.preventDefault();
        event.stopPropagation();
        getTabsViewRef()?.historyGoBack?.();
        return true;
    }

    if (
        isInNavigationMode &&
        !tabMenuIsOpen &&
        !omniboxIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key,
        )
    ) {
        event.preventDefault();
        event.stopPropagation();
        const list = wl();
        if (list.length === 0) return true;

        if (getNavViewMode() === "overview") {
            let overviewFocusedWindowIndex = getOverviewFocusedWindowIndex();
            if (event.key === "ArrowLeft") {
                overviewFocusedWindowIndex = Math.max(
                    0,
                    overviewFocusedWindowIndex - 1,
                );
                setOverviewFocusedWindowIndex(overviewFocusedWindowIndex);
                const win = list[overviewFocusedWindowIndex];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                setSelectedTab(
                    tabs.find((t) => t.active) ?? tabs[0] ?? getSelectedTab(),
                );
            } else if (event.key === "ArrowRight") {
                overviewFocusedWindowIndex = Math.min(
                    list.length - 1,
                    overviewFocusedWindowIndex + 1,
                );
                setOverviewFocusedWindowIndex(overviewFocusedWindowIndex);
                const win = list[overviewFocusedWindowIndex];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                setSelectedTab(
                    tabs.find((t) => t.active) ?? tabs[0] ?? getSelectedTab(),
                );
            } else if (event.key === "ArrowUp") {
                const win = list[overviewFocusedWindowIndex];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                const refTab =
                    getSelectedTab()?.windowId === win.id
                        ? getSelectedTab()
                        : (tabs.find((t) => t.active) ?? tabs[0]);
                const cur = tabs.findIndex((t) => t.id === refTab?.id);
                const idx = cur >= 0 ? cur : 0;
                setSelectedTab(tabs[Math.max(0, idx - 1)]);
            } else if (event.key === "ArrowDown") {
                const win = list[overviewFocusedWindowIndex];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                const refTab =
                    getSelectedTab()?.windowId === win.id
                        ? getSelectedTab()
                        : (tabs.find((t) => t.active) ?? tabs[0]);
                const cur = tabs.findIndex((t) => t.id === refTab?.id);
                const idx = cur >= 0 ? cur : 0;
                setSelectedTab(
                    tabs[Math.min(tabs.length - 1, idx + 1)],
                );
            }
            return true;
        }

        const nk =
            getTabsViewRef()?.getNavSlideKind?.() ?? navEdgeSlideKind();
        if (nk === "history") {
            if (event.key === "ArrowUp") {
                getTabsViewRef()?.historyMoveSelection?.(-1);
            } else if (event.key === "ArrowDown") {
                getTabsViewRef()?.historyMoveSelection?.(1);
            }
            return true;
        }
        if (nk === "create") {
            if (event.key === "ArrowUp") {
                getTabsViewRef()?.createSlideMoveSelection?.(-1);
            } else if (event.key === "ArrowDown") {
                getTabsViewRef()?.createSlideMoveSelection?.(1);
            }
            return true;
        }

        const totalSlides = list.length + 2;
        let navSlideIndex = getNavSlideIndex();
        if (event.key === "ArrowLeft") {
            navSlideIndex = Math.max(0, navSlideIndex - 1);
            setNavSlideIndex(navSlideIndex);
        } else if (event.key === "ArrowRight") {
            navSlideIndex = Math.min(totalSlides - 1, navSlideIndex + 1);
            setNavSlideIndex(navSlideIndex);
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            const win = list[navSlideIndex - 1] ?? list[0];
            const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
            const refTab =
                getSelectedTab() && getSelectedTab().windowId === win.id
                    ? getSelectedTab()
                    : (tabs.find((t) => t.active) ?? tabs[0]);
            if (event.key === "ArrowUp" && tabs.length > 0) {
                const cur = tabs.findIndex((t) => t.id === refTab?.id);
                const idx = cur >= 0 ? cur : 0;
                setSelectedTab(tabs[Math.max(0, idx - 1)]);
            } else if (event.key === "ArrowDown" && tabs.length > 0) {
                const cur = tabs.findIndex((t) => t.id === refTab?.id);
                const idx = cur >= 0 ? cur : 0;
                setSelectedTab(tabs[Math.min(tabs.length - 1, idx + 1)]);
            }
        }
        return true;
    }

    return false;
}
