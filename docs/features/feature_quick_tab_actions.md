## Feature: Quick Tab Actions

**Status:** Partially Implemented  
**Priority:** High  
**Addresses Need:** Tab Lifecycle Management

---

### Description

Provide one-click access to common tab actions directly from the gesture interface. Eliminates the need to hunt for small browser chrome controls.

---

### Implemented Actions

#### 1. Share (Copy URL)

**Trigger:** Click share icon in active tab display

**Behavior:**
- Copies current tab URL to clipboard
- Shows brief "Copied!" confirmation (toast or icon animation)
- Dismisses after 1 second

**Technical:**
- Uses Clipboard API: `navigator.clipboard.writeText(url)`
- Graceful fallback for older browsers

**Status:** ✅ Implemented

---

#### 2. Reload

**Trigger:** Click reload icon in active tab display

**Behavior:**
- Immediately reloads active tab
- Icon shows spin animation during reload
- No other UI change

**Technical:**
- Uses Chrome API: `chrome.tabs.reload(tabId)`
- Bypass cache option available (not exposed in UI)

**Status:** ✅ Implemented

---

### Planned Actions

#### 3. Save (Bookmark)

**Trigger:** Click star/bookmark icon

**Behavior - Unsaved Window:**
- Opens bookmark folder selector
- User selects folder or creates new
- Tab saved as bookmark in selected location

**Behavior - Saved Window ("Space"):**
- Auto-saves to matching bookmark folder (same name as space)
- Shows "Saved to [Space Name]" confirmation
- No user input required

**Behavior - Already Bookmarked:**
- Shows bookmark details in editable form
- User can change folder, edit title, remove bookmark

**Technical:**
- Uses Chrome Bookmarks API
- Stores bookmark ID to detect existing bookmarks
- Syncs with Chrome's bookmark bar/folders

**Status:** 🔄 Partially Implemented (needs session integration)

---

#### 4. Duplicate Tab

**Trigger:** Available in menu (not main display)

**Behavior:**
- Creates copy of current tab in same window
- Preserves history (back button works)
- Positions next to original tab

**Technical:**
- Uses: `chrome.tabs.duplicate(tabId)`

**Status:** 📋 Planned

---

#### 5. Pin/Unpin Tab

**Trigger:** Available in menu

**Behavior:**
- Toggles pinned state
- Shows visual indicator change

**Technical:**
- Uses: `chrome.tabs.update(tabId, { pinned: true/false })`

**Status:** 📋 Planned

---

### UI Layout

```
┌─────────────────────────────────────┐
│         [Tab Title]                 │
│                                     │
│    ┌─────┐ ┌─────┐ ┌─────┐         │
│    │Share│ │Reload│ │Save │         │
│    └─────┘ └─────┘ └─────┘         │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- Icons should be recognizable at small sizes
- Click targets minimum 44x44px
- Visual feedback on hover and click
- Disabled state if action unavailable

---

### Code References

- Implementation: `Toolbar.svelte`, `QuickActions.svelte`
- Store methods: `tabStore.reloadTab()`, `tabStore.closeTab()`, etc.
- Chrome service: `chromeService` for API calls

---

### Future Considerations

- **Mute/Unmute:** Audio indicator in tab display
- **Discard/Undiscard:** Memory management for inactive tabs
- **Move to New Window:** Alternative to complex move menu
- **Send to Device:** Chrome sync integration
