## Feature: Tab Close with Undo

**Status:** Planned  
**Priority:** Medium  
**Addresses Need:** Quick Recovery

---

### Description

Allow users to close tabs via a quick gesture while providing a temporary undo option. This safety net prevents accidental data loss while maintaining gesture efficiency.

---

### Trigger

**Gesture:** Vertical swipe left while in navigation mode

**Detection:**
1. User holds right-click (in navigation mode)
2. User moves mouse left significantly (50+ px)
3. System detects horizontal movement while right-click held
4. Movement direction = close action

---

### Flow

```
User swipes left while holding right-click
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
    │  (bottom of modal)  │
    │  "Undo close"       │
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
    │ (same pos)  │  │ Button gone │
    └─────────────┘  └─────────────┘
```

---

### Undo UI

**Appearance:**
- Small pill-shaped button
- Position: Bottom center of modal or floating near cursor
- Text: "Undo" or "↶ Undo close"
- Optional: Show closed tab's favicon + truncated title

**Timing:**
- Appears: Immediately after close
- Persists: 5 seconds
- Fades: Smooth fade out at 4.5s, gone at 5s
- Reset: Clicking Undo cancels timer

**Dismissal:**
- Click Undo: Restores tab
- Timeout: Undo option expires
- Other action: Dismisses early

---

### Technical Details

**Close Implementation:**
- Uses: `chrome.tabs.remove(tabId)`
- Store method: `tabStore.closeTab(tabId)`

**Undo Implementation:**
- Store closed tab data: URL, title, favicon, index, windowId
- Restore via: `chrome.tabs.create({ url, index, windowId })`
- Ideally restore history via: `chrome.sessions` API (if available)

**State Management:**
```javascript
// Local state in component
let lastClosedTab = null;
let undoTimeout = null;
let showUndoButton = false;
```

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Close last tab | Handle window closure gracefully |
| Close pinned tab | Extra confirmation or different gesture |
| Tab closes externally | Don't show undo (not our action) |
| Multiple rapid closes | Show single undo for most recent, or stack |
| Undo after navigation | Still works if window/tab context preserved |
| Tab can't restore (private) | Show error or skip undo |

---

### Gesture Alternatives

If swipe detection proves unreliable, consider:
- **Button:** Small X button on active tab display
- **Key combo:** Right-click + key while holding
- **Menu option:** "Close this tab" in actions menu

---

### Code References (Planned)

- Gesture detection: `App.svelte` (extend existing handlers)
- Undo UI: `Toolbar.svelte` or `QuickActions.svelte`
- Restore logic: `tabStore` new method

---

### Dependencies

- Chrome Tabs API (remove, create)
- Chrome Sessions API (optional, for history restore)
- Timer management in component state
