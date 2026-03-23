## Feature: Tab Reorder with Scroll

**Status:** Planned  
**Priority:** Medium  
**Addresses Need:** Tab Management (Need 3)

---

### Description

Reorder tabs within the current window and move tabs between windows using Alt+scroll gestures while in navigation mode. Provides an intuitive, two-dimensional control for tab organization without precise drag-and-drop operations.

---

### Two-Dimensional Control Model

Alt+scroll provides two distinct actions based on scroll direction:

| Scroll Direction | Action | Result |
|------------------|--------|--------|
| **Alt + Scroll Up/Down** | Reorder within window | Move tab earlier/later in current window's tab index |
| **Alt + Scroll Horizontal** | Move between windows | Move selected tab to different window |

**Visual Model:**
```
                    Scroll Up (earlier index)
                           ↑
                           │
    Scroll Left ←─────────●─────────→ Scroll Right
    (move to prev         │          (move to next
     window)              │           window)
                           │
                           ↓
                    Scroll Down (later index)
```

---

### Interaction Design

#### Alt + Scroll Up/Down (Reorder Within Window)

**Use Case:** Organize tabs within the current window by changing their order.

**Gesture:**
1. Enter navigation mode (Space key)
2. Select a tab (vertical scroll to choose)
3. Hold **Alt** + scroll **up** to move tab earlier in the list
4. Hold **Alt** + scroll **down** to move tab later in the list
5. Release Alt when done

**Visual Feedback:**
```
Before:                    After Alt+Scroll Down:
┌─────────────────────┐    ┌─────────────────────┐
│  1. Tab A           │    │  1. Tab A           │
│  2. Tab B  ←──────  │    │  2. Tab C           │
│  3. Tab C           │    │  3. Tab B  ←──────  │
│  4. Tab D           │    │  4. Tab D           │
└─────────────────────┘    └─────────────────────┘
      Selected: Tab B              Tab B moved down
      Position: 2 of 4             Position: 3 of 4
```

**Position Indicator:**
- Shows "3 of 8" or similar as tab moves
- Updates in real-time during scroll
- Brief highlight on new position

---

#### Alt + Scroll Horizontal (Move to Different Window)

**Use Case:** Move a tab from current window to another window.

**Gesture:**
1. Enter navigation mode (Space key)
2. Select a tab (vertical scroll to choose)
3. Hold **Alt** + scroll **left** to move tab to previous window
4. Hold **Alt** + scroll **right** to move tab to next window
5. Tab moves immediately on threshold; selection updates to next tab in original window

**Visual Feedback:**
```
Window 1:                      Window 2:
┌───────────────────┐          ┌───────────────────┐
│  1. Tab A         │          │  1. Tab X         │
│  2. Tab B  ───────┼────────→ │  2. Tab Y         │
│  3. Tab C         │  moved   │  3. Tab B  ←────  │
└───────────────────┘          │  4. Tab Z         │
                               └───────────────────┘

After Alt+Scroll Right:
- Tab B moves from Window 1 to Window 2
- Selection in Window 1 moves to Tab C (next after B)
```

---

### Technical Implementation

**Wheel Handler Integration:**

```javascript
function handleWheel(event) {
    // Priority 1: Alt + any scroll = reorder/move actions
    if (isInNavigationMode && event.altKey && selectedTab) {
        const isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
        
        if (isVertical) {
            // Alt + vertical scroll = reorder within window
            handleReorderWithinWindow(event.deltaY);
        } else {
            // Alt + horizontal scroll = move to different window
            handleMoveToWindow(event.deltaX);
        }
        
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    
    // Priority 2: Regular navigation scroll (no Alt)
    if (!toolbarIsInFocus && (isInNavigationMode || event.metaKey)) {
        const isVerticalScroll = Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            handleVerticalScroll(event.deltaY);  // Navigate tabs
        } else {
            handleHorizontalScroll(event.deltaX); // Navigate containers
        }
        event.preventDefault();
        event.stopPropagation();
    }
}
```

**Reorder Handler (Within Window):**

```javascript
let reorderScrollDelta = 0;
const REORDER_THRESHOLD = 50; // Smaller than navigation threshold

function handleReorderWithinWindow(deltaY) {
    reorderScrollDelta += deltaY;
    
    if (Math.abs(reorderScrollDelta) >= REORDER_THRESHOLD) {
        const direction = reorderScrollDelta > 0 ? 1 : -1; // Down = later, Up = earlier
        reorderScrollDelta = 0;
        
        moveTabWithinWindow(selectedTab.id, direction);
    }
}

async function moveTabWithinWindow(tabId, direction) {
    // Get current window and tabs
    const window = get(windows).find(w => w.id === selectedTab.windowId);
    if (!window?.tabs) return;
    
    const tabs = [...window.tabs].sort((a, b) => a.index - b.index);
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    if (currentIndex < 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
    if (newIndex === currentIndex) {
        showEdgeFeedback(direction); // Bounce effect at edge
        return;
    }
    
    // Move via Chrome API
    await chromeService.moveTabWithinWindow(tabId, newIndex);
    await tabStore.refreshState();
    
    // Visual feedback
    showReorderFeedback(newIndex, tabs.length);
}
```

**Move to Window Handler:**

```javascript
let moveToWindowDelta = 0;
const MOVE_WINDOW_THRESHOLD = 100; // Larger threshold for window moves

function handleMoveToWindow(deltaX) {
    moveToWindowDelta += deltaX;
    
    if (Math.abs(moveToWindowDelta) >= MOVE_WINDOW_THRESHOLD) {
        const direction = moveToWindowDelta > 0 ? 1 : -1; // Right = next window, Left = prev
        moveToWindowDelta = 0;
        
        moveTabToAdjacentWindow(selectedTab.id, direction);
    }
}

async function moveTabToAdjacentWindow(tabId, direction) {
    // Get all windows sorted
    const windowsList = [...get(windows)]
        .filter(w => w.tabs.length > 0 || w.id === selectedTab.windowId)
        .sort((a, b) => a.id - b.id);
    
    const currentWindowId = selectedTab.windowId;
    const currentWindowIndex = windowsList.findIndex(w => w.id === currentWindowId);
    
    if (currentWindowIndex < 0) return;
    
    // Calculate target window
    const targetIndex = currentWindowIndex + direction;
    if (targetIndex < 0 || targetIndex >= windowsList.length) {
        showEdgeFeedback(direction); // No window in that direction
        return;
    }
    
    const targetWindow = windowsList[targetIndex];
    const currentTabIndex = get(currentWindowTabs)
        .findIndex(t => t.id === tabId);
    
    // Move tab
    await tabStore.moveTab(tabId, targetWindow.id);
    await tabStore.refreshState();
    
    // Update selection to next tab in original window
    const updatedTabs = get(currentWindowTabs).sort((a, b) => a.index - b.index);
    if (updatedTabs.length > 0) {
        const nextIndex = Math.min(currentTabIndex, updatedTabs.length - 1);
        selectedTab = updatedTabs[nextIndex];
    } else {
        selectedTab = null;
    }
    
    showMoveFeedback(targetWindow);
}
```

---

### Chrome Service Methods

```javascript
// In src/services/chromeApi.js

async moveTabWithinWindow(tabId, newIndex) {
    return new Promise((resolve, reject) => {
        chrome.tabs.move(tabId, { index: newIndex }, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

async moveTab(tabId, windowId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.move(tabId, { windowId: windowId, index: -1 }, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}
```

---

### Visual Feedback

**Reordering Within Window:**

| State | Visual |
|-------|--------|
| **Tab lifting** | Selected tab scales up 5%, shadow appears |
| **Moving** | Ghost outline shows original position, tab follows cursor |
| **New position** | Brief pulse/highlight on new position |
| **Edge reached** | Bounce effect (tab tries to move but can't) |
| **Position indicator** | "3 of 8" badge above tab list, updates in real-time |

**Moving Between Windows:**

| State | Visual |
|-------|--------|
| **Initiated** | Tab "detaches" with animation |
| **Target window** | Brief highlight on target window in Windows Overview |
| **Completed** | Tab appears in target window, selection updates in source |
| **No target** | Shake/bounce if trying to move past first/last window |

**Position Indicator UI:**
```
┌─────────────────────────────────────┐
│           3 of 8                    │  ← Position badge
│                                     │
│  [Tab A]                            │
│  [Tab B]  ←─── Selected, reordering │
│  [Tab C]                            │
└─────────────────────────────────────┘
```

---

### State Management

**Component State:**
```javascript
// In App.svelte
let reorderScrollDelta = 0;
let moveToWindowDelta = 0;
let isReordering = false;
let isMovingToWindow = false;
let currentPosition = { index: 0, total: 0 };

const REORDER_THRESHOLD = 50;
const MOVE_WINDOW_THRESHOLD = 100;
```

**Store Enhancement:**
```javascript
// In tabStore
async moveTabWithinWindow(tabId, newIndex) {
    await chromeService.moveTabWithinWindow(tabId, newIndex);
    await this.refreshState();
}

async moveTab(tabId, targetWindowId) {
    await chromeService.moveTab(tabId, targetWindowId);
    await this.refreshState();
}
```

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| **At first position, scroll up** | Visual bounce feedback; tab stays at position 1 |
| **At last position, scroll down** | Visual bounce feedback; tab stays at last position |
| **At first window, scroll left** | Visual bounce; can't move before first window |
| **At last window, scroll right** | Visual bounce; can't move after last window |
| **Pinned tabs** | Chrome prevents moving normal tabs before pinned tabs. Handle gracefully — show "Can't move before pinned tabs" hint. |
| **Only one window** | Alt+scroll horizontal shows "No other windows" feedback |
| **Only one tab** | Alt+scroll up/down shows "Only one tab" feedback |
| **Scroll momentum** | Trackpad momentum may trigger multiple moves. Use debouncing and appropriate thresholds. |
| **Moving pinned tab** | Allowed — pinned tabs can be reordered among themselves |
| **Cross-window with pinned** | Moving tab with pinned status to new window preserves pinned state |

---

### Multi-Select (Future Enhancement)

**Modifier + Scroll (No Alt):**
- Another modifier key (e.g., Ctrl/Cmd) + scroll up/down selects multiple tabs
- No horizontal scroll in multi-select mode
- Selected tabs highlighted with checkmarks
- Batch operations: Delete, Move, Sleep

**Visual:**
```
┌─────────────────────────────────────┐
│  ☑ [Tab A]                          │
│  ☑ [Tab B]  ←── Multi-selected      │
│  ☐ [Tab C]                          │
└─────────────────────────────────────┘
```

---

### Code References

**Implementation Locations:**
- `src/App.svelte` — Wheel handler for Alt+scroll detection
- `src/stores/tabStore.js` — `moveTabWithinWindow()`, `moveTab()`
- `src/services/chromeApi.js` — `moveTabWithinWindow()`, `moveTab()`
- `src/components/tabs_view/` — Visual feedback components

**Related Features:**
- `feature_tab_context_menu.md` — Alternative: Move via Tab Menu
- `feature_move_to_new_window.md` — Move to New Window via Enter key

---

### Implementation Checklist

- [ ] Add Alt key detection to wheel handler in App.svelte
- [ ] Implement `handleReorderWithinWindow()` for Alt+vertical scroll
- [ ] Implement `handleMoveToWindow()` for Alt+horizontal scroll
- [ ] Add `chromeService.moveTabWithinWindow()` method
- [ ] Add `tabStore.moveTabWithinWindow()` method
- [ ] Add position indicator UI ("X of Y" badge)
- [ ] Add visual feedback: tab "lifting" during reorder
- [ ] Add visual feedback: tab "detaching" during window move
- [ ] Add edge bounce feedback for first/last position/window
- [ ] Handle pinned tab edge case (can't move before pinned)
- [ ] Test with trackpad momentum scrolling
- [ ] Add keyboard alternative: Alt+Arrow Up/Down for reorder, Alt+Arrow Left/Right for window
- [ ] Add hint in TabsView: "Alt+Scroll: Reorder/Move"
