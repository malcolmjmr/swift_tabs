## Feature: Tab Close with Undo

**Status:** Planned  
**Priority:** Medium  
**Addresses Needs:** Quick Recovery (Need 5), Tab Management (Need 3)

---

### Description

Any tab close action (**Delete/Backspace** in navigation mode or **idle** browsing when selection is empty, Close from Tab Menu, or Close Variants) should provide a temporary undo option. This safety net prevents accidental data loss while maintaining efficient workflows.

**Current implementation:** `tabStore.closeTab` is used for both navigation-mode and idle closes; dedicated undo UI described below is **not** yet wired for all paths.

**Note:** This is not a separate close gesture — it's an undo system that applies to all close actions.

---

### When Undo Appears

Undo is available after:
- **Delete/Backspace key** in navigation mode (closes selected tab)
- **Delete/Backspace key** while idle (closes active tab when there is no text selection and the key is not auto-repeating)
- **Close** action from Tab Menu (basic action)
- **Close Others** or **Close to the Right** from Tab Menu submenu

Undo does NOT appear when:
- Tab closes externally (user closes via Chrome UI)
- Tab crashes or is discarded by Chrome
- Window closes (handled separately)

---

### Undo UI

**Appearance:**
- Small pill-shaped button
- Position: Bottom center of Active Tab Info or Tab Menu
- Text: "↶ Undo close" or "Undo: [Tab Title]"
- Optional: Show closed tab's favicon + truncated title

**Timing:**
- Appears: Immediately after close
- Persists: 5 seconds
- Fades: Smooth fade out at 4.5s, gone at 5s
- Reset: Clicking Undo cancels timer; another close resets timer

**Dismissal:**
- Click Undo: Restores tab
- Timeout: Undo option expires
- Another action: Dismisses early (except another close, which shows new undo)

---

### Flow

```
User in navigation mode
              │
              ▼
    Press Delete/Backspace
              │
              ▼
    ┌─────────────────────┐
    │   Tab closes        │
    │   (immediate)       │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Undo button appears│
    │  "↶ Undo: GitHub"   │
    │  (5s timeout)       │
    └─────────────────────┘
              │
              ├──────────────┐
              │              │
              ▼              ▼
    ┌─────────────┐  ┌─────────────┐
    │ User clicks │  │ 5s timeout  │
    │ "Undo"      │  │ expires     │
    └─────────────┘  └─────────────┘
              │              │
              ▼              ▼
    ┌─────────────┐  ┌─────────────┐
    │ Tab restored│  │ Undo removed│
    │ (same pos)  │  │ Gone        │
    └─────────────┘  └─────────────┘
```

---

### Multiple Closes

**Behavior:**
- Each close adds to the "undo stack" (up to 5 tabs)
- Undo button shows most recent: "↶ Undo: [Last Tab Title] (+2 more)"
- Clicking undo restores most recent tab first
- Subsequent clicks restore earlier tabs

**Visual:**
```
Closed 3 tabs rapidly:
┌─────────────────────────────┐
│  ↶ Undo: GitHub (+2 more)   │
│         4s remaining        │
└─────────────────────────────┘
```

---

### Technical Implementation

**Close Tracking:**
```javascript
// In tabStore or App.svelte
let closedTabsStack = []; // Array of closed tab data
let undoTimeout = null;
const UNDO_TIMEOUT_MS = 5000;
const MAX_UNDO_STACK = 5;

function onTabClosed(tabId) {
    // Get tab data before it's gone
    const tabData = {
        id: tabId,
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
        index: tab.index,
        windowId: tab.windowId,
        timestamp: Date.now()
    };
    
    // Add to stack
    closedTabsStack.unshift(tabData);
    
    // Limit stack size
    if (closedTabsStack.length > MAX_UNDO_STACK) {
        closedTabsStack.pop();
    }
    
    // Show undo UI
    showUndoButton = true;
    resetUndoTimer();
}
```

**Undo Restore:**
```javascript
async function undoClose() {
    if (closedTabsStack.length === 0) return;
    
    const tabData = closedTabsStack.shift(); // Get most recent
    
    // Restore tab
    const restoredTab = await chrome.tabs.create({
        url: tabData.url,
        index: tabData.index,
        windowId: tabData.windowId,
        active: false
    });
    
    // Optionally restore history via chrome.sessions
    await restoreSessionHistory(tabData.id, restoredTab.id);
    
    // Update UI
    if (closedTabsStack.length === 0) {
        showUndoButton = false;
        clearUndoTimer();
    } else {
        resetUndoTimer(); // Reset for next undo
    }
}
```

**Timer Management:**
```javascript
function resetUndoTimer() {
    if (undoTimeout) clearTimeout(undoTimeout);
    
    undoTimeout = setTimeout(() => {
        closedTabsStack = []; // Clear stack
        showUndoButton = false;
    }, UNDO_TIMEOUT_MS);
}
```

---

### Chrome Sessions API (Optional Enhancement)

For full history restore:
```javascript
async function restoreSessionHistory(oldTabId, newTabId) {
    try {
        // Query recently closed tabs
        const sessions = await chrome.sessions.getRecentlyClosed();
        const session = sessions.find(s => 
            s.tab && s.tab.tabId === oldTabId
        );
        
        if (session) {
            // Restore session to new tab
            await chrome.sessions.restore(session.sessionId);
        }
    } catch (e) {
        console.log('Could not restore session history');
    }
}
```

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Close last tab** | Window closes; undo restores tab AND window |
| **Close pinned tab** | Pinned tabs require explicit unpin before close in Chrome; if closed, restore respects pinned state |
| **Tab closes externally** | No undo offered (wasn't our action) |
| **Multiple rapid closes** | Stack up to 5; undo restores LIFO |
| **Undo after navigation** | Works if window still exists; if window closed, creates new window |
| **Private/Incognito** | Can't restore private tabs; show "Can't undo private tab" message |
| **Tab URL changed before close** | Undo restores to last known URL |
| **Undo timeout expires** | Clear stack; user loses ability to restore those tabs |

---

### Code References

**Implementation Locations:**
- `src/App.svelte` — Delete key handler, undo state
- `src/stores/tabStore.js` — `closeTab()` method, undo stack
- `src/components/UndoButton.svelte` — Undo UI component
- `src/services/chromeApi.js` — `createTab()`, optional session restore

**Integration Points:**
- `feature_tab_context_menu.md` — Close action triggers undo
- `need_quick_recovery.md` — Undo satisfies Quick Recovery need

---

### Implementation Checklist

- [ ] Add `closedTabsStack` to track recently closed tabs
- [ ] Modify `closeTab()` to save tab data before closing
- [ ] Create UndoButton.svelte component
- [ ] Implement `undoClose()` restore function
- [ ] Add 5-second timeout with fade animation
- [ ] Handle multiple closes (stack up to 5)
- [ ] Integrate with Delete key in navigation mode
- [ ] Integrate with Tab Menu Close action
- [ ] Handle edge cases: last tab, pinned, private
- [ ] Optional: Chrome Sessions API for history restore
- [ ] Test rapid close/undo sequences
