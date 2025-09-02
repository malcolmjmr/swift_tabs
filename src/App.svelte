<script>
    /*
        Todo:
        - Create invisible background to click out of toolbar 
    */

    // This will handle communication between the Svelte app and Chrome APIs

    import ActiveTabInfo from "./components/ActiveTabInfo.svelte"; // Import ActiveTabInfo
    import { onMount } from "svelte";
    import { tabStore } from "./stores/tabStore";

    let toolbarVisible = false;
    let mouseX = 0;
    let mouseY = 0;
    let gestureModeActive = false; // New flag for gesture mode
    let displayedTabsInfo = []; // To store tab info for display

    let rightClickTimer;
    const longPressThreshold = 500; // milliseconds

    onMount(async () => {
        // Listen for messages from the background script as early as possible
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "gestureMode") {
                // Changed from "deactivateGestureMode"
                gestureModeActive = message.active; // Update based on the message.active property
                if (!message.active) {
                    // Only hide toolbar/clear info if deactivating
                    toolbarVisible = false; // Hide any active widget
                    displayedTabsInfo = []; // Clear displayed info
                }
            } else if (message.type === "updateTabInfo") {
                displayedTabsInfo = message.tabs;
            }
        });
    });

    function handleRightClick(event) {
        if (!gestureModeActive) {
            // Right-click button
            event.preventDefault(); // Prevent default context menu initially

            if (toolbarVisible) {
                // If toolbar is visible, prevent showing another one
                // This also ensures context menu is suppressed while widget is open
                return;
            }

            // Check if any text is selected
            if (window.getSelection().toString().length > 0) {
                return;
            }

            // Start timer for long press
            rightClickTimer = setTimeout(() => {
                // Long press detected - activate Overview Widget
                mouseX = event.clientX;
                mouseY = event.clientY;
                toolbarVisible = true; // ToolbarVisible now controls Overview Widget
                gestureModeActive = false; // Ensure gesture mode is off for Overview Widget
                chrome.runtime.sendMessage({
                    type: "gestureMode",
                    active: false,
                });
            }, longPressThreshold);
        } else {
            // If gesture mode is active, do nothing
            gestureModeActive = false;
            return;
        }
    }

    function handleMouseDown(event) {
        if (gestureModeActive) {
            gestureModeActive = false;
            displayedTabsInfo = []; // Clear displayed info
            // Notify background script that gesture mode is inactive
            chrome.runtime.sendMessage({ type: "gestureMode", active: false });
        }
    }

    function handleMouseUp(event) {
        if (event.button === 2) {
            // Right-click button
            clearTimeout(rightClickTimer);
            if (!toolbarVisible && !gestureModeActive) {
                // Only if not already active from long press
                // Short press detected - activate Active Tab Info and Gesture Mode
                mouseX = event.clientX;
                mouseY = event.clientY;
                // For now, toolbarVisible will be used to show ActiveTabInfo
                toolbarVisible = true;
                gestureModeActive = true;
                // When gesture mode is activated, request initial tab info
                chrome.runtime.sendMessage({
                    type: "gestureMode",
                    active: true,
                });
                chrome.runtime.sendMessage({ type: "requestTabInfo" }); // Request initial tab info
            }
        }
    }

    function handleClick(event) {
        // Hide toolbar/overview widget when clicking outside
        if (
            toolbarVisible &&
            !event.target.closest(".active-tab-info-container")
        ) {
            // Use new class for targeting
            toolbarVisible = false;
            displayedTabsInfo = []; // Clear displayed info
        }
        // Deactivate gesture mode when clicking anywhere on the page
        if (gestureModeActive) {
            gestureModeActive = false;
            displayedTabsInfo = []; // Clear displayed info
            // Notify background script that gesture mode is inactive
            chrome.runtime.sendMessage({ type: "gestureMode", active: false });
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape" && (toolbarVisible || gestureModeActive)) {
            toolbarVisible = false;
            gestureModeActive = false;
            displayedTabsInfo = []; // Clear displayed info
            // Notify background script that gesture mode is inactive
            chrome.runtime.sendMessage({ type: "gestureMode", active: false });
        }
    }

    let lastWheelTime = 0;
    const wheelDebounceTime = 100; // milliseconds

    function handleWheel(event) {
        if (gestureModeActive) {
            event.preventDefault(); // Prevent default scroll behavior

            const currentTime = Date.now();
            if (currentTime - lastWheelTime < wheelDebounceTime) {
                return; // Debounce wheel events
            }
            lastWheelTime = currentTime;

            // Flip the direction: deltaY > 0 means scroll down (next tab), deltaY < 0 means scroll up (previous tab)
            const direction = event.deltaY > 0 ? "down" : "up";
            chrome.runtime.sendMessage({
                type: "navigateTabs",
                direction: direction,
            });
            chrome.runtime.sendMessage({ type: "requestTabInfo" }); // Request updated tab info after navigation
        }
    }
</script>

<svelte:window
    on:click={handleClick}
    on:keydown={handleKeydown}
    on:contextmenu={handleRightClick}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:wheel={handleWheel}
/>

{#if gestureModeActive}
    <ActiveTabInfo x={mouseX} y={mouseY} tabs={displayedTabsInfo} />
    <!-- Add debug statement for displayedTabsInfo -->
{:else if toolbarVisible}
    <!-- This will be for the Overview Widget later -->
    <!-- <Toolbar visible={toolbarVisible} x={mouseX} y={mouseY} /> -->
{/if}

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }
</style>
