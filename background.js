let isCommandPressed = false;
let scrollDelta = 0;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.type === 'SCROLL') {
    handleTabSwitch(message.scrollDelta, sender.tab.id);
  }
  return true;
});

async function handleTabSwitch(scrollUpdate, tabId) {
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

    const tabs = await chrome.tabs.query({ currentWindow: true });
    tabs.sort((a, b) => a.index - b.index);
    
    const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);
    let newIndex = currentIndex;
    if (scrollDelta <= scrollThreshold) {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (scrollDelta >= -scrollThreshold) {
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    }

    scrollDelta = 0;
    await chrome.tabs.update(tabs[newIndex].id, { active: true });
}