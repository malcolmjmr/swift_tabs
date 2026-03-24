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

    let isInNavigationMode = false;
    let omniboxIsOpen = false;
    let omniboxQuery = "";
    let tabMenuIsOpen = false;
    let systemMenuIsOpen = false;

    const TAB_SWITCHING_DISMISS_MS = 1500;
    let isInTabSwitchingMode = false;
    let tabSwitchingDismissTimeout = null;

    let mouseX = 0;
    let mouseY = 0;

    let settings = {};

    let rightClickTimer;
    const longPressThreshold = 500;

    onMount(async () => {
        console.log("App mounted");
        document.addEventListener("wheel", handleWheel, { passive: false });

        await tabStore.init();
        await recentActionsStore.init();
        addChromeRuntimeMessageListener();
        fetchTabInfo();
        loadSettings();
    });

    onDestroy(() => {
        document.removeEventListener("wheel", handleWheel, { passive: false });
    });

    async function fetchTabInfo() {
        console.log("fetchTabInfo");
        currentTab = await chromeService.getCurrentTab();
        selectedTab = currentTab;
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
        if (activeTabInfoDismissTimeout)
            clearTimeout(activeTabInfoDismissTimeout);
        activeTabInfoDismissTimeout = setTimeout(() => {
            showActiveTabInfo = false;
            activeTabInfoDismissTimeout = null;
        }, ACTIVE_TAB_INFO_DISMISS_MS);
    }

    function hideActiveTabInfo() {
        showActiveTabInfo = false;
        if (activeTabInfoDismissTimeout) {
            clearTimeout(activeTabInfoDismissTimeout);
            activeTabInfoDismissTimeout = null;
        }
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

    const ACTIVE_TAB_INFO_DISMISS_MS = 3000;
    let showActiveTabInfo = false;
    let activeTabInfoDismissTimeout = null;

    async function onNavigationModeMessage(message) {
        isInNavigationMode = message.isInNavigationMode;
        if (isInNavigationMode) {
            await tabStore.refreshState();
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
            tabMenuIsOpen = false;
            systemMenuIsOpen = false;
        }
    }

    async function handleKeydown(event) {
        // is input field or contenteditable istrue

        let isNotInputField =
            !document.activeElement.matches("input, textarea");
        let isNotContentEditable = !document.activeElement.isContentEditable;

        if (isNotInputField && isNotContentEditable) {
            const isPrintableChar =
                event.key.length === 1 &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.metaKey &&
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
                (event.key === "a" || event.key === "A") &&
                !tabMenuIsOpen &&
                (isInNavigationMode ? selectedTab : currentTab)
            ) {
                // "a" for actions — open Tab Menu anytime (not in input)
                event.preventDefault();
                event.stopPropagation();
                tabMenuIsOpen = true;
            } else if (
                event.key === "Meta" &&
                isInNavigationMode &&
                selectedTab &&
                !tabMenuIsOpen
            ) {
                event.preventDefault();
                tabMenuIsOpen = true;
            } else if (
                isPrintableChar &&
                isInNavigationMode &&
                !omniboxIsOpen &&
                window.getSelection().toString().length === 0
            ) {
                event.preventDefault();
                event.stopPropagation();
                omniboxQuery = event.key;
                omniboxIsOpen = true;
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
                if (isInTabSwitchingMode) {
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
        if (!isInNavigationMode && !event.metaKey) {
            if (showActiveTabInfo && event.deltaY > 0) {
                hideActiveTabInfo();
            } else if (!showActiveTabInfo && event.deltaY < 0 && currentTab) {
                showActiveTabInfoForCurrentTab();
            }
        }
        if (isInNavigationMode || event.metaKey) {
            let isVerticalScroll =
                Math.abs(event.deltaX) < Math.abs(event.deltaY);
            if (isVerticalScroll) {
                // handle vertical scroll for tab navigation
                handleVerticalTabScroll(event.deltaY);
            } else {
                // handle horizontal scroll for window navigation
            }
            event.preventDefault();
            event.stopPropagation();

            // Prevent default scrolling behavior
        }
    }

    let scrollDelta = 0;
    let scrollSelectDelta = 0;
    const SCROLL_SELECT_THRESHOLD = 33;
    let scrollEndTimeout = null;

    function handleVerticalTabScroll(scrollUpdate) {
        if (isInNavigationMode && currentTab) {
            const windowsList = get(windows) || [];
            const window = windowsList.find(
                (w) => w.id === currentTab.windowId,
            );
            if (!window?.tabs?.length) return;

            const tabs = [...window.tabs].sort((a, b) => a.index - b.index);
            const refTab = selectedTab || currentTab;
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
{#if systemMenuIsOpen}
    <SystemMenu />
{:else if isInNavigationMode && !tabMenuIsOpen}
    <TabsView windows={$windows} bind:currentTab bind:selectedTab />
    {#if omniboxIsOpen}
        <Omnibox
            bind:query={omniboxQuery}
            on:close={() => {
                omniboxIsOpen = false;
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
