// Add event listeners for all select elements
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'SELECT') {
        const key = e.target.id;
        const value = e.target.value;
        
        // Get current settings and update
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || { keys: {} };
            settings.keys[key] = value;
            
            // Save updated settings
            chrome.storage.local.set({ settings });
        });
    }
});

// Load saved settings when page opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['settings'], (data) => {
        const settings = data.settings || { keys: {} };
        
        // Update select elements with saved values
        Object.entries(settings.keys).forEach(([key, value]) => {
            const select = document.getElementById(key);
            if (select) {
                select.value = value;
            }
        });
    });
});
