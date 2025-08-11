var inSystemScrollMode = false;
var lastRightClick = 0;

// listen to the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYSTEM_SCROLL_MODE') {
        inSystemScrollMode = message.enabled;
    }
});

document.addEventListener('contextmenu', (event) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastRightClick;

    // If this is a double right click (within 500ms), show context menu and exit system scroll mode
    if (timeSinceLastClick < 500) {
        inSystemScrollMode = false;
        chrome.runtime.sendMessage({
            type: 'SYSTEM_SCROLL_MODE',
            enabled: false
        });
        lastRightClick = 0; // Reset the timer
        return; // Allow context menu to show
    }

    // Single right click - toggle system scroll mode
    event.preventDefault(); // Prevent context menu
    lastRightClick = now;

    inSystemScrollMode = !inSystemScrollMode;
    chrome.runtime.sendMessage({
        type: 'SYSTEM_SCROLL_MODE',
        enabled: inSystemScrollMode
    });
}, { passive: false });


let scrollTimeout = null;
const SCROLL_TIMEOUT_DURATION = 1000; // Time in ms after which to exit system scroll mode

// Listen for wheel event to detect scrolling
document.addEventListener('wheel', (event) => {

    if (inSystemScrollMode) {
        // Clear any existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Set a new timeout to exit system scroll mode after scrolling stops
        scrollTimeout = setTimeout(() => {
            inSystemScrollMode = false;
            chrome.runtime.sendMessage({
                type: 'SYSTEM_SCROLL_MODE',
                enabled: false
            });
            scrollTimeout = null;
        }, SCROLL_TIMEOUT_DURATION);

        chrome.runtime.sendMessage({
            type: 'SYSTEM_SCROLL',
            deltaY: event.deltaY,
            deltaX: event.deltaX,
            keys: [] // No modifier keys needed in system scroll mode
        });

        // Prevent default scrolling behavior
        event.preventDefault();
    }
}, { passive: false });

// Listen for mousedown event to detect clicking
document.addEventListener('mousedown', (event) => {

    const modifierKeyPressed = event.shiftKey || event.ctrlKey || event.altKey;

    if (modifierKeyPressed) {

        let keys = getEventMetaKeys(event);
        const link = getClickedLink(event);
        chrome.runtime.sendMessage({
            type: 'ADD_LINK_TO_QUEUE', // LINK_CLICK
            resource: {
                title: link.innerText,
                url: link.href != '#' ? link.href : null,
            },
            keys,
        });

        event.preventDefault();
    }

}, { passive: false });

function getClickedLink(event) {
    let target = event.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }
    return target;
}

// Listen for selection event to detect text selection
// document.addEventListener('selectionchange', (event) => {
//     const modifierKeyPressed = event.metaKey || event.shiftKey || event.ctrlKey || event.altKey;
//     const selection = window.getSelection().toString();
//     if (modifierKeyPressed && selection) {
//         let keys = getEventMetaKeys(event);
//         chrome.runtime.sendMessage({ 
//             type: 'TEXT_SELECTION',
//             selection,
//             keys,
//         });  
//     }

// }, { passive: true });

function getEventMetaKeys(event) {
    let keys = [];
    if (event.metaKey) keys.push('metaKey');
    if (event.shiftKey) keys.push('shiftKey');
    if (event.ctrlKey) keys.push('ctrlKey');
    if (event.altKey) keys.push('altKey');
    return keys;
}