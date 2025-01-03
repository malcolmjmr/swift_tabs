let lastKey = null;
let scrollDelta = 0;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        lastKey: null,
        scrollDelta: 0,
        settings: {
            keys: {
                metaKey: 'tabs',
                shiftKey: 'recent',
                ctrlKey: 'windows'
            }
        }
    });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.type === 'SCROLL') {
    handleTabSwitch({
        ...message,
        tabId: sender.tab.id
    });
  }
  return true;
});

async function handleTabSwitch({ scrollUpdate, key, tabId }) {

    if (key != lastKey) {
        lastKey = key;
    }

    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab.id !== tabId) {
        return;
    }
  
    const scrollThreshold = 60;
    if ((scrollDelta < 0 && scrollUpdate > 0) || (scrollDelta > 0 && scrollUpdate < 0)) {
        scrollDelta = scrollUpdate;
    } else {
        scrollDelta += scrollUpdate;
    }
    if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
    }

    const settings = await getSettings();
    const keyBinding = settings.keys[key];

    let tabs = [];
    let windows = [];
    if (keyBinding == 'tabs') {
        tabs = await chrome.tabs.query({ currentWindow: true });
        tabs.sort((a, b) => {
            return a.index - b.index;
        });
    } else if (keyBinding == 'recent') {
        tabs = await chrome.tabs.query({ currentWindow: true });
        tabs.sort((a, b) => {
            return a.lastAccessed - b.lastAccessed;
        });
    } else if (keyBinding == 'windows') {
        windows = await chrome.windows.getAll();
        windows.sort((a, b) => {
            return a.id - b.id;
        });
    }
    
    if (keyBinding == 'windows') {
        const currentIndex = windows.findIndex(window => window.id === currentTab.windowId);
        let newIndex = currentIndex;
        if (scrollDelta <= scrollThreshold) {
            newIndex = currentIndex === windows.length - 1 ? 0 : currentIndex + 1;
        } else if (scrollDelta >= -scrollThreshold) {
            newIndex = currentIndex === 0 ? windows.length - 1 : currentIndex - 1;
        }
        await chrome.windows.update(windows[newIndex].id, { focused: true });
    } else {

        const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
        let newIndex = currentIndex;
        if (scrollDelta <= scrollThreshold) {
            newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        } else if (scrollDelta >= -scrollThreshold) {
            newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        }

        await chrome.tabs.update(tabs[newIndex].id, { active: true });
    }

    scrollDelta = 0;
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