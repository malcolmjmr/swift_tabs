## Feature: Move to New Window

**Status:** Partially Implemented  
**Priority:** Medium  
**Addresses Needs:** Window and Group Management (Need 4), Tab Management (Need 3)

---

### Description

Quickly move tabs to a newly created browser window to establish a new task context. Supports two modes: **In-Navigation Mode** (for batch-moving multiple tabs) and **Outside Navigation Mode** (for moving the current tab immediately).

This enables rapid workspace organization without drag-and-drop or multiple window creation steps.

---

### Two Usage Modes

#### Mode 1: In Navigation Mode (Batch Context Creation)

**Use Case:** User wants to collect multiple tabs from current window into a new task context.

**Flow:**
1. Enter navigation mode (Space key or Active Tab Info showing)
2. Navigate tabs within current window (vertical scroll)
3. Press **Enter** to move selected tab to new context

**Enter Key Logic:**
- **First Enter press:** Creates a new browser window and moves the selected tab there
- **Subsequent Enter presses:** Moves additional selected tabs to the *same* newly created window (no new window created)
- **User stays in navigation mode** throughout, allowing rapid tab selection and batch-moving

**Example:**
```
User in navigation mode viewing Window 1 tabs
              │
    Scroll to Tab A (email about Project X)
              │
    Press Enter → New Window created, Tab A moved there
              │
    Still in navigation mode, now viewing Window 1 tabs again
              │
    Scroll to Tab B (doc about Project X)
              │
    Press Enter → Tab B moved to same new window
              │
    Scroll to Tab C (spreadsheet about Project X)
              │
    Press Enter → Tab C moved to same new window
              │
    User now has 3 tabs in new window, all related to Project X
              │
    Can horizontal scroll to switch to new window
```

**Delete/Backspace Alternative:**
- Press **Delete/Backspace** to close the selected tab (with undo available)
- This allows triage: close irrelevant tabs, Enter to collect relevant ones

---

#### Mode 2: Outside Navigation Mode (Immediate Move)

**Use Case:** User wants to move the current tab to a new window without entering full navigation mode.

**Flow:**
1. Active Tab Info is showing (appears on navigation or scroll up)
2. Press **Shift+Enter**
3. New window created immediately, current tab moved there

**No Dialog:** The action executes immediately. The user sees brief visual feedback (window flash or indicator) and the Active Tab Info updates to show the new context.

---

### Current vs Intended Implementation

**Current (needs update):**
```javascript
// In App.svelte
} else if (
    event.key === "Enter" &&
    isInNavigationMode &&
    selectedTab
) {
    moveSelectedTabToNextWindow(event);  // ← Moves to EXISTING window, not new
}
```

**Intended:**
```javascript
// Track new window creation state
let newWindowCreated = null; // Stores window ID of recently created window

} else if (
    event.key === "Enter" &&
    isInNavigationMode &&
    selectedTab
) {
    if (newWindowCreated) {
        // Subsequent Enter: move to same new window
        moveSelectedTabToWindow(selectedTab.id, newWindowCreated);
    } else {
        // First Enter: create new window and move
        const newWindow = await createWindowAndMoveTab(selectedTab.id);
        newWindowCreated = newWindow.id;
    }
}

// Reset when user leaves navigation mode or switches windows
function onNavigationModeExit() {
    newWindowCreated = null;
}
```

---

### Technical Implementation

**New State Required:**
```javascript
// In App.svelte or tabStore
let newWindowContextId = null; // ID of window created during this nav session
let newWindowCreatedAt = null; // Timestamp to auto-expire after timeout
```

**Core Functions:**

```javascript
async function createWindowAndMoveTab(tabId) {
    // Get current context
    const sourceWindowId = selectedTab.windowId;
    const tabs = [...get(currentWindowTabs)].sort((a, b) => a.index - b.index);
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    
    // Create new window
    const newWindow = await chromeService.createWindow({
        focused: false, // Keep focus on current window for batch operations
        type: 'normal'
    });
    
    // Move tab to new window
    await tabStore.moveTab(tabId, newWindow.id);
    
    // Store reference for subsequent moves
    newWindowContextId = newWindow.id;
    newWindowCreatedAt = Date.now();
    
    // Update selection to next tab in original window
    await tabStore.refreshState();
    const updatedTabs = get(currentWindowTabs).sort((a, b) => a.index - b.index);
    if (updatedTabs.length > 0) {
        const nextIndex = Math.min(currentIndex, updatedTabs.length - 1);
        selectedTab = updatedTabs[nextIndex];
    }
    
    return newWindow;
}

async function moveTabToExistingWindow(tabId, targetWindowId) {
    await tabStore.moveTab(tabId, targetWindowId);
    await tabStore.refreshState();
    
    // Update selection to next tab
    const tabs = [...get(currentWindowTabs)].sort((a, b) => a.index - b.index);
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    if (tabs.length > 0) {
        const nextIndex = Math.min(currentIndex, tabs.length - 1);
        selectedTab = tabs[nextIndex];
    }
}
```

**Expiration Logic:**
```javascript
// New window context expires after 30 seconds of inactivity
const NEW_WINDOW_CONTEXT_TIMEOUT = 30000;

function resetNewWindowContext() {
    newWindowContextId = null;
    newWindowCreatedAt = null;
}

// Check expiration before each Enter press
if (newWindowContextId && 
    Date.now() - newWindowCreatedAt > NEW_WINDOW_CONTEXT_TIMEOUT) {
    resetNewWindowContext();
}
```

---

### Shift+Enter Outside Navigation Mode

**Implementation:**
```javascript
// In handleKeydown, when NOT in navigation mode
} else if (
    event.key === "Enter" &&
    event.shiftKey &&
    !isInNavigationMode &&
    currentTab  // Use current tab, not selectedTab
) {
    event.preventDefault();
    event.stopPropagation();
    
    // Create window and move immediately
    const newWindow = await chromeService.createWindow({ focused: true });
    await tabStore.moveTab(currentTab.id, newWindow.id);
    
    // Brief visual feedback
    showMoveFeedback('Moved to new window');
}
```

---

### UI Feedback

**In Navigation Mode:**

Hint shown when tab selected:
```
┌─────────────────────────────────────────┐
│  [Tab Title]                            │
│                                         │
│  Delete: Close    Enter: Move to new    │
│                   (subsequent: same)    │
└─────────────────────────────────────────┘
```

After first Enter:
```
┌─────────────────────────────────────────┐
│  [Tab Title]                            │
│                                         │
│  ✓ New window created                   │
│  Delete: Close    Enter: Move to same   │
└─────────────────────────────────────────┘
```

**Outside Navigation Mode:**

Brief toast/indicator:
```
┌─────────────┐
│  🆕 →       │
│  Moved to   │
│  new window │
└─────────────┘
```

---

### Tab Menu Integration

Also accessible via Tab Menu → Move → New Window:

```
Tab Menu
  ├── > Move
        ├── New Window     ← Immediate execution
        ├── Window 1
        ├── Window 2
        └── Group: Research
```

Selecting "New Window" from menu executes the same logic as Shift+Enter (immediate, no dialog).

---

### State Management

**New State Variables:**
```javascript
// Local state in App.svelte
let newWindowContextId: number | null = null;  // Window ID created in current session
let newWindowCreatedAt: number | null = null;  // Timestamp for expiration

// Reset conditions:
// - User exits navigation mode
// - User switches to different window (horizontal scroll)
// - 30 seconds elapsed since last Enter press
// - User manually switches windows
```

**Store Methods:**
```javascript
// No new store methods needed — uses existing:
- tabStore.moveTab(tabId, windowId)
- chromeService.createWindow(options)
```

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Last tab in window** | Moving last tab closes original window (Chrome behavior). Selection moves to another window or clears. |
| **Tab already alone** | If tab is already in its own window, no-op with "Already in dedicated window" feedback. |
| **Incognito mixing** | Chrome prevents moving between incognito/normal. Show error gracefully. |
| **New window closed externally** | If user closes the new window while still in nav mode, reset `newWindowContextId` and create new on next Enter. |
| **Timeout expiration** | After 30s of inactivity, Enter creates a new window instead of moving to old one. |
| **Only one window** | Enter works (creates new window). Delete works. Both function normally. |

---

### Code References

**Implementation Locations:**
- `src/App.svelte` — Key handlers (Enter in nav mode, Shift+Enter outside)
- `src/stores/tabStore.js` — `moveTab()` method
- `src/services/chromeApi.js` — `createWindow()` method

**Integration Points:**
- `feature_tab_context_menu.md` — Move submenu "New Window" option
- `feature_tab_context_awareness.md` — Active Tab Info showing hints

---

### Implementation Checklist

- [ ] Update Enter key handler in navigation mode (first press = create, subsequent = same window)
- [ ] Add `newWindowContextId` state tracking
- [ ] Add expiration logic (30s timeout, reset on nav mode exit)
- [ ] Add Shift+Enter handler outside navigation mode
- [ ] Add `chromeService.createWindow()` method
- [ ] Add visual hints in TabsView ("Enter: Move to new")
- [ ] Add feedback after first Enter ("✓ New window created")
- [ ] Handle edge cases (last tab, incognito, external close)
- [ ] Integrate with Tab Menu (Move → New Window)
- [ ] Test batch-moving multiple tabs
- [ ] Test Shift+Enter from Active Tab Info
