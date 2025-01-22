let KEYS = [];
let SCROLL = { x: 0, y: 0 };

chrome.runtime.onInstalled.addListener(() => {
    saveDefaults();
    addContentScriptToAllTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYSTEM_SCROLL') {
        handleSystemScroll({ 
            tabId: sender.tab.id,
            ...message, 
        });
    }
  return true;
});

async function saveDefaults() {
    chrome.storage.local.set({
        settings: {
            keys: {
                primaryKey: 'altKey',
                secondaryKey: 'ctrltKey',
                tertiaryKey: 'shiftKey',
            }
        }
    });
}

async function addContentScriptToAllTabs() {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    });
}

async function handleSystemScroll(event) {

    const settings = await getSettings();
    const { primaryKey, secondaryKey, tertiaryKey } = settings.keys;

    const isWindowAction = KEYS.includes(primaryKey) && KEYS.includes(secondaryKey) && KEYS.includes(tertiaryKey);
    const isTabAction = KEYS.includes(primaryKey) && KEYS.includes(secondaryKey);
    const isTabSwitch = KEYS.includes(primaryKey);
    const isWindowSwitch = KEYS.includes(secondaryKey);
    const isTabSelection = KEYS.includes(tertiaryKey);

    proccessInputData(event);

    if (isWindowAction) {
        
        handleWindowAction(event);

    } else if (isTabAction) {

        handleTabAction(event);

    } else if (isTabSwitch) {
        
        handleTabSwitch(event);

    } else if (isWindowSwitch) {
        
        handleWindowSwitch(event);

    } else if (isTabSelection) {
            
        handleTabSelection(event);
    }
}

async function proccessInputData(event) {

    if (event.keys != KEYS) {
        KEYS = event.keys;
        SCROLL = { x: 0, y: 0 };
    }


    const xChanged = Math.abs(event.deltaX) > 5;
    const yChanged = Math.abs(event.deltaY) > 5;

    if (xChanged && SCROLL.y != 0) {
        SCROLL.y = 0;
    }

    if (yChanged && SCROLL.x != 0) {
        SCROLL.x = 0;
    }

    const xDirectionChanged = SCROLL.x * event.deltaX < 0;
    const yDirectionChanged = SCROLL.y * event.deltaY < 0;

    if (xDirectionChanged) {
        SCROLL.x = 0;
    }
    if (yDirectionChanged) {   
        SCROLL.y = 0;
    }

    if (xChanged) { 
        SCROLL.x += event.deltaX;
    } else if (yChanged) {
        SCROLL.y += event.deltaY;
    }
    
}


async function handleTabSwitch(event) {

    /*
    * Vertical swipe navigates to adjacent tab
    * Horizontal swipe navigates tab history 
    */

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;
    const swipeThresholdNotMet = (
        (Math.abs(SCROLL.x) < horizontalSwipeThreshold) 
        || (Math.abs(SCROLL.y) < verticalSwipeThreshold)
    );
    if (swipeThresholdNotMet) {
        return;
    } 

    const [currentTab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
    });

    if (currentTab.id !== event.tabId) {
        return;
    }

    const isVerticalSwipe = Math.abs(SCROLL.y) > Math.abs(SCROLL.x);
    const isHorizontalSwipe = Math.abs(SCROLL.x) > Math.abs(SCROLL.y);

    if (isVerticalSwipe) {

        const tabs = await chrome.tabs.query({ currentWindow: true });
        tabs.sort((a, b) => {
            return a.index - b.index;
        });

        const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
        const nextIndex = currentIndex + (SCROLL.y > 0 ? 1 : -1);
        const nextTab = tabs[nextIndex];

        if (nextTab) {
            chrome.tabs.update(nextTab.id, { active: true });
        }

    } else if (isHorizontalSwipe) {

        const swipeLeft = SCROLL.x > 0;
        const swipeRight = SCROLL.x < 0;

        if (swipeLeft) { 
            
            const canGoBack = await chrome.tabs.executeScript(currentTab.id, {
                code: 'window.history.length > 1;'
            });

            if (canGoBack) { // Navigate to previous tab history item
                
                chrome.tabs.executeScript(currentTab.id, {
                    code: 'window.history.back();'
                });

            } else { // Navigate to previous tab

                const tabs = await chrome.tabs.query({ currentWindow: true });
                tabs.sort((a, b) => {
                    return a.lastAccessed - b.lastAccessed;
                });

                const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
                const nextIndex = currentIndex + 1;
                const nextTab = tabs[nextIndex];

                if (nextTab) {
                    chrome.tabs.update(nextTab.id, { active: true });
                }
            }
            
        } else if (swipeRight) {
            
            const canGoForward = await chrome.tabs.executeScript(currentTab.id, {
                code: 'window.history.canGoforward();'
            });

            if (canGoForward) { // Navigate to next tab history item
            
                chrome.tabs.executeScript(currentTab.id, {
                    code: 'window.history.forward();'
                });

            } else { // Navigate to next tab queue item 
            
                const tabData = await getTabData(currentTab.id);
                if (tabData.queue.length > 0) {
                    const { url } = tabData.queue.shift();
                    chrome.tabs.update(currentTab.id, { url: url });
                }

            }
        }
    }

    SCROLL = { x: 0, y: 0 };

}

async function handleWindowSwitch(event) {

    /*
    * Vertical swipe navigates to adjacent window
    * Horizontal swipe navigates window history 
    */

}

async function handleTabSelection(event) {

    /*
    * Swipe to select or unselect adjacent tabs
    */

    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;

    const swipeThreshold = 60;
    const swipeThresholdNotMet = (Math.abs(SCROLL.x) < swipeThreshold) && (Math.abs(SCROLL.y) < swipeThreshold);
    if (swipeThresholdNotMet) {
        return;
    } else {
        SCROLL = { x: 0, y: 0 };
    }

    const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });


    const selectedTabs = await chrome.tabs.query({
        highlighted: true,
        currentWindow: true
    });
    selectedTabs.sort((a, b) => {   
        return a.index - b.index;
    });

    const currentIndex = selectedTabs.findIndex(tab => tab.id === currentTab.id);
    if (currentIndex === 0) {
        const lastSelectedTab = selectedTabs[selectedTabs.length - 1];
        if (swipeUp) {
            chrome.tabs.update(lastSelectedTab.id, { 
                highlighted: false 
            });
        } else if (swipeDown) {
            const nextTab = lastSelectedTab.index + 1;
            chrome.tabs.updated(nextTab, {
                highlighted: true
            });
        }
    } else if (currentIndex === selectedTabs.length - 1) {
        const firstSelectedTab = selectedTabs[0];
        if (swipeUp) {
            const nextTab = firstSelectedTab.index - 1;
            chrome.tabs.update(nextTab.id, {
                highlighted: true
            });
        } else if (swipeDown) {
            chrome.tabs.update(firstSelectedTab, {
                highlighted: false
            });
        }
    }
}

async function handleTabAction(event) {
    /*
    * Vertical swipe to move tab to adjacent index
    * Left swipe to close and right swipe move tab to new window
    */


    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;
    const swipeLeft = SCROLL.x > 0;
    const swipeRight = SCROLL.x < 0;

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;

    const swipeThresholdNotMet = (
        (Math.abs(SCROLL.x) < horizontalSwipeThreshold) 
        || (Math.abs(SCROLL.y) < verticalSwipeThreshold)
    );

    if (swipeThresholdNotMet) {
        return;
    } 

    const [currentTab] = await chrome.tabs.query({      
        active: true,
        currentWindow: true
    });

    if (swipeUp) {
        await chrome.tabs.move(currentTab.id, { index: currentTab.index - 1 });
    } else if (swipeDown) {
        await chrome.tabs.move(currentTab.id, { index: currentTab.index + 1 });
    } else if (swipeLeft) {
        await chrome.tabs.remove(currentTab.id);
    } else if (swipeRight) {
        const newWindow = await chrome.windows.create({});
        await chrome.tabs.move(currentTab.id, { windowId: newWindow.id });
    }

    SCROLL = { x: 0, y: 0 };


}

async function handleWindowAction(event) {

    /*
    * Swipe up to consolidate tabs
    * Swipe down to clear tabs
    * Swipe left to merge windows
    * Swipe right to tabs into new windows
    */

    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;
    const swipeLeft = SCROLL.x > 0;
    const swipeRight = SCROLL.x < 0;

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;

    const swipeThresholdNotMet = (
        (Math.abs(SCROLL.x) < horizontalSwipeThreshold) 
        || (Math.abs(SCROLL.y) < verticalSwipeThreshold)
    );

    if (swipeThresholdNotMet) {
        return;
    } 

    if (swipeUp) {
        await consolidateTabs();
    } else if (swipeDown) {
        await clearTabs();
    } else if (swipeLeft) {
        await mergeWindows();
    } else if (swipeRight) {
        await splitWindow(); 
    }

    SCROLL = { x: 0, y: 0 };

}

async function consolidateTabs() {
    
    /*
    * Consolidate all open tabs in the current window into a single tab with a queue
    */


    let tabs = await chrome.tabs.query({ currentWindow: true });
    tabs.sort((a, b) => {
        return a.index - b.index;
    });

    const firstTab = tabs.shift();
    let queue = [];
    tabs.forEach(tab => {
        queue.push({ url: tab.url });
        const tabData = getTabData(tab.id);
        if (tabData.queue) {
            queue = queue.concat(tabData.queue);
        }
        removeTabData(tab.id);
        chrome.tabs.remove(tab.id);
    });

    setTabData(firstTab.id, {
        title: firstTab.title,
        url: firstTab.url,
        favIcon: firstTab.favIconUrl,
        queue 
    });
    
}

async function clearTabs() {
    
    /*
    * Close all tabs in the current window and open a new tab 
    */

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const newTab = await chrome.tabs.create({});
    chrome.tabs.update(newTab.id, { active: true });
    tabs.forEach(tab => {
        chrome.tabs.remove(tab.id);
    });
}

async function mergeWindows() {

    /*
    * Merge all open windows into the current window
    */

    const windows = await chrome.windows.getAll({ populate: true });
    windows.forEach(window => {

        if (window.id !== chrome.windows.WINDOW_ID_CURRENT) {
            // Todo: create tab group for each window
            window.tabs.forEach(tab => {
                chrome.tabs.move(tab.id, { windowId: chrome.windows.WINDOW_ID_CURRENT, index: -1 });
            });
            chrome.windows.remove(window.id);
            // Todo: handle tab groups
        }
    });

}

async function splitWindow() {
    
    /*
    * Move tab groups to new windows 
    */

    const tabGroups = await chrome.tabGroups.query({});

    for (const tabGroup of tabGroups) {
        const window = await chrome.windows.create({ });
        chrome.tabGroups.move(tabGroup.id, { windowId: window.id });
    }
}


const TAB_KEY_PREFIX = 'tab-';

async function getTabData(tabId) {
    return await getData(TAB_KEY_PREFIX + tabId);
}

async function removeTabData(tabId) {
    await storeData({
        [TAB_KEY_PREFIX + tabId]: null
    });
}

async function setTabData(tabId, data) {
    const key = TAB_KEY_PREFIX + tabId;
    data.updated = Date.now();
    await storeData({
        [key]: data
    });
}

async function getSettings()  {
    return await getData('settings');
}

async function storeData(data) {
    await chrome.storage.local.set(data);
}

async function getData(key) {
    const data = (await chrome.storage.local.get([key])) ?? {};
    return data[key];
}