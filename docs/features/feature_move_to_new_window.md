## Feature: Move to New Window

**Status:** Partially Implemented
**Priority:** Medium
**Addresses Needs:** Window Management (Need 5), Tab Lifecycle Management (Need 3)

---

### Description

Quickly move the currently selected tab to a newly created browser window using a simple keyboard modifier. This enables rapid workspace organization without drag-and-drop or multiple steps.

---

### Current Implementation

The current Enter key behavior in navigation mode (from `App.svelte`):

```324:329:src/App.svelte
} else if (
    event.key === "Enter" &&
    isInNavigationMode &&
    selectedTab
) {
    moveSelectedTabToNextWindow(event);
}
```

And the `moveSelectedTabToNextWindow` function:

```419:449:src/App.svelte
async function moveSelectedTabToNextWindow(event) {
    event.preventDefault();
    event.stopPropagation();
    const windowsList = [...get(windows)]
        .filter((w) => w.tabs.length > 0)
        .sort((a, b) => a.id - b.id);
    const currentWindowId = selectedTab.windowId;
    const currentWindowIndex = windowsList.findIndex(
        (w) => w.id === currentWindowId,
    );
    if (currentWindowIndex < 0 || windowsList.length < 2) return;
    // ... moves to next existing window
}
```

**Current Behavior:**
- Enter in navigation mode moves tab to next existing window
- Cycles through windows
- If only one window, does nothing

---

### Proposed Enhancement: Shift+Enter for New Window

**New Behavior:**
- `Enter`: Move to next existing window (current behavior)
- `Shift+Enter`: Move to new window (creates new window, moves tab)

**Flow for Shift+Enter:**
1. User in navigation mode, has tab selected
2. Presses Shift+Enter
3. System:
   - Creates new empty window via `chrome.windows.create()`
   - Gets new window ID from response
   - Moves selected tab to new window via `chrome.tabs.move()`
   - Optionally activates the new window
   - Updates tab store state
4. Selection moves to next tab in original window

---

### Technical Implementation

**Code Location:** `src/App.svelte`

**Modification to handleKeydown:**

```javascript
} else if (
    event.key === "Enter" &&
    isInNavigationMode &&
    selectedTab
) {
    if (event.shiftKey) {
        moveSelectedTabToNewWindow(event);
    } else {
        moveSelectedTabToNextWindow(event);
    }
}
```

**New Function:**

```javascript
async function moveSelectedTabToNewWindow(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const windowsList = [...get(windows)]
        .filter((w) => w.tabs.length > 0)
        .sort((a, b) => a.id - b.id);
    const currentWindowId = selectedTab.windowId;
    const currentWindow = windowsList.find(w => w.id === currentWindowId);
    
    if (!currentWindow) return;
    
    // Get current tab index for selection update
    const tabs = [...currentWindow.tabs].sort((a, b) => a.index - b.index);
    const currentTabIndex = tabs.findIndex((t) => t.id === selectedTab.id);
    
    // Create new window
    const newWindow = await chromeService.createWindow({
        focused: true,
        type: 'normal'
    });
    
    // Move selected tab to new window
    await tabStore.moveTab(selectedTab.id, newWindow.id);
    
    // Refresh state
    await tabStore.refreshState();
    
    // Update selection to next tab in original window
    const updatedWindows = get(windows);
    const updatedWindow = updatedWindows.find((w) => w.id === currentWindowId);
    const updatedTabs = updatedWindow?.tabs
        ? [...updatedWindow.tabs].sort((a, b) => a.index - b.index)
        : [];
    
    if (updatedTabs.length > 0) {
        const nextIndex = Math.min(currentTabIndex, updatedTabs.length - 1);
        selectedTab = updatedTabs[nextIndex];
    } else {
        selectedTab = null;
    }
}
```

**Required Chrome Service Method:**

```javascript
// In src/services/chromeApi.js
async createWindow(options = {}) {
    return new Promise((resolve) => {
        chrome.windows.create(options, resolve);
    });
}
```

---

### UI Feedback

**Visual Indicators:**
- When in navigation mode with tab selected, show hint:
  - "Enter: Move to next window"
  - "Shift+Enter: Move to new window"

**Tab Switching Modal:**
Could show the "New Window" option as a virtual destination:
```
┌─────────────────────────────────────┐
│  ← Window 1  │  Window 2  │  🆕 →  │
│    (active)  │            │  New   │
└─────────────────────────────────────┘
```

---

### Alternative Interaction: Context Menu

Also available from Tab Context Menu:
- Menu Item: "Move to Window"
- Submenu item: "🆕 New Window"

This provides the same functionality without keyboard shortcuts.

---

### State Management

**No new state needed.** Uses existing:
- `selectedTab`: Tab to move
- `tabStore.moveTab()`: Existing method
- `windows`: Store of all windows

**New Store Method (optional):**
```javascript
async moveTabToNewWindow(tabId) {
    const newWindow = await chromeService.createWindow({ focused: true });
    await chromeService.moveTab(tabId, newWindow.id);
    await this.refreshState();
}
```

---

### Edge Cases

1. **Last tab in window:**
   - Moving last tab closes the original window (Chrome behavior)
   - Selection should move to another window's tabs

2. **Popped out tab:**
   - Tab is already in its own window
   - Shift+Enter could be no-op or show message

3. **Incognito/Normal mixing:**
   - Chrome may prevent moving between incognito and normal
   - Handle error gracefully

4. **Only one window exists:**
   - Shift+Enter always works (creates new one)
   - Enter does nothing (no next window)

---

### Code References

- **Current Implementation:** `src/App.svelte` lines 324-329, 419-449
- **Tab Store:** `src/stores/tabStore.js` - `moveTab()` method
- **Chrome Service:** `src/services/chromeApi.js` - needs `createWindow()`
- **Context Menu:** See `feature_tab_context_menu.md` for menu integration

---

### Implementation Checklist

- [x] Move to next existing window (Enter key)
- [ ] Add chromeService.createWindow() method
- [ ] Implement moveSelectedTabToNewWindow() function
- [ ] Handle Shift+Enter in keydown handler
- [ ] Add keyboard hint UI in TabsView
- [ ] Integrate with Tab Context Menu
- [ ] Handle edge cases (last tab, incognito)
- [ ] Test with multiple windows
