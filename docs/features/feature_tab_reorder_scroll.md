## Feature: Tab Reorder with Scroll

**Status:** Planned
**Priority:** Medium
**Addresses Need:** Tab Lifecycle Management (Need 3)

---

### Description

Reorder tabs within the current window using scroll gestures while in navigation mode. Provides an intuitive way to organize tabs without precise drag-and-drop operations.

---

### Motivation

Current drag-and-drop for tab reordering:
- Requires precise mouse positioning
- Small hit targets for drop zones
- Difficult with many tabs
- Breaks flow when organizing multiple tabs

Scroll-based reordering:
- Natural gesture (scroll = movement)
- Works with existing navigation mode
- Larger, more forgiving interaction
- Keeps hands on scroll device (trackpad/mouse wheel)

---

### Interaction Design

#### Option A: Modifier + Scroll (Selected)

**Gesture:**
1. Enter navigation mode (press Space)
2. Select a tab (scroll vertically to choose)
3. Hold `Alt` (or `Option` on Mac) + scroll horizontally
4. Tab moves left/right through positions
5. Release `Alt` to confirm position

**Visual Feedback:**
```
┌─────────────────────────────────────┐
│                                     │
│  [Tab A]  [Tab B]  [Tab C]  [Tab D] │
│           ↑                        │
│         Selected                    │
│                                     │
└─────────────────────────────────────┘

After Alt+Scroll Right:
┌─────────────────────────────────────┐
│                                     │
│  [Tab A]  [Tab C]  [Tab B]  [Tab D] │
│                   ↑                │
│                 Moved right         │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
```javascript
function handleWheel(event) {
    if (isInNavigationMode && event.altKey) {
        // Horizontal scroll while holding Alt = reorder
        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (isHorizontal) {
            const direction = event.deltaX > 0 ? 1 : -1;
            reorderTab(selectedTab.id, direction);
        }
    }
}
```

#### Option B: Dedicated Reorder Mode

**Flow:**
1. Enter navigation mode
2. Select tab
3. Press `r` to enter "reorder mode"
4. Scroll left/right to move tab
5. Press `Space` or `Enter` to confirm
6. Press `Escape` to cancel

**Downsides:**
- Requires mode switching
- Less immediate than modifier

#### Option C: Direct Scroll on Tab Bar

**Flow:**
1. In overview widget (TabsView)
2. Hover over tab list
3. Scroll horizontally to scroll through tabs
4. With modifier (Ctrl/Alt), scroll moves selected tab

---

### Selected Implementation: Option A

**Modifier Key:** `Alt` (Option on Mac)

**Reasoning:**
- Most intuitive (Alt = alternate action)
- Doesn't conflict with existing shortcuts
- Works on both trackpads and mouse wheels
- Consistent with other modifier-based actions

---

### Technical Implementation

**Integration with existing wheel handler:**

Current handler in `App.svelte`:
```459:473:src/App.svelte
function handleWheel(event) {
    if (!toolbarIsInFocus && (isInNavigationMode || event.metaKey)) {
        let isVerticalScroll =
            Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            handleVerticalScroll(event.deltaY);
        } else {
            handleHorizontalScroll(event.deltaX);
        }
        event.preventDefault();
        event.stopPropagation();
    }
}
```

**Enhanced version:**

```javascript
function handleWheel(event) {
    // Tab reordering: Alt + horizontal scroll in navigation mode
    if (isInNavigationMode && event.altKey && selectedTab) {
        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (isHorizontal) {
            handleReorderScroll(event.deltaX);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }
    
    // Existing navigation scroll
    if (!toolbarIsInFocus && (isInNavigationMode || event.metaKey)) {
        let isVerticalScroll = Math.abs(event.deltaX) < Math.abs(event.deltaY);
        if (isVerticalScroll) {
            handleVerticalScroll(event.deltaY);
        } else {
            handleHorizontalScroll(event.deltaX);
        }
        event.preventDefault();
        event.stopPropagation();
    }
}
```

**Reorder Handler:**

```javascript
let reorderScrollDelta = 0;
const REORDER_THRESHOLD = 50; // Smaller than navigation threshold

function handleReorderScroll(deltaX) {
    reorderScrollDelta += deltaX;
    
    if (Math.abs(reorderScrollDelta) >= REORDER_THRESHOLD) {
        const direction = reorderScrollDelta > 0 ? 1 : -1;
        reorderScrollDelta = 0;
        
        // Move tab
        moveTabByOffset(selectedTab.id, direction);
    }
}

async function moveTabByOffset(tabId, direction) {
    // Get current window and tabs
    const window = get(windows).find(w => w.id === selectedTab.windowId);
    if (!window?.tabs) return;
    
    const tabs = [...window.tabs].sort((a, b) => a.index - b.index);
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    if (currentIndex < 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
    if (newIndex === currentIndex) return;
    
    // Move via Chrome API
    await chromeService.moveTabWithinWindow(tabId, newIndex);
    
    // Refresh state
    await tabStore.refreshState();
    
    // Visual feedback
    showReorderFeedback(newIndex);
}
```

**Chrome Service Method:**

```javascript
// In src/services/chromeApi.js
async moveTabWithinWindow(tabId, newIndex) {
    return new Promise((resolve) => {
        chrome.tabs.move(tabId, { index: newIndex }, resolve);
    });
}
```

---

### Visual Feedback

**Tab Movement Animation:**
- Show tab "lifting" from position
- Animate to new position
- Brief highlight on new position

**Position Indicator:**
- Show current position number (e.g., "3 of 8")
- Update as tab moves

**Edge Feedback:**
- When at first position and scroll left: visual "bounce" effect
- When at last position and scroll right: visual "bounce" effect

---

### State Management

**Existing State Used:**
- `isInNavigationMode`: Must be active
- `selectedTab`: Tab to reorder
- `windows`: For tab list

**New State:**
```javascript
let reorderScrollDelta = 0;
let isReordering = false;  // For visual feedback
```

**Store Enhancement:**
```javascript
// In tabStore
async moveTabWithinWindow(tabId, newIndex) {
    await chromeService.moveTabWithinWindow(tabId, newIndex);
    await this.refreshState();
}
```

---

### Integration with TabsView

**Props passed to TabsView:**
```svelte
<TabsView
    windows={$windows}
    bind:currentTab
    bind:selectedTab
    isReordering={isReordering}
    reorderDirection={reorderDirection}
/>
```

**In TabList.svelte or TabListItem.svelte:**
```svelte
<div class="tab-list-item" class:reordering={isReordering && tab.id === selectedTab.id}>
    <!-- Tab content -->
</div>

<style>
    .tab-list-item.reordering {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10;
    }
</style>
```

---

### Edge Cases

1. **Last tab in window:**
   - Moving left: normal
   - Moving right: no-op with visual feedback

2. **Pinned tabs:**
   - Chrome prevents moving normal tabs before pinned tabs
   - Handle API error gracefully

3. **Multiple windows:**
   - Reordering only affects current window
   - No cross-window reordering (that's "move", not "reorder")

4. **Scroll momentum:**
   - Trackpad scroll has momentum
   - May trigger multiple moves
   - Use debouncing or larger threshold

---

### Alternative: Hold to Reorder

Another pattern to consider:

1. Select tab
2. Hold `Alt` (shows "reorder mode" indicator)
3. Scroll to move
4. Release `Alt` to confirm

This is more explicit than just Alt+Scroll.

---

### Code References

- **Wheel Handler:** `src/App.svelte` lines 459-473, 495-524, 526-549
- **Tab Store:** `src/stores/tabStore.js` - needs `moveTabWithinWindow()`
- **Chrome Service:** `src/services/chromeApi.js` - needs `moveTabWithinWindow()`
- **TabsView:** `src/components/tabs_view/TabsView.svelte`
- **TabListItem:** `src/components/windows/TabListItem.svelte`

---

### Implementation Checklist

- [ ] Add Alt+scroll detection in handleWheel
- [ ] Implement handleReorderScroll function
- [ ] Create moveTabByOffset function
- [ ] Add chromeService.moveTabWithinWindow()
- [ ] Add tabStore.moveTabWithinWindow()
- [ ] Add reordering state for visual feedback
- [ ] Update TabsView/TabListItem with reordering styles
- [ ] Add position indicator UI
- [ ] Test with trackpad momentum scrolling
- [ ] Handle pinned tab edge case
- [ ] Add keyboard alternative (Alt+Arrow keys)
