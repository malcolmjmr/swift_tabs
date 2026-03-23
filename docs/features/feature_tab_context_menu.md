## Feature: Tab Context Menu

**Status:** Planned
**Priority:** High
**Addresses Need:** Tab Lifecycle Management (Need 3)

---

### Description

A comprehensive context menu providing access to all tab actions. Available via right-click on any tab in the overview widget or long-press gesture. Consolidates Quick Actions and Move Menu into a single, organized interface.

---

### Motivation

Currently, actions are scattered:
- Quick Actions (share, reload) in ActiveTabView
- Move Menu is a separate overlay
- Some actions (pin, duplicate, mute) not accessible

Users need a single place to access all tab operations without leaving the gesture interface.

---

### Menu Structure

```
┌─────────────────────────────────────────┐
│  Tab: "GitHub - Swift Tabs"             │
│  github.com/user/swift_tabs             │
├─────────────────────────────────────────┤
│  🔗 Copy Link                           │
│  🔄 Reload                              │
├─────────────────────────────────────────┤
│  📌 Pin Tab                      [✓]    │
│  🔇 Mute Site                           │
│  👯 Duplicate Tab                       │
├─────────────────────────────────────────┤
│  📁 Move to Window          →           │
│     ├─ Window 1 (3 tabs)                │
│     ├─ Window 2 (5 tabs)                │
│     ├─ 🆕 New Window                    │
│     └─ Save to Session...               │
├─────────────────────────────────────────┤
│  🔖 Add to Bookmarks...                 │
│  💾 Save to Session...                  │
├─────────────────────────────────────────┤
│  🗑️ Close Tab                           │
│  🗑️ Close Other Tabs                    │
│  🗑️ Close Tabs to Right                 │
└─────────────────────────────────────────┘
```

---

### Actions Specification

#### Primary Actions (Always Visible)

| Action | Icon | Behavior | Status |
|--------|------|----------|--------|
| Copy Link | 🔗 | Copy URL to clipboard | ✅ Exists |
| Reload | 🔄 | Reload tab | ✅ Exists |

#### Tab State Actions

| Action | Icon | Behavior | Toggle State |
|--------|------|----------|--------------|
| Pin/Unpin | 📌 | Toggle pinned state | Shows ✓ when pinned |
| Mute/Unmute | 🔇/🔊 | Toggle mute for tab/site | Shows 🔊 when muted |
| Discard | 💤 | Unload tab to free memory | Confirmation for active tabs |

#### Tab Operations

| Action | Icon | Behavior |
|--------|------|----------|
| Duplicate | 👯 | Create copy of tab in same position |
| Move to Window | 📁 | Opens submenu with window list + "New Window" |
| Save to Session | 💾 | Opens session selector dialog |
| Add to Bookmarks | 🔖 | Opens bookmark folder selector |

#### Close Actions

| Action | Icon | Behavior |
|--------|------|----------|
| Close Tab | 🗑️ | Close with optional undo |
| Close Other Tabs | 🗑️ | Close all tabs except this one |
| Close Tabs to Right | 🗑️ | Close all tabs after this one |

---

### Trigger Mechanisms

#### 1. Right-Click on Tab (Overview Widget)

```javascript
// In TabListItem.svelte
function handleRightClick(event) {
    event.preventDefault();
    selectedTab = tab;
    contextMenuOpen = true;
    menuPosition = { x: event.clientX, y: event.clientY };
}
```

#### 2. Long-Press on Tab (Touch)

```javascript
// Touch events with 500ms threshold
let touchTimer;
function handleTouchStart() {
    touchTimer = setTimeout(() => {
        contextMenuOpen = true;
    }, 500);
}
function handleTouchEnd() {
    clearTimeout(touchTimer);
}
```

#### 3. Dedicated Menu Button

In `ActiveTabView`, add "More" button (⋮) that opens this menu.

---

### Submenu: Move to Window

When hovering or clicking "Move to Window":

```
├─ Window 1 (3 tabs) ────────────────┐
│  ├─ Active Tab: GitHub           │
│  ├─ Tab 2: Documentation          │
│  └─ Tab 3: Stack Overflow         │
├─ Window 2 (5 tabs)               │
│  ├─ ...                           │
│  └─ ...                           │
├─ 🆕 New Window                    │
│  └─ Create empty window, move tab   │
└─ 💾 Save to Session...            │
   └─ Opens session dialog          │
```

**New Window Option:**
- Creates empty window via `chrome.windows.create()`
- Immediately moves selected tab to new window
- Switches focus to new window

---

### State Management

**Props:**
```javascript
export let tab;           // Tab object
export let windows;       // All windows for "Move to" submenu
export let sessions;      // Saved sessions for "Save to"
export let position;      // { x, y } for menu placement
```

**Events:**
```javascript
dispatch('close');              // Close menu
dispatch('reload', { tabId });
dispatch('pin', { tabId, pinned });
dispatch('mute', { tabId, muted });
dispatch('duplicate', { tabId });
dispatch('move', { tabId, windowId });  // windowId: 'new' for new window
dispatch('closeTab', { tabId });
dispatch('closeOthers', { tabId });
dispatch('closeToRight', { tabId });
dispatch('copyUrl', { url });
dispatch('bookmark', { tabId });
dispatch('saveSession', { tabId, sessionId });
```

---

### UI Behavior

**Positioning:**
- Open near cursor/touch point
- Keep within viewport bounds
- If near right edge, open to the left
- If near bottom, open upward

**Dismissal:**
- Click outside menu
- Press Escape
- Click menu item (executes action)
- Navigate to submenu (parent stays open)

**Submenu Behavior:**
- Hover to open submenu (desktop)
- Click to open submenu (touch)
- Submenu closes when mouse leaves (desktop)
- All menus close on selection

---

### Technical Implementation

**Component:** `src/components/menu/TabContextMenu.svelte`

**Replace Existing:**
- `Menu.svelte` (placeholder) → Use this
- `MoveMenu.svelte` → Integrate as submenu

**Integration Points:**
- `TabListItem.svelte`: Right-click handler
- `ActiveTabView.svelte`: "More" button
- `App.svelte`: Global menu state management

---

### Accessibility

- Menu opens on right-click (standard pattern)
- All items keyboard accessible (↑/↓/Enter/Escape)
- ARIA: `role="menu"`, `role="menuitem"`
- Focus trap within menu
- Escape always closes

---

### Code References

- **Existing Move Menu:** `src/components/menu/MoveMenu.svelte`
- **Existing Quick Actions:** `src/components/menu/QuickActions.svelte`
- **Tab Store:** `src/stores/tabStore.js` - has `moveTab`, `closeTab`, etc.
- **Chrome Service:** `src/services/chromeApi.js` - window/tab APIs

---

### Implementation Checklist

- [ ] Create TabContextMenu.svelte component
- [ ] Implement menu structure with sections
- [ ] Add right-click handler to TabListItem
- [ ] Add long-press handler for touch
- [ ] Implement Pin/Unpin action
- [ ] Implement Mute/Unmute action
- [ ] Implement Duplicate action
- [ ] Integrate Move to Window submenu
- [ ] Add "New Window" option in Move submenu
- [ ] Implement Close actions (tab, others, to right)
- [ ] Implement Copy Link action
- [ ] Implement Reload action
- [ ] Add "More" button to ActiveTabView
- [ ] Keyboard navigation (↑/↓/Enter/Escape)
- [ ] Click-outside to close
- [ ] Viewport-aware positioning
