<script>
    import { onMount, onDestroy, tick } from "svelte";
    import { get } from "svelte/store";
    import {
        tabStore,
        currentWindowTabs,
        activeTabId,
        windows,
        activeWindowId,
    } from "./stores/tabStore";
    import { chromeService } from "./services/chromeApi";
    import { recentActionsStore } from "./stores/recentActionsStore";
    import LinkMenuHost from "./components/app/LinkMenuHost.svelte";
    import AppOverlays from "./components/app/AppOverlays.svelte";
    import {
        SETTINGS_DEFAULTS,
        mergeStoredSettings,
        persistSettings,
    } from "./app/settingsStorage.js";
    import { isHttpLinkFromEventTarget } from "./app/linkDom.js";
    import {
        TAB_SWITCHING_DISMISS_MS,
        NEW_WINDOW_CONTEXT_TIMEOUT_MS,
        TRIAGE_HORIZONTAL_AUTO_PX,
        TRIAGE_HORIZONTAL_COMMIT_PX,
    } from "./app/constants.js";
    import {
        sortedOpenWindows as sortedOpenWindowsFromList,
        navEdgeSlideKindFromState,
        findTabById as findTabByIdInList,
        syncNavSlideToWindowId as indicesForWindowFocus,
        currentNavWindow as currentNavWindowFromState,
        tabToSelectAfterClose,
        targetTabsForNavBatch,
    } from "./app/navWindowModel.js";
    import { pickMoveTargetWindow } from "./app/triage/pickMoveTargetWindow.js";
    import { clearTriageWheelIdleTimer } from "./app/gestures/triageScroll.js";
    import { subscribeChromeAppMessages } from "./app/chromeAppBridge.js";
    import { dispatchAppKeydown } from "./app/keyboard/dispatchAppKeydown.js";
    import { isInTypingContext } from "./app/domUtils.js";
    import { handleWheelDocument } from "./app/gestures/tabNavigationScroll.js";
    import {
        applyMoveModeDeltas as applyMoveModeDeltasImpl,
        handleMoveModeMouseMove,
    } from "./app/gestures/moveMode.js";

    let isInNavigationMode = false;
    /** Toggled by space long-press; shows TriageModeOverlay instead of TabsView. */
    let isInTriageMode = false;
    /** True after Cmd/Ctrl+Space from a text field until navigation mode ends. */
    let navigationEnteredFromTyping = false;
    let omniboxIsOpen = false;
    let omniboxQuery = "";
    let omniboxOpenedStandalone = false;
    let tabMenuIsOpen = false;
    let systemMenuIsOpen = false;
    let settingsPageIsOpen = false;
    let helpMenuIsOpen = false;

    let isInTabSwitchingMode = false;
    let tabSwitchingDismissTimeout = null;

    let settings = { ...SETTINGS_DEFAULTS };

    let lastDocumentTitle = "";

    $: longPressThreshold = settings.longPressDelayMs ?? 500;
    $: scrollVerticalThreshold = settings.scrollVerticalThreshold ?? 33;
    $: scrollHorizontalThreshold = settings.scrollHorizontalThreshold ?? 33;

    let spaceLongPressTimer = null;
    let metaLongPressTimer = null;
    let altLongPressTimer = null;
    let ctrlLongPressTimer = null;
    let spaceLongPressFired = false;
    let spaceArm = false;

    let currentTab = null;
    let selectedTab = null;

    let navSlideIndex = 0;
    let navViewMode = "list";
    let overviewFocusedWindowIndex = 0;
    let tabsViewRef = null;

    let showActiveTabInfo = false;

    let newWindowContextId = null;
    let newWindowCreatedAt = null;

    /** @type {Set<number>} */
    let persistentTabSelection = new Set();
    $: multiSelectedIds = [...persistentTabSelection];

    let lastNavWindowIdForContext = null;
    let lastOverviewIndexForContext = -1;

    let secondaryButtonDown = false;
    let secondaryGestureHadScroll = false;
    let moveModeLastClientX = null;
    let moveModeLastClientY = null;
    let moveModeHadCrossWindowMove = false;

    const scrollSelectDeltaRef = { value: 0 };
    const scrollCarouselDeltaRef = { value: 0 };

    let triageHorizontalPx = 0;
    /** @type {number | null} */
    let triageDragPointerId = null;
    let triageDragStartX = 0;
    let triageDragStartPx = 0;
    const moveModeVerticalAccumRef = { value: 0 };
    const moveModeHorizontalAccumRef = { value: 0 };
    const moveModeLastClientXYRef = { x: null, y: null };

    /** @type {any} */
    let linkMenuHostRef = null;

    let chromeUnsub = () => {};

    function clearSpaceLongPressTimer() {
        if (spaceLongPressTimer) {
            clearTimeout(spaceLongPressTimer);
            spaceLongPressTimer = null;
        }
    }

    function clearMetaLongPressTimer() {
        if (metaLongPressTimer) {
            clearTimeout(metaLongPressTimer);
            metaLongPressTimer = null;
        }
    }

    function clearAltLongPressTimer() {
        if (altLongPressTimer) {
            clearTimeout(altLongPressTimer);
            altLongPressTimer = null;
        }
    }

    function clearCtrlLongPressTimer() {
        if (ctrlLongPressTimer) {
            clearTimeout(ctrlLongPressTimer);
            ctrlLongPressTimer = null;
        }
    }

    function saveSettingsPatch(patch) {
        settings = { ...settings, ...patch };
        persistSettings(settings);
    }

    function tabMenuContextTab() {
        return isInNavigationMode || isInTriageMode ? selectedTab : currentTab;
    }

    function openOmniboxFromShortcut() {
        omniboxQuery = "";
        omniboxIsOpen = true;
        omniboxOpenedStandalone = !isInNavigationMode && !isInTriageMode;
        if (!isInNavigationMode) {
            isInNavigationMode = true;
            navigationEnteredFromTyping = false;
            chrome.runtime.sendMessage({
                type: "NAVIGATION_MODE",
                isInNavigationMode,
            });
        }
    }

    function enterNavigationModeFromTyping() {
        if (isInNavigationMode) return;
        navigationEnteredFromTyping = true;
        chrome.runtime.sendMessage({
            type: "NAVIGATION_MODE",
            isInNavigationMode: true,
        });
    }

    /** Space can be hijacked for nav while the field still has focus only when previewing another tab. */
    function shouldStealSpaceForNavWhileTyping() {
        return (
            navigationEnteredFromTyping &&
            isInNavigationMode &&
            selectedTab?.id != null &&
            currentTab?.id != null &&
            selectedTab.id !== currentTab.id
        );
    }

    async function handleSpaceShortPress() {
        if (isInNavigationMode) {
            const nk = tabsViewRef?.getNavSlideKind?.() ?? navEdgeSlideKind();
            if (nk === "create") {
                await tabsViewRef?.createSlideActivateSelection?.();
                await tabStore.refreshState();
                await fetchTabInfo();
                isInNavigationMode = false;
                navigationEnteredFromTyping = false;
                resetTriageGestureState();
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
                });
            } else if (nk === "history") {
                await tabsViewRef?.historyActivateSelection?.();
                await tabStore.refreshState();
                await fetchTabInfo();
            } else if (selectedTab) {
                await chromeService.activateTab(selectedTab.id);
                await tabStore.refreshState();
                await fetchTabInfo();
                isInNavigationMode = false;
                navigationEnteredFromTyping = false;
                resetTriageGestureState();
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
                });
            }
        } else {
            chrome.runtime.sendMessage({
                type: "NAVIGATION_MODE",
                isInNavigationMode: !isInNavigationMode,
            });
        }
    }

    function handleWindowBlur() {
        clearSpaceLongPressTimer();
        clearMetaLongPressTimer();
        clearAltLongPressTimer();
        clearCtrlLongPressTimer();
        spaceArm = false;
    }

    function sortedOpenWindows() {
        return sortedOpenWindowsFromList(get(windows));
    }

    function navEdgeSlideKind() {
        return navEdgeSlideKindFromState(
            get(windows),
            navSlideIndex,
            navViewMode,
        );
    }

    function findTabById(tabId) {
        return findTabByIdInList(get(windows), tabId);
    }

    function syncNavSlideToWindowId(windowId) {
        const u = indicesForWindowFocus(get(windows), windowId, navViewMode);
        if (!u) return;
        if (u.navSlideIndex != null) navSlideIndex = u.navSlideIndex;
        if (u.overviewFocusedWindowIndex != null) {
            overviewFocusedWindowIndex = u.overviewFocusedWindowIndex;
        }
    }

    function currentNavWindow() {
        return currentNavWindowFromState(
            get(windows),
            navSlideIndex,
            navViewMode,
            overviewFocusedWindowIndex,
        );
    }

    function resetNewWindowBatchContext() {
        newWindowContextId = null;
        newWindowCreatedAt = null;
    }

    function clearPersistentTabSelection() {
        persistentTabSelection = new Set();
    }

    function togglePersistentTabSelection(tabId) {
        if (tabId == null) return;
        const next = new Set(persistentTabSelection);
        if (next.has(tabId)) next.delete(tabId);
        else next.add(tabId);
        persistentTabSelection = next;
    }

    function removeTriagePointerWindowListeners() {
        window.removeEventListener("pointermove", onTriageWindowPointerMove);
        window.removeEventListener("pointerup", onTriageWindowPointerEnd);
        window.removeEventListener("pointercancel", onTriageWindowPointerEnd);
    }

    function resetTriageGestureState() {
        clearTriageWheelIdleTimer();
        triageHorizontalPx = 0;
        triageDragPointerId = null;
        removeTriagePointerWindowListeners();
    }

    /** @param {PointerEvent} e */
    function onTriageWindowPointerMove(e) {
        if (triageDragPointerId !== e.pointerId) return;
        const max = TRIAGE_HORIZONTAL_AUTO_PX;
        let px = triageDragStartPx + (e.clientX - triageDragStartX);
        px = Math.max(-max, Math.min(max, px));
        triageHorizontalPx = px;
        if (Math.abs(px) >= max) {
            void runTriageHorizontalAction(px > 0 ? "right" : "left");
            triageHorizontalPx = 0;
            triageDragPointerId = null;
            removeTriagePointerWindowListeners();
            clearTriageWheelIdleTimer();
        }
    }

    /** @param {PointerEvent} e */
    function onTriageWindowPointerEnd(e) {
        if (triageDragPointerId !== e.pointerId) return;
        removeTriagePointerWindowListeners();
        triageDragPointerId = null;
        const px = triageHorizontalPx;
        const abs = Math.abs(px);
        clearTriageWheelIdleTimer();
        if (abs >= TRIAGE_HORIZONTAL_AUTO_PX) {
            triageHorizontalPx = 0;
            return;
        }
        if (abs >= TRIAGE_HORIZONTAL_COMMIT_PX) {
            void runTriageHorizontalAction(px > 0 ? "right" : "left");
        }
        triageHorizontalPx = 0;
    }

    /** @param {CustomEvent<PointerEvent>} ce */
    function handleTriagePointerGestureStart(ce) {
        const e = ce.detail;
        if (!e) return;
        if (!isInTriageMode) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (triageDragPointerId != null) return;
        triageDragPointerId = e.pointerId;
        triageDragStartX = e.clientX;
        triageDragStartPx = triageHorizontalPx;
        window.addEventListener("pointermove", onTriageWindowPointerMove);
        window.addEventListener("pointerup", onTriageWindowPointerEnd);
        window.addEventListener("pointercancel", onTriageWindowPointerEnd);
    }

    async function onTriageVerticalStep(direction) {
        const winId = currentTab?.windowId;
        if (winId == null) return;
        const wl = get(windows);
        const win = wl.find((w) => w.id === winId);
        if (!win?.tabs?.length) return;
        const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
        const idx = tabs.findIndex((t) => t.id === currentTab?.id);
        if (idx < 0) return;
        const nextIdx = Math.max(0, Math.min(tabs.length - 1, idx + direction));
        if (nextIdx === idx) return;
        await chromeService.activateTab(tabs[nextIdx].id);
        await tabStore.refreshState();
        await fetchTabInfo();
    }

    /**
     * @param {"left" | "right"} side left = close, right = move
     */
    async function runTriageHorizontalAction(side) {
        clearTriageWheelIdleTimer();
        removeTriagePointerWindowListeners();
        triageDragPointerId = null;
        triageHorizontalPx = 0;

        const tab = selectedTab ?? currentTab;
        if (tab?.id == null) return;

        if (side === "left") {
            const closedId = tab.id;
            const closedTabIndex = tab.index;
            const closedWindowId = tab.windowId;
            await tabStore.closeTab(closedId);
            await tabStore.refreshState();
            const winAfter = [...get(windows)]
                .filter((w) => w.tabs?.length > 0)
                .sort((a, b) => a.id - b.id)
                .find((w) => w.id === closedWindowId);
            const tabsAfter = winAfter?.tabs?.length
                ? [...winAfter.tabs].sort((a, b) => a.index - b.index)
                : [];
            selectedTab =
                tabToSelectAfterClose(tabsAfter, closedTabIndex) ?? currentTab;
            await fetchTabInfo();
            return;
        }

        let target = pickMoveTargetWindow(
            get(windows),
            tab.id,
            NEW_WINDOW_CONTEXT_TIMEOUT_MS,
        );
        if (!target.createNew && target.windowId === tab.windowId) {
            target = { createNew: true };
        }

        try {
            if (target.createNew) {
                await chromeService.createWindowWithTabs([tab.id], {
                    focused: false,
                });
            } else {
                await tabStore.moveTab(tab.id, target.windowId);
            }
        } catch (err) {
            console.error(err);
            return;
        }

        await tabStore.refreshState();
        await fetchTabInfo();
    }

    function handleDocumentClick() {
        setTimeout(() => {
            if (document.title !== lastDocumentTitle) {
                lastDocumentTitle = document.title;
                showActiveTabInfoForCurrentTab();
            }
        }, 100);
    }

    async function fetchTabInfo() {
        console.log("fetchTabInfo");
        currentTab = await chromeService.getCurrentTab();
        selectedTab = currentTab;
        lastDocumentTitle = document.title;
        console.log("currentTab", currentTab);
        if (currentTab && !isInNavigationMode && !isInTabSwitchingMode) {
            showActiveTabInfoForCurrentTab();
        }
    }

    function showActiveTabInfoForCurrentTab() {
        if (isInNavigationMode || isInTriageMode || isInTabSwitchingMode)
            return;
        showActiveTabInfo = true;
    }

    function hideActiveTabInfo() {
        showActiveTabInfo = false;
    }

    function enterTabSwitchingMode() {
        isInTabSwitchingMode = true;
        resetTabSwitchingDismissTimeout();
    }

    function resetTabSwitchingDismissTimeout() {
        if (tabSwitchingDismissTimeout)
            clearTimeout(tabSwitchingDismissTimeout);
        tabSwitchingDismissTimeout = setTimeout(() => {
            isInTabSwitchingMode = false;
            tabSwitchingDismissTimeout = null;
        }, TAB_SWITCHING_DISMISS_MS);
    }

    async function onNavigationModeMessage(message) {
        isInNavigationMode = message.isInNavigationMode === true;
        if (!isInNavigationMode) {
            navigationEnteredFromTyping = false;
        }
        resetNewWindowBatchContext();
        clearPersistentTabSelection();
        if (isInNavigationMode) {
            await tabStore.refreshState();
            const wl = sortedOpenWindows();
            const idx = currentTab
                ? wl.findIndex((w) => w.id === currentTab.windowId)
                : -1;
            navSlideIndex = (idx >= 0 ? idx : 0) + 1;
            overviewFocusedWindowIndex = idx >= 0 ? idx : 0;
        }
    }

    async function onTriageModeMessage(message) {
        isInTriageMode = message.isInTriageMode === true;
        if (!isInTriageMode) {
            resetTriageGestureState();
            return;
        }
        resetNewWindowBatchContext();
        clearPersistentTabSelection();
        await tabStore.refreshState();
        const wl = sortedOpenWindows();
        const idx = currentTab
            ? wl.findIndex((w) => w.id === currentTab.windowId)
            : -1;
        navSlideIndex = (idx >= 0 ? idx : 0) + 1;
        overviewFocusedWindowIndex = idx >= 0 ? idx : 0;
        resetTriageGestureState();
        await fetchTabInfo();
    }

    async function onTabUpdatedMessage(message) {
        const me = await chromeService.getCurrentTab();
        if (me?.id === message.tabId) {
            await fetchTabInfo();
            showActiveTabInfoForCurrentTab();
        }
    }

    async function onTabActivatedMessage() {
        await fetchTabInfo();
        showActiveTabInfoForCurrentTab();
    }

    async function onTabsDataChangedMessage() {
        const tab = await chromeService.getCurrentTab();
        if (tab) {
            currentTab = tab;
            if (selectedTab?.id === tab.id) {
                selectedTab = tab;
            }
        }
    }

    async function onTabSwitchingModeMessage() {
        await tabStore.refreshState();
        enterTabSwitchingMode();
    }

    function loadSettings() {
        chrome.storage.local.get(["settings"], (data) => {
            settings = mergeStoredSettings(data.settings);
        });
    }

    $: if (
        (isInNavigationMode || isInTriageMode) &&
        navViewMode !== "overview"
    ) {
        const wl = sortedOpenWindows();
        const kind = navEdgeSlideKind();
        const win = kind === "window" ? wl[navSlideIndex - 1] : null;
        const wid = win?.id ?? null;
        if (kind !== "window") {
            if (lastNavWindowIdForContext != null) {
                resetNewWindowBatchContext();
                clearPersistentTabSelection();
            }
            lastNavWindowIdForContext = null;
        } else {
            if (
                lastNavWindowIdForContext != null &&
                wid != null &&
                wid !== lastNavWindowIdForContext
            ) {
                resetNewWindowBatchContext();
                clearPersistentTabSelection();
            }
            lastNavWindowIdForContext = wid;
        }
    } else if (
        (isInNavigationMode || isInTriageMode) &&
        navViewMode === "overview"
    ) {
        const idx = overviewFocusedWindowIndex;
        if (
            lastOverviewIndexForContext >= 0 &&
            idx !== lastOverviewIndexForContext
        ) {
            resetNewWindowBatchContext();
            clearPersistentTabSelection();
        }
        lastOverviewIndexForContext = idx;
    } else if (!isInNavigationMode && !isInTriageMode) {
        lastNavWindowIdForContext = null;
        lastOverviewIndexForContext = -1;
    }

    function handleContextMenuCapture(event) {
        if (linkMenuHostRef?.blocksContextCapture()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (!isInNavigationMode && !isInTriageMode) return;
        if (
            tabMenuIsOpen ||
            omniboxIsOpen ||
            systemMenuIsOpen ||
            settingsPageIsOpen
        ) {
            return;
        }
        if (isHttpLinkFromEventTarget(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function handleMouseDown(event) {
        if (linkMenuHostRef?.consumeSecondaryDownForLink(event)) {
            return;
        }
        if (!isInNavigationMode) return;

        if (event.button === 2) {
            secondaryButtonDown = true;
            secondaryGestureHadScroll = false;
            moveModeVerticalAccumRef.value = 0;
            moveModeHorizontalAccumRef.value = 0;
            moveModeLastClientX = event.clientX;
            moveModeLastClientY = event.clientY;
            moveModeLastClientXYRef.x = event.clientX;
            moveModeLastClientXYRef.y = event.clientY;
            if (navEdgeSlideKind() === "window") {
                moveModeHadCrossWindowMove = false;
            }
        }
    }

    function applyMoveModeDeltas(dx, dy) {
        applyMoveModeDeltasImpl(dx, dy, buildGestureCtx());
    }

    function handleMouseMove(event) {
        linkMenuHostRef?.onMouseMoveForLink(event);
        handleMoveModeMouseMove(event, {
            tabMenuIsOpen,
            systemMenuIsOpen,
            settingsPageIsOpen,
            isInNavigationMode,
            navEdgeSlideKind,
            getSelectedTab: () => selectedTab,
            moveModeLastClientXYRef,
            applyMoveModeDeltasFn: applyMoveModeDeltas,
        });
    }

    async function handleMouseUp(event) {
        linkMenuHostRef?.onMouseUpForLink(event);
        if (event.button === 2) {
            if (isInNavigationMode && moveModeHadCrossWindowMove) {
                await tabStore.refreshState();
                const focusedWinId = get(activeWindowId);
                const wl = sortedOpenWindows();
                if (focusedWinId != null) {
                    const fw = wl.find((w) => w.id === focusedWinId);
                    if (fw?.tabs?.length) {
                        syncNavSlideToWindowId(focusedWinId);
                        await tick();
                        const tabs = [...fw.tabs].sort(
                            (a, b) => a.index - b.index,
                        );
                        selectedTab =
                            tabs.find((t) => t.active) ??
                            tabs[0] ??
                            selectedTab;
                    }
                } else if (wl.length > 0) {
                    syncNavSlideToWindowId(wl[0].id);
                    await tick();
                    const tabs = [...wl[0].tabs].sort(
                        (a, b) => a.index - b.index,
                    );
                    selectedTab =
                        tabs.find((t) => t.active) ?? tabs[0] ?? selectedTab;
                }
            }
            moveModeHadCrossWindowMove = false;
            secondaryButtonDown = false;
            moveModeVerticalAccumRef.value = 0;
            moveModeHorizontalAccumRef.value = 0;
            moveModeLastClientX = null;
            moveModeLastClientY = null;
            moveModeLastClientXYRef.x = null;
            moveModeLastClientXYRef.y = null;
        }
    }

    function handleClick(event) {
        if (!event.target.closest("#swift-tabs-root")) {
            if (showActiveTabInfo) {
                hideActiveTabInfo();
            }
            if (isInNavigationMode || isInTriageMode) {
                navigationEnteredFromTyping = false;
                resetTriageGestureState();
                chrome.runtime.sendMessage({
                    type: "TRIAGE_MODE",
                    isInTriageMode: false,
                });
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode: false,
                });
            }
            if (isInTabSwitchingMode) {
                isInTabSwitchingMode = false;
                chrome.runtime.sendMessage({
                    type: "TAB_SWITCHING_MODE",
                    isInTabSwitchingMode,
                });
            }
            omniboxIsOpen = false;
            omniboxOpenedStandalone = false;
            tabMenuIsOpen = false;
            systemMenuIsOpen = false;
            settingsPageIsOpen = false;
            helpMenuIsOpen = false;
            linkMenuHostRef?.dismissAll();
        }
    }

    function isIdleForGlobalTabActions() {
        return (
            !isInNavigationMode &&
            !isInTriageMode &&
            !omniboxIsOpen &&
            !tabMenuIsOpen &&
            !isInTabSwitchingMode &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            !helpMenuIsOpen &&
            !linkMenuHostRef?.anyLinkOverlayOpen?.()
        );
    }

    async function moveSelectedTabAdjacentWindow(event, direction) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (navEdgeSlideKind() !== "window" || !selectedTab) return;

        await tabStore.refreshState();
        const winNav = currentNavWindow();
        if (!winNav?.tabs?.length) return;
        const wlState = get(windows);
        const winFresh = wlState.find((w) => w.id === winNav.id);
        if (!winFresh?.tabs?.length) return;
        const tabsSorted = [...winFresh.tabs].sort((a, b) => a.index - b.index);
        const batch = targetTabsForNavBatch(
            tabsSorted,
            selectedTab,
            persistentTabSelection,
        );
        if (batch.length === 0) return;
        const tabIdsAscending = batch.map((t) => t.id);

        const windowsList = sortedOpenWindows();
        const currentWindowId = winFresh.id;
        const currentWindowIndex = windowsList.findIndex(
            (w) => w.id === currentWindowId,
        );
        if (currentWindowIndex < 0) return;

        const goingNext = direction >= 0;

        if (!goingNext && currentWindowIndex <= 0) {
            return;
        }

        try {
            if (goingNext && currentWindowIndex >= windowsList.length - 1) {
                await chromeService.createWindowWithTabs(tabIdsAscending, {
                    focused: false,
                });
            } else if (goingNext) {
                const targetWindowId = windowsList[currentWindowIndex + 1].id;
                for (const id of tabIdsAscending) {
                    await tabStore.moveTab(id, targetWindowId);
                }
            } else {
                const targetWindowId = windowsList[currentWindowIndex - 1].id;
                for (const id of tabIdsAscending) {
                    await tabStore.moveTab(id, targetWindowId);
                }
            }
        } catch (e) {
            console.error(e);
            return;
        }

        await tabStore.refreshState();

        moveModeHadCrossWindowMove = true;

        const anchorId = tabIdsAscending[0];
        const movedTab = findTabById(anchorId);
        if (movedTab) {
            selectedTab = movedTab;
            syncNavSlideToWindowId(movedTab.windowId);
        }
    }

    async function handleNavModeEnterToNewWindowBatch(event) {
        event.preventDefault();
        event.stopPropagation();
        if (navEdgeSlideKind() !== "window" || !selectedTab) return;

        const win = currentNavWindow();
        if (!win?.tabs?.length) return;

        await tabStore.refreshState();
        const wl = get(windows);
        const winFresh = wl.find((w) => w.id === win.id);
        if (!winFresh?.tabs?.length) return;

        const tabsSorted = [...winFresh.tabs].sort((a, b) => a.index - b.index);
        const sourceWindowId = winFresh.id;

        const targetTabs = targetTabsForNavBatch(
            tabsSorted,
            selectedTab,
            persistentTabSelection,
        );
        if (targetTabs.length === 0) return;

        const targetIds = targetTabs.map((t) => t.id);
        const sampleTab = targetTabs[0];
        const currentIndexOfFirst = tabsSorted.findIndex(
            (t) => t.id === targetIds[0],
        );

        let destId = null;
        if (
            newWindowContextId != null &&
            Date.now() - newWindowCreatedAt <= NEW_WINDOW_CONTEXT_TIMEOUT_MS
        ) {
            const existing = wl.find((w) => w.id === newWindowContextId);
            if (existing && !!existing.incognito === !!sampleTab.incognito) {
                destId = newWindowContextId;
            } else {
                resetNewWindowBatchContext();
            }
        }

        try {
            if (destId == null) {
                const newWin = await chromeService.createWindowWithTabs(
                    targetIds,
                    { focused: false },
                );
                newWindowContextId = newWin.id;
                newWindowCreatedAt = Date.now();
            } else {
                for (const id of targetIds) {
                    await tabStore.moveTab(id, destId);
                }
                newWindowCreatedAt = Date.now();
            }
        } catch (e) {
            console.error(e);
            resetNewWindowBatchContext();
            return;
        }

        await tabStore.refreshState();
        clearPersistentTabSelection();

        const updatedWindows = get(windows);
        const updatedWindow = updatedWindows.find(
            (w) => w.id === sourceWindowId,
        );
        const updatedTabs = updatedWindow?.tabs
            ? [...updatedWindow.tabs].sort((a, b) => a.index - b.index)
            : [];
        if (updatedTabs.length > 0) {
            const nextIndex = Math.min(
                Math.max(0, currentIndexOfFirst),
                updatedTabs.length - 1,
            );
            selectedTab = updatedTabs[nextIndex];
        } else {
            selectedTab = currentTab;
        }
    }

    function buildGestureCtx() {
        return {
            tabMenuIsOpen,
            systemMenuIsOpen,
            settingsPageIsOpen,
            getShowActiveTabInfo: () => showActiveTabInfo,
            hideActiveTabInfo,
            isInNavigationMode,
            navEdgeSlideKind,
            getSelectedTab: () => selectedTab,
            applyMoveModeDeltas: (dx, dy) => applyMoveModeDeltas(dx, dy),
            getWindowsList: () => get(windows),
            getNavSlideIndex: () => navSlideIndex,
            getNavViewMode: () => navViewMode,
            getOverviewFocusedWindowIndex: () => overviewFocusedWindowIndex,
            setOverviewFocusedWindowIndex: (v) => {
                overviewFocusedWindowIndex = v;
            },
            setNavSlideIndex: (v) => {
                navSlideIndex = v;
            },
            setSelectedTab: (t) => {
                selectedTab = t;
            },
            getTabsViewRef: () => tabsViewRef,
            scrollVerticalThreshold,
            scrollHorizontalThreshold,
            scrollSelectDeltaRef,
            scrollCarouselDeltaRef,
            moveModeVerticalAccumRef,
            moveModeHorizontalAccumRef,
            setSecondaryGestureHadScroll: (v) => {
                secondaryGestureHadScroll = v;
            },
            tabStore,
            moveSelectedTabAdjacentWindow,
            getPersistentTabSelection: () => persistentTabSelection,
            getCurrentNavWindowTabsSorted: () => {
                const w = currentNavWindow();
                if (!w?.tabs?.length) return [];
                return [...w.tabs].sort((a, b) => a.index - b.index);
            },
            togglePersistentTabSelection,
            getIsInTriageMode: () => isInTriageMode,
            getTriageHorizontalPx: () => triageHorizontalPx,
            setTriageHorizontalPx: (n) => {
                triageHorizontalPx = n;
            },
            runTriageHorizontalAction,
            onTriageVerticalStep,
        };
    }

    function handleWheel(event) {
        handleWheelDocument(event, buildGestureCtx());
    }

    function handleKeyup(event) {
        const isSpace = event.key === " " || event.code === "Space";
        if (isSpace) {
            const typing = isInTypingContext();
            const sameAsCurrent =
                selectedTab?.id != null &&
                currentTab?.id != null &&
                selectedTab.id === currentTab.id;
            const allowDefaultSpaceInField =
                navigationEnteredFromTyping &&
                isInNavigationMode &&
                typing &&
                sameAsCurrent;
            if (!allowDefaultSpaceInField) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
        }

        if (isSpace && spaceArm) {
            spaceArm = false;
            clearSpaceLongPressTimer();
            if (spaceLongPressFired) {
                spaceLongPressFired = false;
                return;
            }
            void handleSpaceShortPress();
            return;
        }

        if (
            (event.key === "Meta" || event.key === "OS") &&
            metaLongPressTimer
        ) {
            clearMetaLongPressTimer();
        }
        if (event.key === "Alt" && altLongPressTimer) {
            clearAltLongPressTimer();
        }
        if (event.key === "Control" && ctrlLongPressTimer) {
            clearCtrlLongPressTimer();
        }
    }

    function buildKeydownCtx() {
        return {
            getSpaceLongPressTimer: () => spaceLongPressTimer,
            clearSpaceLongPressTimer,
            getMetaLongPressTimer: () => metaLongPressTimer,
            clearMetaLongPressTimer,
            getAltLongPressTimer: () => altLongPressTimer,
            clearAltLongPressTimer,
            getCtrlLongPressTimer: () => ctrlLongPressTimer,
            clearCtrlLongPressTimer,
            isIdleForGlobalTabActions,
            omniboxIsOpen,
            tabMenuIsOpen,
            helpMenuIsOpen,
            systemMenuIsOpen,
            settingsPageIsOpen,
            tabMenuContextTab,
            longPressThreshold,
            setHelpMenuIsOpen: (v) => {
                helpMenuIsOpen = v;
            },
            openOmniboxFromShortcut,
            enterNavigationModeFromTyping,
            getIsInNavigationMode: () => isInNavigationMode,
            shouldStealSpaceForNavWhileTyping,
            setTabMenuIsOpen: (v) => {
                tabMenuIsOpen = v;
            },
            setSystemMenuIsOpen: (v) => {
                systemMenuIsOpen = v;
            },
            setSettingsPageIsOpen: (v) => {
                settingsPageIsOpen = v;
            },
            setMetaLongPressTimer: (v) => {
                metaLongPressTimer = v;
            },
            setAltLongPressTimer: (v) => {
                altLongPressTimer = v;
            },
            setCtrlLongPressTimer: (v) => {
                ctrlLongPressTimer = v;
            },
            getHelpMenuIsOpen: () => helpMenuIsOpen,
            getTabMenuIsOpen: () => tabMenuIsOpen,
            getOmniboxIsOpen: () => omniboxIsOpen,
            getSystemMenuIsOpen: () => systemMenuIsOpen,
            getSettingsPageIsOpen: () => settingsPageIsOpen,
            isInNavigationMode,
            getSelectedTab: () => selectedTab,
            getCurrentTab: () => currentTab,
            tabStore,
            setSpaceArm: (v) => {
                spaceArm = v;
            },
            setSpaceLongPressFired: (v) => {
                spaceLongPressFired = v;
            },
            setSpaceLongPressTimer: (v) => {
                spaceLongPressTimer = v;
            },
            getTabsViewRef: () => tabsViewRef,
            linkEsc: {
                isDescriptionOpen: () =>
                    linkMenuHostRef?.isDescriptionOpen?.() ?? false,
                isPreviewOpen: () =>
                    linkMenuHostRef?.isPreviewOpen?.() ?? false,
                isMenuOpen: () => linkMenuHostRef?.isMenuOpen?.() ?? false,
                closeDescriptionForEscape: () =>
                    linkMenuHostRef?.closeDescriptionForEscape?.(),
                closePreviewForEscape: () =>
                    linkMenuHostRef?.closePreviewForEscape?.(),
                closeMenuForEscape: () =>
                    linkMenuHostRef?.closeMenuForEscape?.(),
            },
            isInTabSwitchingMode,
            setIsInTabSwitchingMode: (v) => {
                isInTabSwitchingMode = v;
            },
            tabSwitchingDismissTimeout,
            setTabSwitchingDismissTimeout: (v) => {
                tabSwitchingDismissTimeout = v;
            },
            getShowActiveTabInfo: () => showActiveTabInfo,
            hideActiveTabInfo,
            navEdgeSlideKind,
            getWindowsList: () => get(windows),
            setSelectedTab: (t) => {
                selectedTab = t;
            },
            chromeService,
            fetchTabInfo,
            showActiveTabInfoForCurrentTab,
            getPersistentTabSelection: () => persistentTabSelection,
            setPersistentTabSelection: (s) => {
                persistentTabSelection = s;
            },
            togglePersistentTabSelection,
            handleNavModeEnterToNewWindowBatch,
            getNavSlideIndex: () => navSlideIndex,
            setNavSlideIndex: (v) => {
                navSlideIndex = v;
            },
            getNavViewMode: () => navViewMode,
            getOverviewFocusedWindowIndex: () => overviewFocusedWindowIndex,
            setOverviewFocusedWindowIndex: (v) => {
                overviewFocusedWindowIndex = v;
            },
            sortedOpenWindows,
            enterTabSwitchingMode,
            getIsInTriageMode: () => isInTriageMode,
            sendTriageMode: (/** @type {boolean} */ v) => {
                chrome.runtime.sendMessage({
                    type: "TRIAGE_MODE",
                    isInTriageMode: v,
                });
            },
            getCurrentWindowTabs: () => get(currentWindowTabs),
            getActiveTabId: () => get(activeTabId),
            getActiveWindowId: () => get(activeWindowId),
            resetTabSwitchingDismissTimeout,
        };
    }

    async function handleKeydown(event) {
        await dispatchAppKeydown(event, buildKeydownCtx());
    }

    async function onNavActivateTab(/** @type {chrome.tabs.Tab} */ tab) {
        await chromeService.activateTab(tab.id);
        await tabStore.refreshState();
        await fetchTabInfo();
        navigationEnteredFromTyping = false;
        resetTriageGestureState();
        isInNavigationMode = false;
        chrome.runtime.sendMessage({
            type: "TRIAGE_MODE",
            isInTriageMode: false,
        });
        chrome.runtime.sendMessage({
            type: "NAVIGATION_MODE",
            isInNavigationMode,
        });
    }

    $: activeInfoTab = isInTriageMode
        ? (currentTab ?? selectedTab)
        : isInNavigationMode
          ? navEdgeSlideKind() === "history" || navEdgeSlideKind() === "create"
              ? null
              : selectedTab
          : currentTab;

    $: triageTabList =
        isInTriageMode && currentTab?.windowId != null
            ? (() => {
                  const win = get(windows).find(
                      (w) => w.id === currentTab.windowId,
                  );
                  return win?.tabs?.length
                      ? [...win.tabs].sort((a, b) => a.index - b.index)
                      : [];
              })()
            : [];
    $: triageActiveIndex = triageTabList.findIndex(
        (t) => t.id === currentTab?.id,
    );
    $: triageCanScrollUp = triageActiveIndex > 0;
    $: triageCanScrollDown =
        triageActiveIndex >= 0 && triageActiveIndex < triageTabList.length - 1;
    $: showActiveInfoLayer =
        (showActiveTabInfo || tabMenuIsOpen) &&
        activeInfoTab &&
        !isInTriageMode;

    onMount(async () => {
        console.log("App mounted");
        document.addEventListener("wheel", handleWheel, { passive: false });
        document.addEventListener("click", handleDocumentClick);
        window.addEventListener("blur", handleWindowBlur);

        await tabStore.init();
        await recentActionsStore.init();
        chromeUnsub = subscribeChromeAppMessages({
            onNavigationMode: onNavigationModeMessage,
            onTriageMode: onTriageModeMessage,
            onTabSwitchingMode: onTabSwitchingModeMessage,
            onTabsDataChanged: onTabsDataChangedMessage,
            onTabUpdated: onTabUpdatedMessage,
            onTabActivated: onTabActivatedMessage,
        });
        fetchTabInfo();
        loadSettings();
    });

    onDestroy(() => {
        document.removeEventListener("wheel", handleWheel, { passive: false });
        document.removeEventListener("click", handleDocumentClick);
        window.removeEventListener("blur", handleWindowBlur);
        clearSpaceLongPressTimer();
        clearMetaLongPressTimer();
        clearAltLongPressTimer();
        clearCtrlLongPressTimer();
        resetTriageGestureState();
        chromeUnsub();
    });
</script>

<svelte:window
    on:keydown|capture={handleKeydown}
    on:keyup|capture={handleKeyup}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:contextmenu|capture={handleContextMenuCapture}
    on:contextmenu={(e) => linkMenuHostRef?.handleRightClick(e)}
    on:click={handleClick}
/>

<LinkMenuHost
    bind:this={linkMenuHostRef}
    {longPressThreshold}
    copyImageWithMetaKey={settings.copyImageWithMetaKey}
    {tabMenuIsOpen}
    {helpMenuIsOpen}
    {systemMenuIsOpen}
    {settingsPageIsOpen}
/>

<AppOverlays
    {onNavActivateTab}
    bind:tabMenuIsOpen
    bind:helpMenuIsOpen
    bind:settingsPageIsOpen
    bind:systemMenuIsOpen
    bind:isInNavigationMode
    bind:omniboxOpenedStandalone
    bind:omniboxIsOpen
    {multiSelectedIds}
    windowsList={$windows}
    bind:currentTab
    bind:selectedTab
    bind:navSlideIndex
    bind:navViewMode
    bind:overviewFocusedWindowIndex
    bind:tabsViewRef
    bind:omniboxQuery
    activeTabId={$activeTabId}
    {settings}
    {saveSettingsPatch}
    {isInTabSwitchingMode}
    currentWindowTabs={$currentWindowTabs}
    {showActiveInfoLayer}
    {activeInfoTab}
    {isInTriageMode}
    {triageHorizontalPx}
    {triageCanScrollUp}
    {triageCanScrollDown}
    onTriagePointerGestureStart={handleTriagePointerGestureStart}
/>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }

    :global(#swift-tabs-root) {
        position: relative;
        z-index: 2147483647;
        font-family: system-ui;
        color: white;
    }
    :global(button) {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
    }

    :global(.material-symbols-rounded) {
        font-variation-settings:
            "FILL" 0,
            "wght" 100,
            "GRAD" 0,
            "opsz" 48;
    }
</style>
