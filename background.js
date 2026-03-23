
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onMessage.addListener(onRuntimeMessage);
chrome.tabs.onUpdated.addListener(onTabUpdated);





async function onInstalled() {
    console.log('Swift Tabs installed');
    // const tabs = (await chrome.tabs.query({ currentWindow: true }));
    // const activeTabIndex = tabs.findIndex(tab => tab.active);
    // const tab = tabs[activeTabIndex - 1];
    // chrome.tabs.reload(tab.id);

    chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
            if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
                //injectContentScript(tab.id);
                chrome.tabs.reload(tab.id);
            }
        }
    });
}

function onTabUpdated(tabId, changeInfo, tab) {
    //console.log('Tab updated', tabId, changeInfo, tab);
    chrome.runtime.sendMessage({
        type: 'TAB_UPDATED',
        tabId: tabId,
        changeInfo: changeInfo,
        tab: tab,
    });
}


function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["dist/content.js"]
    }).catch(e => {
        console.warn(`Could not inject content script into tab ${tab.id}:`, e);
    });
}

function onRuntimeMessage(message, sender, sendResponse) {
    if (message.type === "CHROME_API") {
        chromeApiHandlers[message.endpoint](message.data, sender)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
    } else if (message.type === 'SCROLL') {
        handleTabSwitch(message.scrollDelta, sender.tab.id);
    } else if (message.type === 'TAB_SWITCHED') {
        notifyActiveTabOfTabSwitchingMode();
    } else if (message.type === 'NAVIGATION_MODE') {
        onNavigationModeMessage(message);
    }
    return true; // Indicates that sendResponse will be called asynchronously
}

var popupWindowId = null;
var isInNavigationMode = false;
let scrollDelta = 0;
async function handleTabSwitch(scrollUpdate, tabId) {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab.id !== tabId) {
        return;
    }

    const scrollThreshold = 33;
    scrollDelta += scrollUpdate;
    if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });
    tabs.sort((a, b) => b.index - a.index);

    const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
    let newIndex = currentIndex;
    if (scrollDelta >= scrollThreshold) {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (scrollDelta <= -scrollThreshold) {
        newIndex = (currentIndex === 0) ? tabs.length - 1 : currentIndex - 1;
    }

    scrollDelta = 0;
    const newActiveTabId = tabs[newIndex].id;
    await chrome.tabs.update(newActiveTabId, { active: true });
    await notifyTabOfTabSwitchingMode(newActiveTabId);
}

async function notifyActiveTabOfTabSwitchingMode() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
        await notifyTabOfTabSwitchingMode(activeTab.id);
    }
}

async function notifyTabOfTabSwitchingMode(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, {
            type: "TAB_SWITCHING_MODE",
        });
    } catch (e) {
        // Content script may not be loaded (e.g. chrome:// pages)
    }
}


async function onNavigationModeMessage(message) {
    isInNavigationMode = message.isInNavigationMode;
    let tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
            type: "NAVIGATION_MODE",
            isInNavigationMode: isInNavigationMode,
        });
    }
}

async function broadcastTabsDataChanged() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "TABS_DATA_CHANGED",
                });
            } catch (e) {
                // Content script may not be loaded (e.g. chrome:// pages)
            }
        }
    }
}

// Helper function to get tabs in a window and current tab index
async function getTabsInWindow(windowId) {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    const activeTab = tabs.find(tab => tab.active);
    const activeTabIndex = activeTab ? tabs.indexOf(activeTab) : -1;
    return { tabs, activeTab, activeTabIndex };
}

const chromeApiHandlers = {

    async GET_CURRENT_TAB(_, { tab }) {
        console.log("GET_CURRENT_TAB", tab);
        return tab;
    },


    async GET_TAB({ tabId }) {
        return chrome.tabs.get(tabId);
    },

    async GET_TABS() {
        const windows = await chrome.windows.getAll({ populate: true });
        return windows.flatMap(w => w.tabs);
    },

    async GET_WINDOWS() {
        return chrome.windows.getAll({ populate: true });
    },

    async GET_CURRENT_WINDOW() {
        return chrome.windows.getCurrent({ populate: true });
    },

    async ACTIVATE_TAB({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tabId, { active: true });
        return tab;
    },

    async CLOSE_TAB({ tabId }) {
        await chrome.tabs.remove(tabId);
        broadcastTabsDataChanged();
        return { success: true };
    },

    async PIN_TAB({ tabId }) {
        const tab = await chrome.tabs.get(tabId);
        return chrome.tabs.update(tabId, { pinned: !tab.pinned });
    },

    async DUPLICATE_TAB({ tabId }) {
        return chrome.tabs.duplicate(tabId);
    },

    async RELOAD_TAB({ tabId }) {
        return chrome.tabs.reload(tabId);
    },

    async CREATE_TAB(options) {
        return chrome.tabs.create(options);
    },

    async MOVE_TAB({ tabId, targetWindowId }) {
        await chrome.tabs.move(tabId, { windowId: targetWindowId, index: -1 });
        broadcastTabsDataChanged();
        return { success: true };
    },

    async FOCUS_WINDOW({ windowId }) {
        await chrome.windows.update(windowId, { focused: true });
        return { success: true };
    }
};



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
