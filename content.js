// Listen for wheel event to detect scrolling
document.addEventListener('wheel', (event) => {
    // Send tab switch message to background script
    if (event.metaKey || event.shiftKey || event.ctrlKey) {  
        chrome.runtime.sendMessage({ 
            type: 'SCROLL',
            scrollDelta: event.deltaY,
            key: event.metaKey ? 'metaKey' : event.shiftKey ? 'shiftKey' : 'ctrlKey'
        });  

        // Prevent default scrolling behavior
        event.preventDefault();
    }

}, { passive: false });