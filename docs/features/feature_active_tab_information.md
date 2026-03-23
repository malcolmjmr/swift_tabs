## Feature: Active Tab Information Display

**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Tab Context Awareness

---

### Description

When the user performs a short right-click within the active tab, display an overlay showing the current tab's information along with adjacent tabs. This provides immediate context about the current browsing position without requiring the user to scan the tab bar.

---

### Trigger

- **Activation:** Automatically appears upon **URL navigation** (switching tabs or loading a new URL).
- **Symbol:** Includes the **symbol of the Meta key** (⌘ on Mac, ⊞ on Windows) as a hint for the Tab Menu.

---

### Visibility & Persistence

- **Auto-Hide:** Automatically hides when the user **scrolls down** on the web page.
- **On-Demand Show:** Optionally reappears when the user **scrolls up** (providing quick context while reading).
- **Manual Dismiss:** Click outside overlay, press Escape, or scroll down.

---

### Quick Actions

| Action | Icon | Behavior |
|--------|------|----------|
| Share | Share icon | Copy URL to clipboard, show brief confirmation |
| Reload | Refresh icon | Reload active tab immediately |
| Save | Star/bookmark icon | Save to bookmarks (behavior varies by window state) |

**Save Action Behavior:**
- If unsaved window: Open bookmark menu to select folder/create new
- If saved window ("space"): Auto-save to matching bookmark folder
- If already bookmarked: Allow editing bookmark details

---

### Visual Design

**Layout:**
```
┌─────────────────────────────┐
│  [Favicon] Tab Title Above  │  ← Previous tab (smaller)
├─────────────────────────────┤
│      [Large Favicon]        │  ← Active tab (highlighted)
│      Full Tab Title         │
│  [Share] [Reload] [Save]    │  ← Quick actions
├─────────────────────────────┤
│  [Favicon] Tab Title Below  │  ← Next tab (smaller)
└─────────────────────────────┘
```

**Styling:**
- Centered overlay, floating near cursor or screen center
- Semi-transparent backdrop to focus attention
- Active tab has accent border or highlight
- Adjacent tabs muted/grayed

---

### Dismissal

- **Auto-dismiss:** When user releases right-click (mouse up)
- **Manual dismiss:** Click outside overlay, press Escape
- **Transition:** Fade out over 200ms

---

### Code References

- Implementation: `Toolbar.svelte`, `ActiveTabLabel.svelte`
- Trigger: `App.svelte` right-click handlers (lines 200-300)
- State: Local component state in `Toolbar`
- Store access: `activeTabId`, `currentWindowTabs` (read-only)

---

### Dependencies

- `tabStore` for tab data
- Chrome API for reload action
- Clipboard API for share action
- Bookmarks API for save action

---

### Future Enhancements

- Show more adjacent tabs (2 above, 2 below)
- Tab preview thumbnails instead of just favicons
- Pinned tab indicator
- Audio playing indicator
- Loading state indicator
