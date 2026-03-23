## Feature: Overview Widget

**Status:** Implemented  
**Priority:** High  
**Addresses Needs:** Tab Context Awareness, Window Management

---

### Description

A comprehensive window and tab management interface activated by long-press right-click. Provides bird's-eye view of all open tabs and windows with navigation, organization, and management capabilities.

---

### Trigger

**User Action:** Long-press right-click (hold for 500ms+)

**Detection:**
- Right-click detected
- Timer starts (500ms threshold)
- If user holds without moving significantly → trigger overview
- If user releases early → active tab info display instead

---

### Widget Structure

```
┌─────────────────────────────────────────────┐
│  [★ Save]  Window Title          [× Close] │  ← Header
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │     Main Content Area               │   │
│  │                                     │   │
│  │   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐         │   │
│  │   │F│ │F│ │F│ │F│ │F│ │F│         │   │  ← Tab favicons
│  │   │A│ │B│ │C│ │D│ │E│ │F│         │   │    (wrapped)
│  │   └─┘ └─┘ └─┘ └─┘ └─┘ └─┘         │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  [+]   ● ○ ○ ○ ○   (3 windows, 12 tabs)  [↗]│  ← Footer
│  Create  Window Dots    Stats           Expand│
└─────────────────────────────────────────────┘
```

---

### Sections

#### 1. Header

**Left - Save Button:**
- Star icon
- Saves unsaved window as session
- Click prompts for/edit title

**Center - Window Title:**
- Displays saved session name or "Window N"
- Editable when saved

**Right - Close Button:**
- X icon
- Dismisses widget

---

#### 2. Main Content Area

**Tab Display:**
- Wrapped row of favicons from active window
- Hover shows tab title (tooltip or header update)
- Click navigates to tab

**Window Navigation:**
- Clicking footer dots updates main content to show that window's tabs
- Visual feedback on which window is active

---

#### 3. Footer

**Left - Create Button:**
- Plus icon
- Opens menu: New window, New incognito, New saved session

**Center - Window Dots:**
- One dot per open window
- Active window: Different color or glow
- Saved windows: Unique color indicator
- Click to switch context to that window

**Stats Display:**
- Between dots and expand: "(N windows, M tabs)"

**Right - Expand Button:**
- Expand/fullscreen icon
- Opens expanded view (see [Window Merge & Move](./feature_window_merge_move.md))

---

### Navigation Flow

```
User long-presses right-click
              │
              ▼
    ┌─────────────────────┐
    │ Overview appears    │
    │ (center of screen)  │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ User can:           │
    │ • Click footer dot  │
    │ • Click tab favicon │
    │ • Click Save button │
    │ • Click Expand      │
    │ • Release to dismiss│
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Click footer dot    │
    │ → Main content      │
    │   updates to show   │
    │   that window's tabs│
    └─────────────────────┘
```

---

### State Management

**Local State:**
- `overviewIsOpen`: Boolean visibility
- `selectedWindowId`: Currently displayed window in main content
- `isExpanded`: Expanded view mode

**Global Store:**
- `windows`: All open windows (for dots and switching)
- `currentWindowTabs`: Tabs for active window
- `activeWindowId`: Which window is actually focused

---

### Visual States

**Collapsed (Default):**
- Compact modal, ~400px wide
- Shows active window tabs only
- Footer with dots and stats

**Expanded:**
- Full-width overlay or larger modal
- Shows all windows side-by-side or grid
- Drag-and-drop between windows enabled
- See [Window Merge & Move](./feature_window_merge_move.md)

---

### Code References

- Widget container: `Toolbar.svelte` (contains Overview logic)
- Window views: `WindowsView.svelte`, `WindowView.svelte`
- Footer: `WindowsFooter.svelte`
- Tab display: `TabList.svelte`, `TabListItem.svelte`
- Dots: `WindowDots.svelte`

---

### Related Features

- [Window Save & Session Management](./feature_window_save_sessions.md) - Save button functionality
- [Window Merge & Move](./feature_window_merge_move.md) - Expanded view functionality
- [Saved Session Browser](./feature_saved_session_browser.md) - Horizontal swipe reveals sessions

---

### Future Enhancements

- **Search:** Filter tabs within overview
- **Sort:** Reorder tabs via drag-and-drop
- **Batch actions:** Select multiple tabs for close/move
- **Recently closed:** Section in overview for recently closed tabs
