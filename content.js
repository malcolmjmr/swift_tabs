// Listen for wheel event to detect scrolling
document.addEventListener('wheel', (event) => {
    // Send tab switch message to background script
    if (event.metaKey || event.shiftKey || event.ctrlKey || event.altKey) {  
        chrome.runtime.sendMessage({ 
            type: 'SYSTEM_SCROLL',
            deltaY: event.deltaY,
            deltaX: event.deltaX,
            keys: Object.entries(event).filter(([key, value]) => key.includes('Key') && value).map(([key, value]) => key),
        });  

        // Prevent default scrolling behavior
        event.preventDefault();
    }

}, { passive: false });