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
    } else if (e.target.classList.contains('apiKey')) {
        const key = e.target.id;
        const value = e.target.value;
        
        // Get current settings and update
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || { apiKeys: {} };
            if (!settings.apiKeys) settings.apiKeys = {};
            settings.apiKeys[key] = value;
            
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
        Object.entries(settings.apiKeys || {}).forEach(([key, value]) => {
            const el = document.getElementById(key);
            if (!el) return;
            if (el.tagName === "SELECT" || el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.value = value ?? "";
            }
        });

        const openPlanner = document.getElementById('openPlanner');
        if (openPlanner) {
            openPlanner.addEventListener('click', () => {
                chrome.tabs.create({ url: chrome.runtime.getURL('planner.html') });
            });
        }
    });
});
