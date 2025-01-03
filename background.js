let lastKey = null;
let fullScrollDelta = 0;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        lastKey: null,
        fullScrollDelta: 0,
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
    console.log('message', message);
   if (message.type === 'SCROLL') {
    handleTabSwitch({
        ...message,
        tabId: sender.tab.id
    });
  }
  return true;
});

async function handleTabSwitch({ scrollDelta, key, tabId }) {

    if (key != lastKey) {
        lastKey = key;
    }
    console.log('handleTabSwitch');
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab.id !== tabId) {
        return;
    }
  
    const scrollThreshold = 60;
    if ((fullScrollDelta < 0 && scrollDelta > 0) || (fullScrollDelta > 0 && scrollDelta < 0)) {
        fullScrollDelta = scrollDelta;
    } else {
        fullScrollDelta += scrollDelta;
    }
    if (Math.abs(fullScrollDelta) < scrollThreshold) {
        return;
    }

    const settings = await getSettings();
    const keyBinding = settings.keys[key];
    console.log('keyBinding', keyBinding);
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
            return b.lastAccessed - a.lastAccessed;
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
        if (fullScrollDelta <= scrollThreshold) {
            newIndex = currentIndex === windows.length - 1 ? 0 : currentIndex + 1;
        } else if (fullScrollDelta >= -scrollThreshold) {
            newIndex = currentIndex === 0 ? windows.length - 1 : currentIndex - 1;
        }
        await chrome.windows.update(windows[newIndex].id, { focused: true });
    } else {

        const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
        let newIndex = currentIndex;
        console.log('currentIndex', currentIndex);
        if (fullScrollDelta <= scrollThreshold) {
            newIndex = (currentIndex === (tabs.length - 1)) ? 0 : currentIndex + 1;
        } else if (fullScrollDelta >= -scrollThreshold) {
            newIndex = (currentIndex === 0) ? tabs.length - 1 : currentIndex - 1;
        }
        console.log('newIndex', newIndex);
        await chrome.tabs.update(tabs[newIndex].id, { active: true });
    }

    fullScrollDelta = 0;
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