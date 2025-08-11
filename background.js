/*
    Swift Tabs is a Chrome extension that enables tab and window navigation using swipe gestures. 

    Roadmap
    - Ergonomics (system level gestures)
    - Organization (tab queues)
    - Generation (search queries, web pages)
    - GUIs (tab menu in pop up, vertical toolbar in side panel, context menus)

*/


let KEYS = [];
let SCROLL = { x: 0, y: 0 };
let lastGeneratedResource = null;

chrome.runtime.onInstalled.addListener(() => {
    //saveDefaults();
    addContentScriptToAllTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYSTEM_SCROLL_MODE') {
        // Broadcast system scroll mode state to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SYSTEM_SCROLL_MODE',
                    enabled: message.enabled
                });
            });
        });
    } else if (message.type === 'SYSTEM_SCROLL') {
        handleSystemScroll({
            tabId: sender.tab.id,
            ...message,
            keys: ['primaryKey'] // Simulate primary key for tab switching
        });
    } else if (message.type === 'ADD_LINK_TO_QUEUE') {
        addResourceToTabQueue({
            tabId: sender.tab.id,
            resource: message.resource
        });
    } else if (message.type === 'GENERATE_RESOURCE_FROM_LINK') {
        generateResourceFromLink({
            tabId: sender.tab.id,
            ...message
        });
    }
    return true;
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         // update tab data with tab content 
//     }
// }); 

// chrome.tabs.onActivated.addListener((activeInfo) => {
//     updateTabBadge(activeInfo.tabId);
// });

chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabData(tabId);
});


async function addResourceToTabQueue({ tabId, resource }) {
    const tabData = await getTabData(tabId);
    tabData.queue.push(resource);
    await setTabData(tabId, tabData);
    updateTabBadge(tabId);
    const settings = await getSettings();
    if (true || settings.saveToReadingList) {
        saveResourceToReadingList(resource);
    }
}

function saveResourceToReadingList(resource) {
    chrome.readingList.addEntry({
        title: resource.title,
        url: resource.url
    });
}

async function updateTabBadge(tabId, tabData) {
    if (!tabData) tabData = await getTabData(tabId);
    chrome.action.setBadgeText({
        tabId,
        text: tabData.queue.length.toString()
    });
}

async function saveDefaults() {
    chrome.storage.local.set({
        settings: {
            keys: {
                primaryKey: 'altKey',
                secondaryKey: 'ctrlKey',
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

    await proccessInputData(event);

    handleTabSwitch(event);
    return;


    const isSystemAction = KEYS.includes(primaryKey) && KEYS.includes(secondaryKey) && KEYS.includes(tertiaryKey);

    const isTabSwitch = KEYS.includes(primaryKey);
    const isTabAction = KEYS.includes(primaryKey) && KEYS.includes(tertiaryKey);
    const isTabSelection = KEYS.includes(primaryKey) && KEYS.includes(secondaryKey);

    const isWindowSwitch = KEYS.includes(secondaryKey);
    const isWindowAction = KEYS.includes(secondaryKey) && KEYS.includes(tertiaryKey);


    if (isSystemAction) handleSystemAction(event);
    else if (isTabAction) handleTabAction(event);
    else if (isWindowAction) handleWindowAction(event);
    else if (isTabSelection) handleTabSelection(event);
    else if (isTabSwitch) handleTabSwitch(event);
    else if (isWindowSwitch) handleWindowSwitch(event);

}

async function proccessInputData(event) {

    const sameModifieryKeys = JSON.stringify(KEYS.sort()) === JSON.stringify(event.keys.sort());

    if (!sameModifieryKeys) {

        KEYS = event.keys;
        SCROLL = { x: 0, y: 0 };
    }

    const yDistance = Math.abs(event.deltaY);
    const xDistance = Math.abs(event.deltaX)
    const isVerticalSwipe = (yDistance > xDistance) && yDistance > 2;
    const isHorizontalSwipe = (xDistance > yDistance) && xDistance > 2;

    if (isHorizontalSwipe && SCROLL.y != 0) {

        SCROLL.y = 0;
    }

    if (isVerticalSwipe && SCROLL.x != 0) {

        SCROLL.x = 0;
    }

    const xDirectionChanged = (SCROLL.x * event.deltaX) < 0;
    const yDirectionChanged = (SCROLL.y * event.deltaY) < 0;

    if (isHorizontalSwipe && xDirectionChanged) {
        SCROLL.x = 0;
    }
    if (isVerticalSwipe && yDirectionChanged) {
        SCROLL.y = 0;
    }

    if (isHorizontalSwipe) {
        SCROLL.x += event.deltaX;
    } else if (isVerticalSwipe) {
        SCROLL.y += event.deltaY;
    }

    SCROLL.lastUpdated = Date.now();
}

async function handleSystemAction(event) {

    /*
    *  Vertical swipe to minimize or expand all windows
    *  Horizontal swipe to exit or enter fullscreen mode
    */
}


async function handleTabSwitch(event) {

    /*
    * Vertical swipe navigates to adjacent tab
    * Horizontal swipe navigates tab history 
    * 
    */




    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;

    const yDistance = Math.abs(SCROLL.y);
    const xDistance = Math.abs(SCROLL.x);

    const isVerticalSwipe = yDistance > xDistance;
    const isHorizontalSwipe = xDistance > yDistance;

    const swipeThresholdNotMet = (
        (isHorizontalSwipe && (xDistance < horizontalSwipeThreshold))
        || (isVerticalSwipe && (yDistance < verticalSwipeThreshold))
    );

    if (swipeThresholdNotMet) {
        return;
    }

    const currentTab = (await chrome.tabs.query({
        active: true,
        currentWindow: true
    }))[0];

    if (currentTab.id !== event.tabId) {

        return;
    }

    if (isVerticalSwipe) {

        const nextIndex = currentTab.index + (SCROLL.y > 0 ? -1 : 1);
        const nextTab = (await chrome.tabs.query({ index: nextIndex, currentWindow: true }))[0];

        if (nextTab) {
            chrome.tabs.update(nextTab.id, { active: true });
        }

    } else if (isHorizontalSwipe) {

        const swipeLeft = SCROLL.x < 0;
        const swipeRight = SCROLL.x > 0;

        if (swipeLeft) {



            const canGoBack = (await chrome.scripting.executeScript({
                target: { tabId: currentTab.id, },
                func: () => window.history.length > 1
            }))[0].result;


            if (canGoBack) {

                // Navigate to previous tab history item

                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id, },
                    func: () => window.history.back(),
                });

            } else {

                // Navigate to previous tab

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

            SCROLL = {
                x: 0, //isHorizontalSwipe ? ((Math.abs(SCROLL.x) - horizontalSwipeThreshold) * (SCROLL.x > 0 ? 1 : -1))  : 0, 
                y: 0, //isVerticalSwipe ? ((Math.abs(SCROLL.y) - verticalSwipeThreshold) * (SCROLL.y > 0 ? 1 : -1)) : 0,
            };

            // Navigate to next tab history item

            let canGoForward = (await chrome.scripting.executeScript({
                target: { tabId: currentTab.id, },
                func: () => { window.history.forward(); return window.location.href; },
            }))[0].result != currentTab.url;

            if (!canGoForward) {
                // Navigate to next tab queue item 
                console.log('swiping right');

                const tabData = await getTabData(currentTab.id);


                if (tabData.queue && tabData.queue.length > 0) {

                    const resource = tabData.queue.shift();

                    if (resource.url) {

                        chrome.tabs.update(currentTab.id, { url: resource.url });

                    } else {

                        console.log('generating resource from link');
                        if (lastGeneratedResource && (Date.now() - lastGeneratedResource) < 1000) return;
                        lastGeneratedResource = Date.now();

                        generateResourceFromLink({
                            tabId: currentTab.id,
                            title: resource.title
                        });

                    }

                    setTabData(currentTab.id, tabData);

                } else {

                    if (lastGeneratedResource && (Date.now() - lastGeneratedResource) < 1000) return;
                    lastGeneratedResource = Date.now();

                    if (isSearchTab(currentTab)) {

                        console.log('generating search query');

                        // Generate related search query and navigate to search results

                        const nextQuery = await generateNextSearchQuery(currentTab);
                        if (!nextQuery) return;
                        const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(nextQuery);
                        chrome.tabs.update(currentTab.id, { url: searchUrl });

                    } else {

                        console.log('generating next resource');


                        // Generate next resource and navigate to it
                        const generatedResource = await generateNextResource();
                        if (!generatedResource) return;

                        loadGeneratedResource(currentTab.id, generatedResource);

                    }
                }

            }
        }
    }



    SCROLL = {
        x: 0, //isHorizontalSwipe ? ((Math.abs(SCROLL.x) - horizontalSwipeThreshold) * (SCROLL.x > 0 ? 1 : -1))  : 0, 
        y: 0, //isVerticalSwipe ? ((Math.abs(SCROLL.y) - verticalSwipeThreshold) * (SCROLL.y > 0 ? 1 : -1)) : 0,
    };


}


function loadGeneratedResource(tabId, generatedResource) {

    const title = generatedResource.title;
    const body = generatedResource.body;

    chrome.scripting.executeScript({
        target: { tabId: tabId, },
        args: [title, body],
        func: (title, body) => {
            document.title = title;
            document.body.innerHTML = body;
        },

    });

}

async function generateResourceFromLink({ tabId, title }) {

    const content = (await chrome.scripting.executeScript({
        target: { tabId },
        func: getTabContent
    }))[0].results;

    const prompt = 'You\'re embeded in a web browser. A user has just clicked on a link, "' + title + '". The link is contained within a web page that you generated. Here is the web page text content:\n' + content + ' \n EOF \n Please generate a full length article written in the same style of the previous article. The article should be a full HTML document with header tags for headings and anchor tags for topics the user may want to more details on. At the bottom provide links to related topics including both more general and more specific topics.';
    const generatedResource = await generateText(prompt);
    loadGeneratedResource(tabId, generatedResource);

}

async function getKeys() {
    return (await getSettings()).apiKeys ?? {};
}

function getTabContent() {
    return document.body.innerText;
}


async function generateNextResource() {

    // Generate next resource based on current tab context
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const content = (await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: getTabContent
    }))[0].result;

    const prompt = 'You\'re embeded in a web browser. The user has just finished reading a web page and would like to explore related material. You are tasked with generating the next web page for the user to read. You can either expand on any interesting insights from the current page or explore a related topic that the user may find interesting. Here is the content from the current page: \n ' + content + '. \n EOF \n Please generate a full length article written in the style of Derrick Thompson, the writer for the Atlantic. The article should be an HTML document <html><head><title>...</title></head><body>...</body></html> with header tags for headings and anchor tags <a href="#"></a> for topics the user may want to more details on. At the bottom provide links to related topics.';
    let html = await generateText(prompt);
    if (html.includes('<html>')) {
        html = '<html>' + text.split('<html>')[1].split('</html>')[0] + '</html>';
    }
    let title;
    let body;
    if (html.includes('<title>')) {
        title = html.split('<title>')[1].split('</title>')[0];
    } else {
        title = html.split('\n')[0];
    }
    if (html.includes('<body>')) {
        body = html.split('<body>')[1].split('</body>')[0];
    } else {
        body = html;
    }

    return { title, body };

}

function isSearchTab(tab) {
    return tab.url.includes('google.com/search');
}

async function generateNextSearchQuery(tab) {
    const currentQuery = decodeURIComponent((new URL(tab.url)).searchParams.get('q'));
    const prompt = 'You\'re embeded in a web browser. A user has just made the following search query: ' + currentQuery + '. Provide three related search queries separated by commas. Only provide the queries. Do not include any explanations.';
    const queries = (await generateText(prompt)).split(',');
    return queries[Math.floor(Math.random() * queries.length)];
}

async function generateText(prompt) {

    return await generateTextFromGemini(prompt);

}

async function generateTextFromGemini(prompt) {

    const keys = await getKeys();

    if (!keys.geminiApiKey) {

        chrome.runtime.openOptionsPage();
        return;

    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keys.geminiApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });


    const data = await response.json();

    text = data.candidates[0].content.parts[0].text;

    return text;
}


async function handleWindowSwitch(event) {

    /*
    * Vertical swipe navigates to adjacent window
    * Horizontal swipe navigates window history 
    */


    const isVerticalSwipe = Math.abs(SCROLL.y) > Math.abs(SCROLL.x);
    const isHorizontalSwipe = Math.abs(SCROLL.x) > Math.abs(SCROLL.y);


    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;
    const swipeLeft = SCROLL.x < 0;
    const swipeRight = SCROLL.x > 0;

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;


    const swipeThresholdNotMet = (
        (isHorizontalSwipe && (Math.abs(SCROLL.x) < horizontalSwipeThreshold))
        || (isVerticalSwipe && (Math.abs(SCROLL.y) < verticalSwipeThreshold))
    );

    if (swipeThresholdNotMet) {
        return;
    }


    const windows = await chrome.windows.getAll({});
    let currentIndex;
    for (let i = 0; i < windows.length; i++) {
        if (windows[i].focused) {
            currentIndex = i;
            break;
        }
    }


    console.log('switching windows');

    if (swipeUp) {

        const nextIndex = currentIndex + 1;
        const nextWindow = windows[nextIndex];
        if (nextWindow) {
            chrome.windows.update(nextWindow.id, { focused: true });
        } else {
            chrome.windows.update(windows[0].id, { focused: true });
        }
    } else if (swipeDown) {
        const nextIndex = currentIndex - 1;
        const nextWindow = windows[nextIndex];
        if (nextWindow) {
            chrome.windows.update(nextWindow.id, { focused: true });
        } else {
            chrome.windows.update(windows[windows.length - 1].id, { focused: true });
        }
    }

    SCROLL = { x: 0, y: 0 };


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

    if (currentIndex === 0 && selectedTabs.length > 1) {


        const lastSelectedTab = selectedTabs[selectedTabs.length - 1];
        if (swipeUp) {


            const nextTab = (await chrome.tabs.query({ index: currentTab.index - 1, currentWindow: true }))[0];
            chrome.tabs.update(nextTab.id, {
                highlighted: true
            });

        } else if (swipeDown) {

            chrome.tabs.update(currentTab.id, {
                highlighted: false
            });
        }
    } else if (currentIndex === selectedTabs.length - 1 && selectedTabs.length > 1) {


        const firstSelectedTab = selectedTabs[0];
        if (swipeUp) {

            chrome.tabs.update(currentTab.id, {
                highlighted: false
            });
        } else if (swipeDown) {

            const nextTab = (await chrome.tabs.query({ index: selectedTabs[currentIndex].index + 1, currentWindow: true }))[0];
            chrome.tabs.update(nextTab.id, {
                highlighted: true
            });
        }
    } else {

        if (swipeUp) {
            console.log('swiping up');
            const nextTab = (await chrome.tabs.query({ index: currentTab.index - 1, currentWindow: true }))[0];
            chrome.tabs.update(nextTab.id, {
                highlighted: true
            });
        } else if (swipeDown) {
            console.log('swiping down');
            const nextTab = (await chrome.tabs.query({ index: currentTab.index + 1, currentWindow: true }))[0];
            chrome.tabs.update(nextTab.id, {
                highlighted: true
            });
        }
    }
}

async function handleTabAction(event) {
    /*
    * Vertical swipe to move tab to adjacent index
    * Left swipe to open as pop up and right swipe move tab to new window
    * Todo
    * - Settings (move all related tabs, make new window active)
    */

    console.log('handling tab action');

    const isVerticalSwipe = Math.abs(SCROLL.y) > Math.abs(SCROLL.x);
    const isHorizontalSwipe = Math.abs(SCROLL.x) > Math.abs(SCROLL.y);


    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;
    const swipeLeft = SCROLL.x < 0;
    const swipeRight = SCROLL.x > 0;

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;


    const swipeThresholdNotMet = (
        (isHorizontalSwipe && (Math.abs(SCROLL.x) < horizontalSwipeThreshold))
        || (isVerticalSwipe && (Math.abs(SCROLL.y) < verticalSwipeThreshold))
    );

    if (swipeThresholdNotMet) {
        return;
    }


    const selectedTabs = await chrome.tabs.query({
        highlighted: true,
        currentWindow: true
    });

    if (swipeUp) { // move up
        for (const tab of selectedTabs) {
            await chrome.tabs.move(tab.id, { index: tab.index - 1 });
        }
    } else if (swipeDown) { // move down
        for (let i = selectedTabs.length - 1; i >= 0; i--) {
            await chrome.tabs.move(selectedTabs[i].id, { index: selectedTabs[i].index + 1 });
        }
    } else if (swipeLeft) { // move to pop up window
        const newWindow = await chrome.windows.create({
            tabId: selectedTabs[0].id,
            focused: true,
            type: 'popup'
        });
        if (selectedTabs.length > 1) {
            await chrome.tabs.move(
                selectedTabs.slice(1).map(tab => tab.id),
                { windowId: newWindow.id, index: -1 }
            );
        }
    } else if (swipeRight) { // move to new window
        const newWindow = await chrome.windows.create({
            tabId: selectedTabs[0].id,
            focused: true
        });
        if (selectedTabs.length > 1) {
            await chrome.tabs.move(
                selectedTabs.slice(1).map(tab => tab.id),
                { windowId: newWindow.id, index: -1 }
            );
        }
    }

    SCROLL = {
        ...SCROLL,
        x: 0,
        y: 0,
        lastUpdated: Date.now()
    };




}

async function handleWindowAction(event) {

    /*
    * Swipe up to consolidate tabs
    * Swipe down to clear tabs
    * Swipe left to merge windows
    * Swipe right to split tabs into new windows
    */

    const isVerticalSwipe = Math.abs(SCROLL.y) > Math.abs(SCROLL.x);
    const isHorizontalSwipe = Math.abs(SCROLL.x) > Math.abs(SCROLL.y);

    const swipeUp = SCROLL.y > 0;
    const swipeDown = SCROLL.y < 0;
    const swipeLeft = SCROLL.x > 0;
    const swipeRight = SCROLL.x < 0;

    const verticalSwipeThreshold = 60;
    const horizontalSwipeThreshold = 100;

    const swipeThresholdNotMet = (
        (isHorizontalSwipe && (Math.abs(SCROLL.x) < horizontalSwipeThreshold))
        || (isVerticalSwipe && (Math.abs(SCROLL.y) < verticalSwipeThreshold))
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
    const selectedTabs = tabs.filter(tab => tab.highlighted);
    if (selectedTabs.length > 1) tabs = selectedTabs;

    const firstTab = tabs.shift();
    let queue = [];
    tabs.forEach(tab => {
        if (tab.pinned) return
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
    await chrome.tabs.update(newTab.id, { active: true });
    tabs.forEach(async tab => {
        if (tab.pinned) return;
        await chrome.tabs.remove(tab.id);
    });
}

async function mergeWindows() {

    /*
    * Merge all open windows into the current window
    */

    const windows = await chrome.windows.getAll({ populate: true });
    windows.forEach(async window => {

        if (window.id !== chrome.windows.WINDOW_ID_CURRENT) {
            let movedGroups = [];
            // Todo: create tab group for each window
            window.tabs.forEach(async tab => {
                if (tab.groupId !== -1) {
                    await chrome.tabs.move(tab.id, { windowId: chrome.windows.WINDOW_ID_CURRENT, index: -1 });
                } else if (tab.groupId && !movedGroups.includes(tab.groupId)) {
                    await chrome.tabGroups.move(tab.groupId, { windowId: chrome.windows.WINDOW_ID_CURRENT });
                    movedGroups.push(tab.groupId);
                }
            });
            await chrome.windows.remove(window.id);
            // Todo: handle tab groups
        }
    });

}

async function splitWindow() {

    /*
    * Move tab groups to new windows 
    */


    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabGroups = {};

    for (const tab of tabs) {
        if (!tabGroups[tab.openerTabId]) tabGroups[tab.openerTabId] = [];
        tabGroups[tab.openerTabId].push(tab);
    }

    console.log('splitting window');
    console.log(tabGroups);

    // for (const tabGroup of Object.values(tabGroups)) {
    //     const newWindow = await chrome.windows.create({ tabId: tabGroup[0].id });
    //     for (let i = 1; i < tabGroup.length; i++) {
    //         chrome.tabs.move(tabGroup[i].id, { windowId: newWindow.id, index: -1 });
    //     }
    // }


    // const tabGroups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

    // for (const tabGroup of tabGroups) {
    //     const window = await chrome.windows.create({ });
    //     chrome.tabGroups.move(tabGroup.id, { windowId: window.id });
    // }




}


const TAB_KEY_PREFIX = 'tab-';

async function getTabData(tabId) {
    return (await getData(TAB_KEY_PREFIX + tabId)) ?? {};
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

async function getSettings() {
    return (await getData('settings')) ?? {};
}

async function storeData(data) {
    await chrome.storage.local.set(data);
}

async function getData(key) {
    const data = (await chrome.storage.local.get([key])) ?? {};
    return data[key];
}