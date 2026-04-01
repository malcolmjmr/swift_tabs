<script>
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { get } from "svelte/store";
    import Toolbar from "./components/Toolbar.svelte";
    import TabSwitchingModal from "./components/TabSwitchingModal.svelte";
    import TabMenu from "./components/tab/TabMenu.svelte";
    import SystemMenu from "./components/SystemMenu.svelte";
    import {
        tabStore,
        currentWindowTabs,
        activeTabId,
        windows,
        activeWindowId,
    } from "./stores/tabStore";
    import { chromeService } from "./services/chromeApi";
    import { recentActionsStore } from "./stores/recentActionsStore";
    import TabsView from "./components/tabs_view/TabsView.svelte";
    import Omnibox from "./components/Omnibox.svelte";
    import ActiveTabInfo from "./components/tab/ActiveTabInfo.svelte";
    import HelpMenu from "./components/HelpMenu.svelte";
    import SettingsPage from "./components/SettingsPage.svelte";

    let isInNavigationMode = false;
    let omniboxIsOpen = false;
    let omniboxQuery = "";
    let omniboxOpenedStandalone = false; // true when "o" opened it from outside nav mode
    let tabMenuIsOpen = false;
    let systemMenuIsOpen = false;
    let settingsPageIsOpen = false;
    let helpMenuIsOpen = false;

    const TAB_SWITCHING_DISMISS_MS = 1500;
    let isInTabSwitchingMode = false;
    let tabSwitchingDismissTimeout = null;

    let mouseX = 0;
    let mouseY = 0;

    const SETTINGS_DEFAULTS = {
        toolbarInPopup: false,
        openToolbarWithMetaKey: false,
        queueLinkWithMetaKey: false,
        copyImageWithMetaKey: false,
        defaultView: "windows",
        longPressDelayMs: 500,
        scrollVerticalThreshold: 33,
        scrollHorizontalThreshold: 33,
    };

    let settings = { ...SETTINGS_DEFAULTS };

    let rightClickTimer;
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
        chrome.storage.local.set({ settings });
    }

    function tabMenuContextTab() {
        return isInNavigationMode ? selectedTab : currentTab;
    }

    function openOmniboxFromShortcut() {
        omniboxQuery = "";
        omniboxIsOpen = true;
        omniboxOpenedStandalone = !isInNavigationMode;
        if (!isInNavigationMode) {
            isInNavigationMode = true;
            chrome.runtime.sendMessage({
                type: "NAVIGATION_MODE",
                isInNavigationMode,
            });
        }
    }

    async function handleSpaceShortPress() {
        if (isInNavigationMode) {
            const nk =
                tabsViewRef?.getNavSlideKind?.() ?? navEdgeSlideKind();
            if (nk === "create") {
                await chromeService.createEmptyWindow();
                await tabStore.refreshState();
                await fetchTabInfo();
                isInNavigationMode = false;
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
                });
            } else if (nk === "history") {
                await tabsViewRef?.historyActivateSelection?.();
                await tabStore.refreshState();
                await fetchTabInfo();
            } else if (selectedTab) {
                chromeService.activateTab(selectedTab.id);
                isInNavigationMode = false;
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

    onMount(async () => {
        console.log("App mounted");
        document.addEventListener("wheel", handleWheel, { passive: false });
        document.addEventListener("click", handleDocumentClick);
        window.addEventListener("blur", handleWindowBlur);

        await tabStore.init();
        await recentActionsStore.init();
        addChromeRuntimeMessageListener();
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
    });

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

    function addChromeRuntimeMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "NAVIGATION_MODE") {
                onNavigationModeMessage(message);
            } else if (message.type === "TAB_SWITCHING_MODE") {
                onTabSwitchingModeMessage(message);
            } else if (message.type === "TABS_DATA_CHANGED") {
                onTabsDataChangedMessage();
            } else if (message.type === "TAB_UPDATED") {
                onTabUpdatedMessage(message);
            } else if (message.type === "TAB_ACTIVATED") {
                onTabActivatedMessage();
            }
        });
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

    function showActiveTabInfoForCurrentTab() {
        if (isInNavigationMode || isInTabSwitchingMode) return;
        showActiveTabInfo = true;
    }

    function hideActiveTabInfo() {
        showActiveTabInfo = false;
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

    async function onTabSwitchingModeMessage() {
        await tabStore.refreshState();
        enterTabSwitchingMode();
    }

    function loadSettings() {
        chrome.storage.local.get(["settings"], (data) => {
            const raw = data.settings;
            settings = {
                ...SETTINGS_DEFAULTS,
                ...(raw && typeof raw === "object" ? raw : {}),
            };
        });
    }

    let currentTab = null;
    let selectedTab = null;

    /** TabsView slide: 0=history, 1..N=windows, N+1=create (with edge slides) */
    let navSlideIndex = 0;
    let navViewMode = "list";
    let overviewFocusedWindowIndex = 0;
    let tabsViewRef = null;

    let showActiveTabInfo = false;

    function sortedOpenWindows() {
        return [...get(windows)]
            .filter((w) => w.tabs?.length > 0)
            .sort((a, b) => a.id - b.id);
    }

    /** Matches TabsView slide kind when `includeEdgeSlides` is true */
    function navEdgeSlideKind() {
        if (navViewMode === "overview") return "window";
        const wl = sortedOpenWindows();
        const n = wl.length;
        if (n === 0) return null;
        if (navSlideIndex === 0) return "history";
        if (navSlideIndex === n + 1) return "create";
        return "window";
    }

    async function onNavigationModeMessage(message) {
        isInNavigationMode = message.isInNavigationMode;
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

    function handleRightClick(event) {
        const textIsSelected = window.getSelection().toString().length > 0;
        const isMetaKeyPressed = event.metaKey;

        if (textIsSelected) {
            if (isMetaKeyPressed) {
                console.log("queue search");
                event.preventDefault();
            }
            return;
        }

        const link = event.target.closest("a");
        if (link?.href) {
            const url = link.href;
            if (url.startsWith("http://") || url.startsWith("https://")) {
                event.preventDefault();
                event.stopPropagation();
                chromeService.createTab({ url, active: false });
            }
            return;
        }

        const imageClicked = event.target.tagName === "IMG";
        if (imageClicked) {
            if (settings.copyImageWithMetaKey == isMetaKeyPressed) {
                console.log("copy image");
                event.preventDefault();
            }
            return;
        }
    }

    function handleMouseDown(event) {}

    function handleMouseUp(event) {
        if (event.button === 2) {
            // Right-click button
            clearTimeout(rightClickTimer);
            console.log("right click mouse up");
        }
    }

    function handleClick(event) {
        // if user clicks elements outside of #swift-tabs-root then dismiss current mode
        if (!event.target.closest("#swift-tabs-root")) {
            if (showActiveTabInfo) {
                hideActiveTabInfo();
            }
            if (isInNavigationMode) {
                isInNavigationMode = false;
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
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
        }
    }

    function isInTypingContext() {
        const el = document.activeElement;
        if (!el || typeof el.matches !== "function") return false;
        if (el.matches("input, textarea, select")) return true;
        return el.isContentEditable;
    }

    function noModifiersStrict(event) {
        return (
            !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey
        );
    }

    function noModifiersForHelpKey(event) {
        return !event.ctrlKey && !event.altKey && !event.metaKey;
    }

    function isIdleForGlobalTabActions() {
        return (
            !isInNavigationMode &&
            !omniboxIsOpen &&
            !tabMenuIsOpen &&
            !isInTabSwitchingMode &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            !helpMenuIsOpen
        );
    }

    async function handleKeydown(event) {
        if (isInTypingContext()) return;

        if (
            spaceLongPressTimer &&
            !(event.key === " " && event.repeat) &&
            event.key !== " "
        ) {
            clearSpaceLongPressTimer();
        }
        if (
            metaLongPressTimer &&
            event.metaKey &&
            event.key !== "Meta" &&
            event.key !== "OS"
        ) {
            clearMetaLongPressTimer();
        }
        if (altLongPressTimer && event.altKey && event.key !== "Alt") {
            clearAltLongPressTimer();
        }
        if (
            ctrlLongPressTimer &&
            event.ctrlKey &&
            event.key !== "Control"
        ) {
            clearCtrlLongPressTimer();
        }

        if (
            ((event.key === "?" && noModifiersForHelpKey(event)) ||
                (event.key === "/" && noModifiersStrict(event))) &&
            isIdleForGlobalTabActions()
        ) {
            event.preventDefault();
            event.stopPropagation();
            helpMenuIsOpen = true;
        } else if (
            (event.key === "o" ||
                event.key === "O" ||
                event.key === "n" ||
                event.key === "N") &&
            noModifiersStrict(event) &&
            !omniboxIsOpen &&
            !tabMenuIsOpen &&
            !helpMenuIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen
        ) {
            event.preventDefault();
            event.stopPropagation();
            openOmniboxFromShortcut();
        } else if (
            (event.key === "a" ||
                event.key === "A" ||
                event.key === "m" ||
                event.key === "M") &&
            noModifiersStrict(event) &&
            !tabMenuIsOpen &&
            !helpMenuIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            (isInNavigationMode ? selectedTab : currentTab)
        ) {
            event.preventDefault();
            event.stopPropagation();
            tabMenuIsOpen = true;
        } else if (
            (event.key === "Meta" || event.key === "OS") &&
            !event.repeat &&
            !helpMenuIsOpen &&
            !tabMenuIsOpen &&
            !omniboxIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            tabMenuContextTab()
        ) {
            clearMetaLongPressTimer();
            metaLongPressTimer = setTimeout(() => {
                metaLongPressTimer = null;
                if (
                    helpMenuIsOpen ||
                    tabMenuIsOpen ||
                    omniboxIsOpen ||
                    systemMenuIsOpen ||
                    settingsPageIsOpen
                ) {
                    return;
                }
                if (!tabMenuContextTab()) return;
                tabMenuIsOpen = true;
            }, longPressThreshold);
        } else if (
            event.key === "Alt" &&
            !event.repeat &&
            !helpMenuIsOpen &&
            !tabMenuIsOpen &&
            !omniboxIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen
        ) {
            clearAltLongPressTimer();
            altLongPressTimer = setTimeout(() => {
                altLongPressTimer = null;
                if (
                    helpMenuIsOpen ||
                    tabMenuIsOpen ||
                    omniboxIsOpen ||
                    systemMenuIsOpen ||
                    settingsPageIsOpen
                ) {
                    return;
                }
                systemMenuIsOpen = true;
            }, longPressThreshold);
        } else if (
            event.key === "Control" &&
            !event.repeat &&
            !helpMenuIsOpen &&
            !tabMenuIsOpen &&
            !omniboxIsOpen &&
            !systemMenuIsOpen &&
            !settingsPageIsOpen
        ) {
            clearCtrlLongPressTimer();
            ctrlLongPressTimer = setTimeout(() => {
                ctrlLongPressTimer = null;
                if (
                    helpMenuIsOpen ||
                    tabMenuIsOpen ||
                    omniboxIsOpen ||
                    systemMenuIsOpen ||
                    settingsPageIsOpen
                ) {
                    return;
                }
                settingsPageIsOpen = true;
            }, longPressThreshold);
        } else if (
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
            selectedTab
        ) {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "s" || event.key === "S") {
                (async () => {
                    const url = await chromeService.copyTabUrl(selectedTab.id);
                    if (url) await navigator.clipboard.writeText(url);
                })();
            } else if (event.key === "f" || event.key === "F") {
                (async () => {
                    await chromeService.focusWindow(selectedTab.windowId);
                    await tabStore.refreshState();
                })();
            } else if (event.key === "x" || event.key === "X") {
                (async () => {
                    await tabStore.closeTab(selectedTab.id);
                    await tabStore.refreshState();
                    selectedTab = currentTab;
                })();
            }
        } else if (event.key === " ") {
            if (event.repeat) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return;
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
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            spaceArm = true;
            spaceLongPressFired = false;
            clearSpaceLongPressTimer();
            spaceLongPressTimer = setTimeout(() => {
                spaceLongPressTimer = null;
                if (
                    helpMenuIsOpen ||
                    tabMenuIsOpen ||
                    omniboxIsOpen ||
                    systemMenuIsOpen ||
                    settingsPageIsOpen
                ) {
                    return;
                }
                spaceLongPressFired = true;
                openOmniboxFromShortcut();
            }, longPressThreshold);
        } else if (event.key === "Escape") {
            if (settingsPageIsOpen) {
                event.preventDefault();
                settingsPageIsOpen = false;
            } else if (systemMenuIsOpen) {
                event.preventDefault();
                systemMenuIsOpen = false;
            } else if (helpMenuIsOpen) {
                event.preventDefault();
                helpMenuIsOpen = false;
            } else if (isInTabSwitchingMode) {
                event.preventDefault();
                if (tabSwitchingDismissTimeout) {
                    clearTimeout(tabSwitchingDismissTimeout);
                    tabSwitchingDismissTimeout = null;
                }
                isInTabSwitchingMode = false;
            } else if (showActiveTabInfo) {
                event.preventDefault();
                hideActiveTabInfo();
            }
        } else if (
            isIdleForGlobalTabActions() &&
            noModifiersStrict(event) &&
            (event.key === "Delete" ||
                event.key === "Backspace" ||
                event.key === "Enter" ||
                event.key === "c" ||
                event.key === "C" ||
                event.key === "r" ||
                event.key === "R" ||
                event.key === "i" ||
                event.key === "I" ||
                event.key === "d" ||
                event.key === "D")
        ) {
            const tab = currentTab ?? (await chromeService.getCurrentTab());
            if (!tab) {
                /* keep event for page */
            } else if (
                (event.key === "Delete" || event.key === "Backspace") &&
                window.getSelection().toString().length === 0 &&
                !event.repeat
            ) {
                event.preventDefault();
                event.stopPropagation();
                await tabStore.closeTab(tab.id);
                await fetchTabInfo();
            } else if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                await chromeService.createWindowWithTab(tab.id);
                await tabStore.refreshState();
                await fetchTabInfo();
            } else if (
                (event.key === "c" || event.key === "C") &&
                window.getSelection().toString().length === 0
            ) {
                event.preventDefault();
                event.stopPropagation();
                const url = await chromeService.copyTabUrl(tab.id);
                if (url) await navigator.clipboard.writeText(url);
            } else if (event.key === "r" || event.key === "R") {
                event.preventDefault();
                event.stopPropagation();
                await chromeService.reloadTab(tab.id);
            } else if (event.key === "i" || event.key === "I") {
                event.preventDefault();
                event.stopPropagation();
                if (showActiveTabInfo) {
                    hideActiveTabInfo();
                } else {
                    showActiveTabInfoForCurrentTab();
                }
            } else if (event.key === "d" || event.key === "D") {
                event.preventDefault();
                event.stopPropagation();
                await chromeService.duplicateTab(tab.id);
                await tabStore.refreshState();
            }
        } else if (
            (event.key === "Delete" || event.key === "Backspace") &&
            isInNavigationMode &&
            selectedTab &&
            navEdgeSlideKind() === "window"
        ) {
            event.preventDefault();
            event.stopPropagation();
            const windowsList = [...get(windows)]
                .filter((w) => w.tabs.length > 0)
                .sort((a, b) => a.id - b.id);
            const window = windowsList.find(
                (w) => w.id === selectedTab.windowId,
            );
            if (!window?.tabs?.length) return;
            const tabs = [...window.tabs].sort((a, b) => a.index - b.index);
            const currentIndex = tabs.findIndex((t) => t.id === selectedTab.id);
            await tabStore.closeTab(selectedTab.id);
            await tabStore.refreshState();
            selectedTab = currentTab;
            // const updatedWindows = get(windows);
            // const updatedWindow = updatedWindows.find(
            //     (w) => w.id === window.id,
            // );
            // const updatedTabs = updatedWindow?.tabs
            //     ? [...updatedWindow.tabs].sort((a, b) => a.index - b.index)
            //     : [];
            // if (updatedTabs.length > 0) {
            //     const nextIndex = Math.min(
            //         currentIndex,
            //         updatedTabs.length - 1,
            //     );
            //     selectedTab = updatedTabs[nextIndex];
            // } else {
            //     selectedTab = null;
            // }
        } else if (
            event.key === "Enter" &&
            isInNavigationMode &&
            selectedTab &&
            navEdgeSlideKind() === "window"
        ) {
            moveSelectedTabToNextWindow(event);
        } else if (
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
            const wl = sortedOpenWindows();
            if (wl.length === 0) return;

            if (navViewMode === "overview") {
                if (event.key === "ArrowLeft") {
                    overviewFocusedWindowIndex = Math.max(
                        0,
                        overviewFocusedWindowIndex - 1,
                    );
                    const win = wl[overviewFocusedWindowIndex];
                    const tabs = [...win.tabs].sort(
                        (a, b) => a.index - b.index,
                    );
                    selectedTab =
                        tabs.find((t) => t.active) ?? tabs[0] ?? selectedTab;
                } else if (event.key === "ArrowRight") {
                    overviewFocusedWindowIndex = Math.min(
                        wl.length - 1,
                        overviewFocusedWindowIndex + 1,
                    );
                    const win = wl[overviewFocusedWindowIndex];
                    const tabs = [...win.tabs].sort(
                        (a, b) => a.index - b.index,
                    );
                    selectedTab =
                        tabs.find((t) => t.active) ?? tabs[0] ?? selectedTab;
                } else if (event.key === "ArrowUp") {
                    const win = wl[overviewFocusedWindowIndex];
                    const tabs = [...win.tabs].sort(
                        (a, b) => a.index - b.index,
                    );
                    const refTab =
                        selectedTab?.windowId === win.id
                            ? selectedTab
                            : (tabs.find((t) => t.active) ?? tabs[0]);
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.max(0, idx - 1)];
                } else if (event.key === "ArrowDown") {
                    const win = wl[overviewFocusedWindowIndex];
                    const tabs = [...win.tabs].sort(
                        (a, b) => a.index - b.index,
                    );
                    const refTab =
                        selectedTab?.windowId === win.id
                            ? selectedTab
                            : (tabs.find((t) => t.active) ?? tabs[0]);
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.min(tabs.length - 1, idx + 1)];
                }
                return;
            }

            const nk = tabsViewRef?.getNavSlideKind?.() ?? navEdgeSlideKind();
            if (nk === "history") {
                if (event.key === "ArrowUp") {
                    tabsViewRef?.historyMoveSelection?.(-1);
                } else if (event.key === "ArrowDown") {
                    tabsViewRef?.historyMoveSelection?.(1);
                }
                return;
            }
            if (nk === "create") {
                return;
            }

            const totalSlides = wl.length + 2;
            if (event.key === "ArrowLeft") {
                navSlideIndex = Math.max(0, navSlideIndex - 1);
            } else if (event.key === "ArrowRight") {
                navSlideIndex = Math.min(totalSlides - 1, navSlideIndex + 1);
            } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                const win = wl[navSlideIndex - 1] ?? wl[0];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                const refTab =
                    selectedTab && selectedTab.windowId === win.id
                        ? selectedTab
                        : (tabs.find((t) => t.active) ?? tabs[0]);
                if (event.key === "ArrowUp" && tabs.length > 0) {
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.max(0, idx - 1)];
                } else if (event.key === "ArrowDown" && tabs.length > 0) {
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.min(tabs.length - 1, idx + 1)];
                }
            }
        } else if (
            !systemMenuIsOpen &&
            !settingsPageIsOpen &&
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                event.key,
            )
        ) {
            event.preventDefault();
            event.stopPropagation();
            enterTabSwitchingMode();
            await tabStore.init();
            const tabs = [...get(currentWindowTabs)].sort(
                (a, b) => a.index - b.index,
            );
            const windowsList = [...get(windows)]
                .filter((w) => w.tabs.length > 0)
                .sort((a, b) => a.id - b.id);
            const activeId = get(activeTabId);
            const activeWinId = get(activeWindowId);

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
        } else if (event.key === ",") {
            // (<) used to navigate to previous history item
            event.preventDefault();
            event.stopPropagation();
            history.back();
        } else if (event.key === ".") {
            // (>) used to navigate to next history item
            event.preventDefault();
            event.stopPropagation();
            history.forward();
        } else {
            let textSelection = window.getSelection().toString();
            if (textSelection.length > 0) {
                if (event.key === "c") {
                    navigator.clipboard.writeText(textSelection);
                }
                if (event.key === "g") {
                    window.open(
                        "https://www.google.com/search?q=" + textSelection,
                    );
                }
            }
        }
    }

    async function moveSelectedTabToNextWindow(event) {
        event.preventDefault();
        event.stopPropagation();
        if (navEdgeSlideKind() !== "window") return;
        const windowsList = [...get(windows)]
            .filter((w) => w.tabs.length > 0)
            .sort((a, b) => a.id - b.id);
        const currentWindowId = selectedTab.windowId;
        const currentWindowIndex = windowsList.findIndex(
            (w) => w.id === currentWindowId,
        );
        if (currentWindowIndex < 0 || windowsList.length < 2) return;
        const currentWindow = windowsList[currentWindowIndex];
        const tabs = [...currentWindow.tabs].sort((a, b) => a.index - b.index);
        const currentTabIndex = tabs.findIndex((t) => t.id === selectedTab.id);
        const nextWindowIndex = (currentWindowIndex + 1) % windowsList.length;
        const targetWindowId = windowsList[nextWindowIndex].id;
        await tabStore.moveTab(selectedTab.id, targetWindowId);
        const updatedWindows = get(windows);
        const updatedWindow = updatedWindows.find(
            (w) => w.id === currentWindowId,
        );
        const updatedTabs = updatedWindow?.tabs
            ? [...updatedWindow.tabs].sort((a, b) => a.index - b.index)
            : [];
        if (updatedTabs.length > 0) {
            const nextIndex = Math.min(currentTabIndex, updatedTabs.length - 1);
            selectedTab = updatedTabs[nextIndex];
        } else {
            selectedTab = null;
        }
    }

    function handleKeyup(event) {
        const isSpace = event.key === " " || event.code === "Space";
        if (isSpace) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
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

    function handleWheel(event) {
        if (tabMenuIsOpen || systemMenuIsOpen || settingsPageIsOpen) return;
        if (!isInNavigationMode && !event.metaKey) {
            if (showActiveTabInfo && event.deltaY > 0) {
                hideActiveTabInfo();
            }
            return;
        }

        if (isInNavigationMode) {
            const isVerticalScroll =
                Math.abs(event.deltaX) < Math.abs(event.deltaY);
            if (isVerticalScroll) {
                handleVerticalTabScroll(event.deltaY);
            } else {
                handleHorizontalCarouselScroll(event.deltaX);
            }
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const isVerticalScroll =
            Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            handleVerticalTabScroll(event.deltaY);
        } else {
            handleHorizontalCarouselScroll(event.deltaX);
        }
        event.preventDefault();
        event.stopPropagation();
    }

    let scrollDelta = 0;
    let scrollSelectDelta = 0;
    let scrollCarouselDelta = 0;
    let scrollEndTimeout = null;

    function handleVerticalTabScroll(scrollUpdate) {
        if (isInNavigationMode) {
            const wl = sortedOpenWindows();
            if (!wl.length) return;

            if (navViewMode === "overview") {
                const win = wl[overviewFocusedWindowIndex];
                if (!win?.tabs?.length) return;
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                const refTab =
                    selectedTab && selectedTab.windowId === win.id
                        ? selectedTab
                        : (tabs.find((t) => t.active) ?? tabs[0]);
                if (!refTab) return;
                const currentIndex = tabs.findIndex((t) => t.id === refTab.id);
                const idx = currentIndex >= 0 ? currentIndex : 0;
                scrollSelectDelta += scrollUpdate;
                if (
                    Math.abs(scrollSelectDelta) >= scrollVerticalThreshold
                ) {
                    const direction = scrollSelectDelta > 0 ? -1 : 1;
                    scrollSelectDelta = 0;
                    const nextIndex = Math.max(
                        0,
                        Math.min(tabs.length - 1, idx + direction),
                    );
                    selectedTab = tabs[nextIndex];
                }
                return;
            }

            const nk = navEdgeSlideKind();
            if (nk === "history" || nk === "create") return;

            const win = wl[navSlideIndex - 1];
            if (!win?.tabs?.length) return;

            const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
            const refTab =
                selectedTab && selectedTab.windowId === win.id
                    ? selectedTab
                    : (tabs.find((t) => t.active) ?? tabs[0]);
            if (!refTab) return;
            const currentIndex = tabs.findIndex((t) => t.id === refTab.id);
            const idx = currentIndex >= 0 ? currentIndex : 0;

            scrollSelectDelta += scrollUpdate;
            if (Math.abs(scrollSelectDelta) >= scrollVerticalThreshold) {
                const direction = scrollSelectDelta > 0 ? -1 : 1;
                scrollSelectDelta = 0;
                const nextIndex = Math.max(
                    0,
                    Math.min(tabs.length - 1, idx + direction),
                );
                selectedTab = tabs[nextIndex];
            }
        } else {
            chrome.runtime.sendMessage({
                type: "SCROLL",
                scrollDelta: scrollUpdate,
            });
        }
    }

    function handleHorizontalCarouselScroll(deltaX) {
        if (!isInNavigationMode) return;
        const wl = sortedOpenWindows();
        if (navViewMode === "overview") {
            if (wl.length < 2) return;
            scrollCarouselDelta += deltaX;
            if (Math.abs(scrollCarouselDelta) >= scrollHorizontalThreshold) {
                const step = scrollCarouselDelta > 0 ? -1 : 1;
                scrollCarouselDelta = 0;
                overviewFocusedWindowIndex = Math.max(
                    0,
                    Math.min(wl.length - 1, overviewFocusedWindowIndex + step),
                );
                const win = wl[overviewFocusedWindowIndex];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                selectedTab =
                    tabs.find((t) => t.active) ?? tabs[0] ?? selectedTab;
            }
            return;
        }
        const totalSlides = wl.length + 2;
        if (totalSlides < 2) return;
        scrollCarouselDelta += deltaX;
        if (Math.abs(scrollCarouselDelta) >= scrollHorizontalThreshold) {
            const step = scrollCarouselDelta > 0 ? -1 : 1;
            scrollCarouselDelta = 0;
            navSlideIndex = Math.max(
                0,
                Math.min(totalSlides - 1, navSlideIndex + step),
            );
        }
    }

    async function handleHorizontalMoveTabScroll(scrollUpdate) {
        console.log("handleHorizontalMoveTabScroll", scrollUpdate);
        const scrollThreshold = 300;
        const previousScrollDelta = scrollDelta;
        scrollDelta += scrollUpdate;
        if (Math.abs(scrollDelta) < scrollThreshold) {
            return;
        }

        if (scrollDelta >= scrollThreshold) {
            chromeService.closeTab(currentTab.id);
        } else if (scrollDelta <= -scrollThreshold) {
            //chromeService.moveTab(currentTab.id, targetWindowId);
        }

        scrollDelta = 0;
    }
</script>

<svelte:window
    on:keydown|capture={handleKeydown}
    on:keyup|capture={handleKeyup}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:contextmenu={handleRightClick}
    on:click={handleClick}
/>

{#if tabMenuIsOpen}
    <TabMenu
        tab={isInNavigationMode ? selectedTab : currentTab}
        onClose={() => {
            tabMenuIsOpen = false;
        }}
    />
{/if}
{#if helpMenuIsOpen}
    <HelpMenu onClose={() => (helpMenuIsOpen = false)} />
{/if}
{#if settingsPageIsOpen}
    <SettingsPage
        {settings}
        onChange={saveSettingsPatch}
        onClose={() => (settingsPageIsOpen = false)}
    />
{/if}
{#if systemMenuIsOpen}
    <SystemMenu />
{:else if isInNavigationMode && !tabMenuIsOpen}
    {#if !(omniboxOpenedStandalone && omniboxIsOpen)}
        <TabsView
            bind:this={tabsViewRef}
            includeEdgeSlides={true}
            windows={$windows}
            bind:currentTab
            bind:selectedTab
            bind:slideIndex={navSlideIndex}
            bind:viewMode={navViewMode}
            bind:overviewFocusedWindowIndex
            on:quicksave={async () => {
                if (!selectedTab) return;
                const url = await chromeService.copyTabUrl(selectedTab.id);
                if (url) await navigator.clipboard.writeText(url);
            }}
            on:quickfocus={async () => {
                if (!selectedTab) return;
                await chromeService.focusWindow(selectedTab.windowId);
                await tabStore.refreshState();
            }}
            on:quickclose={async () => {
                if (!selectedTab) return;
                await tabStore.closeTab(selectedTab.id);
                await tabStore.refreshState();
                selectedTab = currentTab;
            }}
            on:quickmenu={() => {
                tabMenuIsOpen = true;
            }}
            on:activatetab={async (e) => {
                const tab = e.detail?.tab;
                if (!tab?.id) return;
                await chromeService.activateTab(tab.id);
                isInNavigationMode = false;
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
                });
            }}
        />
    {/if}
    {#if omniboxIsOpen}
        <Omnibox
            windows={$windows}
            activeTabId={$activeTabId}
            bind:query={omniboxQuery}
            on:close={() => {
                omniboxIsOpen = false;
                omniboxOpenedStandalone = false;
                omniboxQuery = "";
            }}
        />
    {/if}
{:else if isInTabSwitchingMode && $currentWindowTabs.length > 0}
    <TabSwitchingModal
        currentWindowTabs={$currentWindowTabs}
        activeTabId={$activeTabId}
    />
{:else if (showActiveTabInfo || tabMenuIsOpen) && (isInNavigationMode ? (navEdgeSlideKind() === "history" || navEdgeSlideKind() === "create" ? null : selectedTab) : currentTab)}
    <div in:fly={{ y: 20, duration: 150 }} out:fly={{ y: 20, duration: 200 }}>
        <ActiveTabInfo
            tab={isInNavigationMode ? selectedTab : currentTab}
            on:menuRequest={() => {
                tabMenuIsOpen = true;
            }}
        />
    </div>
{/if}

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
