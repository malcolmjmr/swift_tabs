<script>
    import { onMount, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import Toolbar from "./components/Toolbar.svelte";
    import TabSwitchingModal from "./components/TabSwitchingModal.svelte";
    import {
        tabStore,
        currentWindowTabs,
        activeTabId,
        windows,
        activeWindowId,
    } from "./stores/tabStore";
    import { chromeService } from "./services/chromeApi";
    import TabsView from "./components/tabs_view/TabsView.svelte";
    import Omnibox from "./components/Omnibox.svelte";

    let isInNavigationMode = false;
    let omniboxIsOpen = false;
    let omniboxQuery = "";
    let tabMenuIsOpen = false;
    let systemMenuIsOpen = false;
    let toolbarIsOpen = false;
    let toolbarIsInFocus = false;

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
    }

    function addChromeRuntimeMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "TOOLBAR") {
                onToolbarMessage(message);
            } else if (message.type === "NAVIGATION_MODE") {
                onNavigationModeMessage(message);
            } else if (message.type === "TAB_SWITCHING_MODE") {
                onTabSwitchingModeMessage(message);
            } else if (message.type === "TABS_DATA_CHANGED") {
                onTabsDataChangedMessage();
            }
        });
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
    function onToolbarMessage(message) {
        toolbarIsOpen = message.open;
        if (toolbarIsOpen) {
            // set mouse cursor to crosshair
            document.body.style.cursor = "crosshair";
            mouseX = message.x;
            mouseY = message.y;
        } else {
            document.body.style.cursor = "default";
        }
        if (currentTab != message.tab) {
            currentTab = message.tab;
        }
    }

    async function onNavigationModeMessage(message) {
        isInNavigationMode = message.isInNavigationMode;
        if (isInNavigationMode) {
            await tabStore.refreshState();
        }
    }

    function handleRightClick(event) {
        /*
            determine if link, image or page is clicked
            if link => queue within tab (how should i store tab data?)
            if image => copy image url
            if page => open toolbar
        */

        if (toolbarIsOpen) {
            // send message to hide toolbar
            return;
        } else {
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

            if (settings.openToolbarWithMetaKey == isMetaKeyPressed) {
                event.preventDefault();
                event.stopPropagation();

                chrome.runtime.sendMessage({
                    type: "TOOLBAR",
                    open: true,
                    x: event.clientX,
                    y: event.clientY,
                });

                rightClickTimer = setTimeout(() => {
                    console.log("long press detected");
                }, longPressThreshold);
            }
        }
    }

    function handleMouseDown(event) {}

    function handleMouseUp(event) {
        if (event.button === 2) {
            // Right-click button
            clearTimeout(rightClickTimer);
            console.log("right click mouse up");
        }
        // Clear scroll-end timeout so we don't double-execute (mouseup fires for mouse, trackpad uses scroll-end)
        if (scrollEndTimeout) {
            clearTimeout(scrollEndTimeout);
            scrollEndTimeout = null;
        }
        executeScrollEndAction();
    }

    function handleClick(event) {
        chrome.runtime.sendMessage({
            type: "TOOLBAR",
            open: false,
        });
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
            } else if (event.key === "Escape" && isInTabSwitchingMode) {
                event.preventDefault();
                if (tabSwitchingDismissTimeout) {
                    clearTimeout(tabSwitchingDismissTimeout);
                    tabSwitchingDismissTimeout = null;
                }
                isInTabSwitchingMode = false;
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
        if (!toolbarIsInFocus && (isInNavigationMode || event.metaKey)) {
            let isVerticalScroll =
                Math.abs(event.deltaX) < Math.abs(event.deltaY);
            if (isVerticalScroll) {
                handleVerticalScroll(event.deltaY);
            } else {
                handleHorizontalScroll(event.deltaX);
            }
            event.preventDefault();
            event.stopPropagation();

            // Prevent default scrolling behavior
        }
    }

    let scrollDelta = 0;
    let scrollSelectDelta = 0;
    const SCROLL_SELECT_THRESHOLD = 33;
    let removeTabOnMouseUp = false;
    let moveTabOnMouseUp = false;
    let scrollEndTimeout = null;
    const SCROLL_END_DELAY_MS = 150; // Time without wheel events to consider scroll "ended"

    function executeScrollEndAction() {
        if (removeTabOnMouseUp) {
            console.log("remove tab");
            //chromeService.closeTab(activeTabId);
        } else if (moveTabOnMouseUp) {
            console.log("move tab");
            //chromeService.moveTab(activeTabId, targetWindowId);
        }
        removeTabOnMouseUp = false;
        moveTabOnMouseUp = false;
    }

    function handleVerticalScroll(scrollUpdate) {
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

    async function handleHorizontalScroll(scrollUpdate) {
        console.log("handleHorizontalScroll", scrollUpdate);
        const scrollThreshold = 300;
        const previousScrollDelta = scrollDelta;
        scrollDelta += scrollUpdate;
        if (Math.abs(scrollDelta) < scrollThreshold) {
            return;
        }

        // Reset scroll-end timer on each wheel event
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
            scrollEndTimeout = null;
            executeScrollEndAction();
        }, SCROLL_END_DELAY_MS);

        if (scrollDelta >= scrollThreshold) {
            chromeService.closeTab(currentTab.id);
        } else if (scrollDelta <= -scrollThreshold) {
            //chromeService.moveTab(currentTab.id, targetWindowId);
        }

        scrollDelta = 0;
    }

    function handleHotCornerMouseEnter() {
        toolbarIsOpen = true;
    }
</script>

<svelte:window
    on:keydown|capture={handleKeydown}
    on:keyup|capture={handleKeyup}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
/>

<div class="hot-corner" on:mouseenter={handleHotCornerMouseEnter}></div>
{#if toolbarIsOpen}
    <Toolbar {currentTab} bind:toolbarIsInFocus />
{:else if tabMenuIsOpen}
    <TabMenu />
{:else if systemMenuIsOpen}
    <SystemMenu />
{:else if isInNavigationMode}
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
    .toolbar-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        z-index: 999998;
    }

    .hot-corner {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 50px;
        height: 50px;

        z-index: 999998;
    }
</style>
