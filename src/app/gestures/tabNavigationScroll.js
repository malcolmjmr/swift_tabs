import {
    navEdgeSlideKindFromState,
    sortedOpenWindows,
} from "../navWindowModel.js";

/**
 * @param {object} ctx
 */
export function handleVerticalTabScroll(scrollUpdate, ctx) {
    const {
        isInNavigationMode,
        getWindowsList,
        getNavSlideIndex,
        getNavViewMode,
        getOverviewFocusedWindowIndex,
        getSelectedTab,
        setSelectedTab,
        getTabsViewRef,
        scrollVerticalThreshold,
        scrollSelectDeltaRef,
    } = ctx;

    if (isInNavigationMode) {
        const wl = sortedOpenWindows(getWindowsList());
        if (!wl.length) return;

        if (getNavViewMode() === "overview") {
            const win = wl[getOverviewFocusedWindowIndex()];
            if (!win?.tabs?.length) return;
            const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
            const refTab =
                getSelectedTab() && getSelectedTab().windowId === win.id
                    ? getSelectedTab()
                    : (tabs.find((t) => t.active) ?? tabs[0]);
            if (!refTab) return;
            const currentIndex = tabs.findIndex((t) => t.id === refTab.id);
            const idx = currentIndex >= 0 ? currentIndex : 0;
            scrollSelectDeltaRef.value += scrollUpdate;
            if (
                Math.abs(scrollSelectDeltaRef.value) >= scrollVerticalThreshold
            ) {
                const direction = scrollSelectDeltaRef.value > 0 ? -1 : 1;
                scrollSelectDeltaRef.value = 0;
                const nextIndex = Math.max(
                    0,
                    Math.min(tabs.length - 1, idx + direction),
                );
                setSelectedTab(tabs[nextIndex]);
            }
            return;
        }

        const nk =
            getTabsViewRef()?.getNavSlideKind?.() ??
            navEdgeSlideKindFromState(
                getWindowsList(),
                getNavSlideIndex(),
                getNavViewMode(),
            );
        if (nk === "history") {
            scrollSelectDeltaRef.value += scrollUpdate;
            if (
                Math.abs(scrollSelectDeltaRef.value) >= scrollVerticalThreshold
            ) {
                const direction = scrollSelectDeltaRef.value > 0 ? -1 : 1;
                scrollSelectDeltaRef.value = 0;
                getTabsViewRef()?.historyMoveSelection?.(direction);
            }
            return;
        }
        if (nk === "create") {
            scrollSelectDeltaRef.value += scrollUpdate;
            if (
                Math.abs(scrollSelectDeltaRef.value) >= scrollVerticalThreshold
            ) {
                const direction = scrollSelectDeltaRef.value > 0 ? -1 : 1;
                scrollSelectDeltaRef.value = 0;
                getTabsViewRef()?.createSlideMoveSelection?.(direction);
            }
            return;
        }

        const navSlideIndex = getNavSlideIndex();
        const win = wl[navSlideIndex - 1];
        if (!win?.tabs?.length) return;

        const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
        const refTab =
            getSelectedTab() && getSelectedTab().windowId === win.id
                ? getSelectedTab()
                : (tabs.find((t) => t.active) ?? tabs[0]);
        if (!refTab) return;
        const currentIndex = tabs.findIndex((t) => t.id === refTab.id);
        const idx = currentIndex >= 0 ? currentIndex : 0;

        scrollSelectDeltaRef.value += scrollUpdate;
        if (Math.abs(scrollSelectDeltaRef.value) >= scrollVerticalThreshold) {
            const direction = scrollSelectDeltaRef.value > 0 ? -1 : 1;
            scrollSelectDeltaRef.value = 0;
            const nextIndex = Math.max(
                0,
                Math.min(tabs.length - 1, idx + direction),
            );
            setSelectedTab(tabs[nextIndex]);
        }
    } else {
        chrome.runtime.sendMessage({
            type: "SCROLL",
            scrollDelta: scrollUpdate,
        });
    }
}

/**
 * @param {number} deltaX
 * @param {object} ctx
 */
export function handleHorizontalCarouselScroll(deltaX, ctx) {
    const {
        isInNavigationMode,
        getWindowsList,
        getNavViewMode,
        getOverviewFocusedWindowIndex,
        setOverviewFocusedWindowIndex,
        getNavSlideIndex,
        setNavSlideIndex,
        getSelectedTab,
        setSelectedTab,
        scrollHorizontalThreshold,
        scrollCarouselDeltaRef,
    } = ctx;

    if (!isInNavigationMode) return;
    const wl = sortedOpenWindows(getWindowsList());
    if (getNavViewMode() === "overview") {
        if (wl.length < 2) return;
        scrollCarouselDeltaRef.value += deltaX;
        if (
            Math.abs(scrollCarouselDeltaRef.value) >= scrollHorizontalThreshold
        ) {
            const step = scrollCarouselDeltaRef.value > 0 ? 1 : -1;
            scrollCarouselDeltaRef.value = 0;
            const nextIdx = Math.max(
                0,
                Math.min(
                    wl.length - 1,
                    getOverviewFocusedWindowIndex() + step,
                ),
            );
            setOverviewFocusedWindowIndex(nextIdx);
            const win = wl[nextIdx];
            const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
            setSelectedTab(
                tabs.find((t) => t.active) ?? tabs[0] ?? getSelectedTab(),
            );
        }
        return;
    }
    const totalSlides = wl.length + 2;
    if (totalSlides < 2) return;
    scrollCarouselDeltaRef.value += deltaX;
    if (Math.abs(scrollCarouselDeltaRef.value) >= scrollHorizontalThreshold) {
        const step = scrollCarouselDeltaRef.value > 0 ? 1 : -1;
        scrollCarouselDeltaRef.value = 0;
        const navSlideIndex = getNavSlideIndex();
        setNavSlideIndex(
            Math.max(0, Math.min(totalSlides - 1, navSlideIndex + step)),
        );
    }
}

/**
 * @param {WheelEvent} event
 * @param {object} ctx
 */
export function handleWheelDocument(event, ctx) {
    const {
        tabMenuIsOpen,
        systemMenuIsOpen,
        settingsPageIsOpen,
        getShowActiveTabInfo,
        hideActiveTabInfo,
        isInNavigationMode,
        navEdgeSlideKind,
        getSelectedTab,
        applyMoveModeDeltas,
    } = ctx;

    if (tabMenuIsOpen || systemMenuIsOpen || settingsPageIsOpen) return;

    const wheelEl =
        event.target instanceof Element
            ? event.target
            : event.target?.parentElement;
    if (wheelEl?.closest(".omnibox-overlay")) {
        return;
    }

    if (!isInNavigationMode && !event.metaKey) {
        if (getShowActiveTabInfo() && event.deltaY > 0) {
            hideActiveTabInfo();
        }
        return;
    }

    if (
        isInNavigationMode &&
        event.buttons & 2 &&
        navEdgeSlideKind() === "window" &&
        getSelectedTab()
    ) {
        const isVerticalScroll =
            Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            applyMoveModeDeltas(0, event.deltaY);
        } else {
            applyMoveModeDeltas(event.deltaX, 0);
        }
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    if (isInNavigationMode) {
        const isVerticalScroll =
            Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            handleVerticalTabScroll(event.deltaY, ctx);
        } else {
            handleHorizontalCarouselScroll(event.deltaX, ctx);
        }
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    const isVerticalScroll =
        Math.abs(event.deltaX) < Math.abs(event.deltaY);
    if (isVerticalScroll) {
        handleVerticalTabScroll(event.deltaY, ctx);
    } else {
        handleHorizontalCarouselScroll(event.deltaX, ctx);
    }
    event.preventDefault();
    event.stopPropagation();
}
