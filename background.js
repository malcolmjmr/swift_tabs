// Background script for Swift Tabs
// This will handle communication between the Svelte app and Chrome APIs


chrome.runtime.onInstalled.addListener(() => {
    console.log('Swift Tabs installed');
    chrome.tabs.query({}).then(tabs => {
        // Inject the content script into all existing tabs on install/update
        for (const tab of tabs) {
            chrome.tabs.reload(tab.id);
            // // Only inject into tabs with a valid URL (not chrome://, etc.)
            // if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
            //     console.log(`Injecting content script into tab ${tab.id}`);
            //     chrome.scripting.executeScript({
            //         target: { tabId: tab.id },
            //         files: ["dist/content.js"]
            //     }).catch(e => {
            //         // Ignore errors for restricted pages
            //         console.warn(`Could not inject content script into tab ${tab.id}:`, e);
            //     });
            // }
        }
    });
});


// Helper function to get tabs in a window and current tab index
async function getTabsInWindow(windowId) {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    const activeTab = tabs.find(tab => tab.active);
    const activeTabIndex = activeTab ? tabs.indexOf(activeTab) : -1;
    return { tabs, activeTab, activeTabIndex };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "gestureMode") {
        (async () => {
            const tabs = await chrome.tabs.query({}); // Query all tabs
            const gestureModeActive = message.active;

            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { type: "gestureMode", active: gestureModeActive, }).catch(e => console.error("Error sending gesture mode toggle message:", e));
            }
            sendResponse({ success: true });
        })();
        return true; // Will respond asynchronously
    } else if (message.type === "verticalScrollInGestureMode") {
        handleVerticalScrollInGestureMode(message);
        return true;
    } else if (message.type === "navigateTabs") {
        (async () => {
            const { tabs, activeTabIndex } = await getTabsInWindow(sender.tab.windowId);

            let nextIndex = activeTabIndex;
            if (message.direction === "up") {
                nextIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
            } else if (message.direction === "down") {
                nextIndex = (activeTabIndex + 1) % tabs.length;
            }

            const nextTab = tabs[nextIndex];
            if (nextTab) {
                await chrome.tabs.update(nextTab.id, { active: true });
                // Send updated tab info back to the newly active tab's content script
                const updatedTabsInfo = await getTabsInfoForDisplay(nextTab.id, tabs);
                chrome.tabs.sendMessage(nextTab.id, { type: "updateTabInfo", tabs: updatedTabsInfo }).catch(e => console.error("Error sending tab info update:", e));
            }
        })();
    } else if (message.type === "requestTabInfo") {
        (async () => {
            console.log("Background.js: Received requestTabInfo from tab:", sender.tab.id);
            const { tabs, activeTab } = await getTabsInWindow(sender.tab.windowId);
            if (activeTab) {
                const updatedTabsInfo = await getTabsInfoForDisplay(activeTab.id, tabs);
                console.log("Background.js: Sending initial tab info to tab:", sender.tab.id, "Tabs:", updatedTabsInfo);
                chrome.tabs.sendMessage(sender.tab.id, { type: "updateTabInfo", tabs: updatedTabsInfo }).catch(e => console.error("Error sending initial tab info:", e));
            }
        })();
    }
    return true; // Indicates that sendResponse will be called asynchronously
});

async function getTabsInfoForDisplay(activeTabId, allTabsInWindow) {
    const activeTab = allTabsInWindow.find(tab => tab.id === activeTabId);
    if (!activeTab) return null; // Should not happen

    const activeTabIndex = allTabsInWindow.indexOf(activeTab);

    const tabsInfo = [];
    // Active tab
    tabsInfo.push({ ...activeTab, isActive: true });

    // Adjacent tabs (one above, one below)
    if (allTabsInWindow.length > 1) {
        const prevIndex = (activeTabIndex - 1 + allTabsInWindow.length) % allTabsInWindow.length;
        const nextIndex = (activeTabIndex + 1) % allTabsInWindow.length;

        if (prevIndex !== activeTabIndex) {
            tabsInfo.unshift({ ...allTabsInWindow[prevIndex], isActive: false });
        }
        if (nextIndex !== activeTabIndex) {
            tabsInfo.push({ ...allTabsInWindow[nextIndex], isActive: false });
        }
    }
    return tabsInfo;
}

let scrollY = 0;

async function handleVerticalScrollInGestureMode({ deltaY }) {

    const verticalSwipeThreshold = 60;
    const distance = Math.abs(deltaY);

    const swipeThresholdNotMet = distance < verticalSwipeThreshold;

    if (swipeThresholdNotMet) {
        return;
    }

    const currentTab = (await chrome.tabs.query({
        active: true,
        currentWindow: true
    }))[0];

    // if (currentTab.id !== event.tabId) {
    //     return;
    // }



    const nextIndex = currentTab.index + (SCROLL.y > 0 ? -1 : 1);
    const nextTab = (await chrome.tabs.query({ index: nextIndex, currentWindow: true }))[0];

    if (nextTab) {
        chrome.tabs.update(nextTab.id, { active: true });
    }



}