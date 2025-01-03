// Listen for wheel event to detect scrolling
document.addEventListener('wheel', (event) => {
    // Send tab switch message to background script
    if (event.metaKey) {  
        chrome.runtime.sendMessage({ 
            type: 'SCROLL',
            scrollDelta: event.deltaY
        });  

        // Prevent default scrolling behavior
        event.preventDefault();
    }

}, { passive: false });