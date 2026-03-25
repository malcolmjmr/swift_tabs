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

    let isInNavigationMode = false;
    let omniboxIsOpen = false;
    let omniboxQuery = "";
    let omniboxOpenedStandalone = false; // true when "o" opened it from outside nav mode
    let tabMenuIsOpen = false;
    let systemMenuIsOpen = false;
    let helpMenuIsOpen = false;

    const TAB_SWITCHING_DISMISS_MS = 1500;
    let isInTabSwitchingMode = false;
    let tabSwitchingDismissTimeout = null;

    let mouseX = 0;
    let mouseY = 0;

    let settings = {};

    let rightClickTimer;
    const longPressThreshold = 500;
    let lastDocumentTitle = "";

    onMount(async () => {
        console.log("App mounted");
        document.addEventListener("wheel", handleWheel, { passive: false });
        document.addEventListener("click", handleDocumentClick);

        await tabStore.init();
        await recentActionsStore.init();
        addChromeRuntimeMessageListener();
        fetchTabInfo();
        loadSettings();
    });

    onDestroy(() => {
        document.removeEventListener("wheel", handleWheel, { passive: false });
        document.removeEventListener("click", handleDocumentClick);
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
            const settingsIsEmpty =
                true ||
                data.settings == null ||
                Object.keys(data.settings).length == 0;
            settings = settingsIsEmpty
                ? {
                      toolbarInPopup: false,
                      openToolbarWithMetaKey: false,
                      queueLinkWithMetaKey: false,
                      copyImageWithMetaKey: false,
                      defaultView: "windows",
                  }
                : data.settings;
        });
    }

    let currentTab = null;
    let selectedTab = null;

    /** Carousel window index in TabsView (sorted open windows); see tabs_view/TabsView.svelte */
    let navCarouselIndex = 0;

    let showActiveTabInfo = false;

    function sortedOpenWindows() {
        return [...get(windows)]
            .filter((w) => w.tabs?.length > 0)
            .sort((a, b) => a.id - b.id);
    }

    async function onNavigationModeMessage(message) {
        isInNavigationMode = message.isInNavigationMode;
        if (isInNavigationMode) {
            await tabStore.refreshState();
            const wl = sortedOpenWindows();
            const idx = currentTab
                ? wl.findIndex((w) => w.id === currentTab.windowId)
                : -1;
            navCarouselIndex = idx >= 0 ? idx : 0;
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
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.shiftKey
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
            !helpMenuIsOpen
        );
    }

    async function handleKeydown(event) {
        if (isInTypingContext()) return;

        const isPrintableChar =
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.shiftKey &&
            ![
                " ",
                "Enter",
                "Escape",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Delete",
                "Backspace",
                "Tab",
            ].includes(event.key);

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
            !helpMenuIsOpen
        ) {
            event.preventDefault();
            event.stopPropagation();
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
        } else if (
            (event.key === "a" ||
                event.key === "A" ||
                event.key === "m" ||
                event.key === "M") &&
            noModifiersStrict(event) &&
            !tabMenuIsOpen &&
            !helpMenuIsOpen &&
            (isInNavigationMode ? selectedTab : currentTab)
        ) {
            event.preventDefault();
            event.stopPropagation();
            tabMenuIsOpen = true;
        } else if (
            event.key === "Meta" &&
            isInNavigationMode &&
            selectedTab &&
            !tabMenuIsOpen &&
            !helpMenuIsOpen
        ) {
            event.preventDefault();
            tabMenuIsOpen = true;
        } else if (
            isPrintableChar &&
            isInNavigationMode &&
            !omniboxIsOpen &&
            !helpMenuIsOpen &&
            window.getSelection().toString().length === 0
        ) {
            event.preventDefault();
            event.stopPropagation();
            omniboxQuery = event.key;
            omniboxIsOpen = true;
            omniboxOpenedStandalone = false;
        } else if (event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            if (isInNavigationMode && selectedTab) {
                chromeService.activateTab(selectedTab.id);
                isInNavigationMode = false;
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode,
                });
            } else {
                chrome.runtime.sendMessage({
                    type: "NAVIGATION_MODE",
                    isInNavigationMode: !isInNavigationMode,
                });
            }
        } else if (event.key === "Escape") {
            if (helpMenuIsOpen) {
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
            selectedTab
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
                const currentIndex = tabs.findIndex(
                    (t) => t.id === selectedTab.id,
                );
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
                selectedTab
            ) {
                moveSelectedTabToNextWindow(event);
            } else if (
                isInNavigationMode &&
                !tabMenuIsOpen &&
                !omniboxIsOpen &&
                !helpMenuIsOpen &&
                ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                    event.key,
                )
            ) {
                event.preventDefault();
                event.stopPropagation();
                const wl = sortedOpenWindows();
                if (wl.length === 0) return;
                const win = wl[navCarouselIndex] ?? wl[0];
                const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
                const refTab =
                    selectedTab && selectedTab.windowId === win.id
                        ? selectedTab
                        : tabs.find((t) => t.active) ?? tabs[0];
                if (event.key === "ArrowUp" && tabs.length > 0) {
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.max(0, idx - 1)];
                } else if (event.key === "ArrowDown" && tabs.length > 0) {
                    const cur = tabs.findIndex((t) => t.id === refTab?.id);
                    const idx = cur >= 0 ? cur : 0;
                    selectedTab = tabs[Math.min(tabs.length - 1, idx + 1)];
                } else if (event.key === "ArrowLeft" && wl.length > 0) {
                    navCarouselIndex =
                        (navCarouselIndex - 1 + wl.length) % wl.length;
                } else if (event.key === "ArrowRight" && wl.length > 0) {
                    navCarouselIndex = (navCarouselIndex + 1) % wl.length;
                }
            } else if (
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
                    const currentIndex = tabs.findIndex(
                        (t) => t.id === activeId,
                    );
                    const idx = currentIndex >= 0 ? currentIndex : 0;
                    const prevIndex = (idx - 1 + tabs.length) % tabs.length;
                    await chromeService.activateTab(tabs[prevIndex].id);
                    await tabStore.refreshState();
                    chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
                } else if (event.key === "ArrowDown" && tabs.length > 0) {
                    const currentIndex = tabs.findIndex(
                        (t) => t.id === activeId,
                    );
                    const idx = currentIndex >= 0 ? currentIndex : 0;
                    const nextIndex = (idx + 1) % tabs.length;
                    await chromeService.activateTab(tabs[nextIndex].id);
                    await tabStore.refreshState();
                    chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
                } else if (
                    event.key === "ArrowLeft" &&
                    windowsList.length > 0
                ) {
                    const currentIndex = windowsList.findIndex(
                        (w) => w.id === activeWinId,
                    );
                    const idx = currentIndex >= 0 ? currentIndex : 0;
                    const prevIndex =
                        (idx - 1 + windowsList.length) % windowsList.length;
                    await chromeService.focusWindow(windowsList[prevIndex].id);
                    await tabStore.refreshState();
                    chrome.runtime.sendMessage({ type: "TAB_SWITCHED" });
                } else if (
                    event.key === "ArrowRight" &&
                    windowsList.length > 0
                ) {
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
        if (event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }

    function handleWheel(event) {
        if (tabMenuIsOpen) return;
        if (!isInNavigationMode && !event.metaKey) {
            if (showActiveTabInfo && event.deltaY > 0) {
                hideActiveTabInfo();
            }
        }
        if (isInNavigationMode || event.metaKey) {
            let isVerticalScroll =
                Math.abs(event.deltaX) < Math.abs(event.deltaY);
            if (isVerticalScroll) {
                handleVerticalTabScroll(event.deltaY);
            } else {
                handleHorizontalCarouselScroll(event.deltaX);
            }
            event.preventDefault();
            event.stopPropagation();

            // Prevent default scrolling behavior
        }
    }

    let scrollDelta = 0;
    let scrollSelectDelta = 0;
    let scrollCarouselDelta = 0;
    const SCROLL_SELECT_THRESHOLD = 33;
    let scrollEndTimeout = null;

    function handleVerticalTabScroll(scrollUpdate) {
        if (isInNavigationMode) {
            const wl = sortedOpenWindows();
            if (!wl.length) return;
            const win = wl[navCarouselIndex] ?? wl[0];
            if (!win?.tabs?.length) return;

            const tabs = [...win.tabs].sort((a, b) => a.index - b.index);
            const refTab =
                selectedTab && selectedTab.windowId === win.id
                    ? selectedTab
                    : tabs.find((t) => t.active) ?? tabs[0];
            if (!refTab) return;
            const currentIndex = tabs.findIndex((t) => t.id === refTab.id);
            const idx = currentIndex >= 0 ? currentIndex : 0;

            scrollSelectDelta += scrollUpdate;
            if (Math.abs(scrollSelectDelta) >= SCROLL_SELECT_THRESHOLD) {
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
        if (wl.length < 2) return;
        scrollCarouselDelta += deltaX;
        if (Math.abs(scrollCarouselDelta) >= SCROLL_SELECT_THRESHOLD) {
            const step = scrollCarouselDelta > 0 ? 1 : -1;
            scrollCarouselDelta = 0;
            navCarouselIndex =
                (navCarouselIndex + step + wl.length) % wl.length;
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
{#if systemMenuIsOpen}
    <SystemMenu />
{:else if isInNavigationMode && !tabMenuIsOpen}
    {#if !(omniboxOpenedStandalone && omniboxIsOpen)}
        <TabsView
            windows={$windows}
            bind:currentTab
            bind:selectedTab
            bind:carouselIndex={navCarouselIndex}
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
{:else if (showActiveTabInfo || tabMenuIsOpen) && (isInNavigationMode ? selectedTab : currentTab)}
    <div in:fly={{ y: 20, duration: 150 }} out:fly={{ y: 20, duration: 200 }}>
        <ActiveTabInfo
            tab={isInNavigationMode ? selectedTab : currentTab}
            mode="auto"
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
        z-index: 999999;
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
