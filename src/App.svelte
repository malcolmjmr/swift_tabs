<script>
    import { onMount } from "svelte";
    import Toolbar from "./components/Toolbar.svelte";
    import TabPreviews from "./components/tab/TabPreviews.svelte";
    import { currentWindowTabs, activeTabId } from "./stores/tabStore";
    import { chromeService } from "./services/chromeApi";

    /*

        HotCorners (bottom left and bottom right)

        Toolbar (visible when not scrolling down, or when in gesture mode)
        - TabsView
        - ActiveTabLabel
        - MainToolbarActions (back, forward, create, tabs, more)
        - QuickAction
        - Menu

        Background variables
        - isInGesturemode
        - toolbarIsOpen

       

        Message Types
        - TOOLBAR (open, x, y)
        - SCROLL 

    */

    let isInGestureMode = false;
    let toolbarIsOpen = false;
    let toolbarIsInFocus = false;

    let mouseX = 0;
    let mouseY = 0;

    let settings = {};

    let rightClickTimer;
    const longPressThreshold = 500;

    onMount(async () => {
        console.log("App mounted");
        addChromeRuntimeMessageListener();
        document.addEventListener("wheel", handleWheel, { passive: false });
        loadSettings();
    });

    function addChromeRuntimeMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "TOOLBAR") {
                onToolbarMessage(message);
            } else if (message.type === "GESTURE_MODE") {
                onGestureModeMessage(message);
            }
        });
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

    function onToolbarMessage(message) {
        toolbarIsOpen = message.open;
        if (toolbarIsOpen) {
            mouseX = message.x;
            mouseY = message.y;
        }
        if (currentTab != message.tab) {
            currentTab = message.tab;
        }
    }

    function onGestureModeMessage(message) {
        isInGestureMode = message.isInGestureMode;
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

            const linkClicked = event.target.tagName === "A";
            if (linkClicked) {
                if (settings.queueLinkWithMetaKey == isMetaKeyPressed) {
                    console.log("queue link");
                    event.preventDefault();
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
        if (removeTabOnMouseUp) {
            console.log("remove tab");
            //chromeService.closeTab(activeTabId);
        } else if (moveTabOnMouseUp) {
            console.log("move tab");
            //chromeService.moveTab(activeTabId, targetWindowId);
        }
    }

    function handleClick(event) {
        chrome.runtime.sendMessage({
            type: "TOOLBAR",
            open: false,
        });
    }

    function handleKeydown(event) {
        let isNotInputField =
            !document.activeElement.matches("input, textarea");
        if (isNotInputField) {
            if (event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                chrome.runtime.sendMessage({
                    type: "GESTURE_MODE",
                    isInGestureMode: !isInGestureMode,
                });
                chrome.runtime.sendMessage({
                    type: "TOOLBAR",
                    open: !toolbarIsOpen,
                });
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

    function handleWheel(event) {
        if (!toolbarIsInFocus && (isInGestureMode || event.metaKey)) {
            let isVerticalScroll =
                Math.abs(event.deltaX) < Math.abs(event.deltaY);
            if (isVerticalScroll) {
                chrome.runtime.sendMessage({
                    type: "SCROLL",
                    scrollDelta: event.deltaY,
                });
            } else {
                handleHorizontalScroll(event.deltaX);
            }
            event.preventDefault();
            event.stopPropagation();

            // Prevent default scrolling behavior
        }
    }

    let scrollDelta = 0;
    let removeTabOnMouseUp = false;
    let moveTabOnMouseUp = false;
    async function handleHorizontalScroll(scrollUpdate) {
        const scrollThreshold = 60;
        const previousScrollDelta = scrollDelta;
        scrollDelta += scrollUpdate;
        if (Math.abs(scrollDelta) < scrollThreshold) {
            if (previousScrollDelta > scrollThreshold) {
                removeTabOnMouseUp = false;
            } else if (previousScrollDelta < -scrollThreshold) {
                moveTabOnMouseUp = false;
            }
        } else {
            if (scrollDelta >= scrollThreshold) {
                removeTabOnMouseUp = true;
            } else if (scrollDelta <= -scrollThreshold) {
                moveTabOnMouseUp = true;
            }
        }
    }
</script>

<svelte:window
    on:keydown={handleKeydown}
    on:contextmenu={handleRightClick}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
/>

{#if toolbarIsOpen}
    <Toolbar {currentTab} bind:toolbarIsInFocus />
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
</style>
