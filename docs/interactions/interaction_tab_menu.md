## Interaction: Tab Menu

**Addresses Need:** [Tab Management](../needs/need_tab_management.md)  
**Supports Feature:** Tab Menu (Actions)

---

### Preconditions

1. Chrome extension is installed and active
2. A tab is the target for actions:
   - In Navigation Mode: Currently selected tab
   - Outside Navigation Mode: Currently active tab
3. **Meta key (from Active Tab Info):** Active Tab Info is visible OR Navigation Mode is active.
4. **Direct "a" / "m" shortcut:** No overlay required; uses the active tab from Chrome.
5. User is not in a typing context: `input`, `textarea`, `select`, or contenteditable.
6. For **"a"** / **"m"**: no modifier keys; keyboard shortcuts help panel must be closed.

---

### Flow Steps

#### Trigger Method 1: From Active Tab Info (Outside Navigation Mode)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | Tab Information Display appears | Shows on tab activation or scroll up | `activeTabInfoVisible = true` |
| 2 | User presses and holds **Meta key** | System detects Meta key press | Meta key state tracked |
| 3 | Tab Menu appears | Overlay expands showing actions | `tabMenuOpen = true` |
| 4 | User releases Meta key | Menu stays open (latch mode) | — |
| 5 | User selects action | Action executes | Depends on action |

#### Trigger Method 2: Direct Shortcut (Any Time)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses **"a"** or **"m"** (not in typing context; no modifiers) | System captures key event | — |
| 2 | System identifies current tab | Gets active tab from Chrome API | `currentTab` identified |
| 3 | Tab Menu appears | Shows with current tab as target | `tabMenuOpen = true` |
| 4 | User selects action | Action executes | Depends on action |

#### Trigger Method 3: From Navigation Mode

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User is in Navigation Mode | TabsView visible with selected tab | `isInNavigationMode = true` |
| 2 | User presses **Meta key** | Tab Menu opens for selected tab | `tabMenuOpen = true` |
| 3 | Navigation Mode stays active | Both views visible simultaneously | — |
| 4 | User selects action | Action executes | Depends on action |
| 5 | Menu closes | Returns to Navigation Mode | `tabMenuOpen = false` |

---

### Menu Structure

```
┌─────────────────────────────────────────┐
│ [🔲] Current Tab Title                  │ ← Header
│ example.com/page                        │
├─────────────────────────────────────────┤
│ Recent Actions                          │ ← Recent Section
│ ├─ Save to Task: Project Alpha          │
│ ├─ Move to New Window                   │
│ └─ Pin                                  │
├─────────────────────────────────────────┤
│ Basic Actions                           │ ← Quick Actions Grid
│ ┌─────────┬─────────┬─────────┐        │
│ │  📌    │  🔄    │  😴    │        │
│ │  Pin   │ Reload │ Sleep  │        │
│ ├─────────┼─────────┼─────────┤        │
│ │  📄    │  📋    │  🔇    │        │
│ │Duplicate│  Copy  │  Mute  │        │
│ ├─────────┼─────────┼─────────┤        │
│ │  🔍    │        │  ❌    │        │
│ │  Find  │        │ Close  │        │
│ └─────────┴─────────┴─────────┘        │
├─────────────────────────────────────────┤
│ > Save              (submenu)           │ ← Submenu Triggers
│ > Move              (submenu)           │
│ > Close Variants    (submenu)           │
│ > Appearance        (submenu)           │
└─────────────────────────────────────────┘
```

---

### Basic Actions (Immediate Execution)

| Icon | Action | Shortcut | Description |
|------|--------|----------|-------------|
| 📌 | **Pin/Unpin** | — | Toggle pinned state |
| 🔄 | **Reload** | — | Refresh the page |
| 📄 | **Duplicate** | — | Create copy of tab |
| 📋 | **Copy URL** | — | Copy URL to clipboard |
| 😴 | **Sleep** | — | Discard tab (Chrome's native) |
| 🔍 | **Find** | — | Open find-in-page |
| 🔇 | **Mute/Unmute** | — | Toggle audio mute |
| ❌ | **Close** | Delete / Backspace | **Idle:** close active tab (empty selection). **Nav mode:** close selected tab. Undo when supported |

---

### Submenu Actions (Expand to Show Options)

#### Save Submenu
```
Save
├── Save as
│   ├── Bookmark
│   ├── File
│   └── Entity (LLM-powered, future)
└── Save to
    ├── Folder
    ├── Task
    │   ├── [Recent Task 1]
    │   ├── [Recent Task 2]
    │   └── Create New...
    └── Brief (future)
```

#### Move Submenu
```
Move
├── New Window
├── Existing Windows
│   ├── Window 1 (5 tabs)
│   ├── Window 2 (3 tabs)
│   └── Window 3 (12 tabs)
├── Group/Workspace
│   ├── [Recent Group 1]
│   └── [Recent Group 2]
├── Reading List
└── Bookmarks
```

#### Close Variants Submenu
```
Close Variants
├── Close Others (all except current)
└── Close to the Right
```

#### Appearance Submenu
```
Appearance
├── Theme (Light/Dark/System)
├── Zoom (50%/75%/100%/125%/150%/200%)
└── Reader Mode
```

---

### Navigation Within Menu

| Input | Context | Action |
|-------|---------|--------|
| **↑ / ↓** | Menu open | Navigate actions vertically |
| **←** | In submenu | Close submenu, return to parent |
| **→ / Enter** | On submenu trigger | Open submenu |
| **Enter / Space** | On action | Execute action |
| **Escape** | Anywhere in menu | Close menu (or submenu if in one) |
| **Type letters** | Menu open | Filter actions by name |

---

### Visual States

#### State 1: Menu Closed (Default)
- Active Tab Info visible OR Navigation Mode active
- Menu trigger hint visible ("Hold ⌘ for menu" or "⌘: Menu")
- No menu overlay

#### State 2: Menu Open (Collapsed)
```
┌─────────────────────────────────────────┐
│ [🔲] Current Tab Title                  │
│ example.com/page                        │
├─────────────────────────────────────────┤
│ 📌 Pin        🔄 Reload      😴 Sleep   │
│ 📄 Duplicate  📋 Copy        🔇 Mute    │
│ 🔍 Find                      ❌ Close   │
├─────────────────────────────────────────┤
│ > Save                                 │
│ > Move                                 │
│ > Close Variants                       │
│ > Appearance                           │
└─────────────────────────────────────────┘
```

#### State 3: Menu with Submenu Open
```
┌─────────────────────────────────────────┐
│ [🔲] Current Tab Title                  │
│ example.com/page                        │
├─────────────────────────────────────────┤
│ > Save  ┌─────────────────────────┐     │
│         │ Save as               │     │
│         │ ├─ Bookmark             │     │
│         │ ├─ File                 │     │
│         │ └─ Entity               │     │
│         │                         │     │
│         │ Save to                 │     │
│         │ ├─ Folder               │     │
│         │ ├─ Task >               │     │
│         │ └─ Brief                │     │
│         └─────────────────────────┘     │
│ > Move                                  │
│ > Close Variants                        │
└─────────────────────────────────────────┘
```

---

### Recent Actions Algorithm

```javascript
// Recent action structure
{
  id: 'save-to-task-project-alpha',
  category: 'save',
  action: 'save_to',
  targetType: 'task',
  targetName: 'Project Alpha',
  targetId: 123,
  timestamp: Date.now(),
  useCount: 1
}

// Adding to recent
function addToRecent(action) {
  // Remove duplicates
  const filtered = recent.filter(r => 
    !(r.action === action.action && r.targetId === action.targetId)
  );
  
  // Add to front
  const updated = [action, ...filtered].slice(0, 8);
  
  // Persist
  recentActions.set(updated);
  chrome.storage.local.set({ recentActions: updated });
}
```

---

### Error Cases

| Error Condition | System Response | User Recovery |
|-----------------|-----------------|---------------|
| Tab closes while menu open | Close menu, show brief notification | N/A |
| Chrome API fails during action | Show error message in menu | Retry or close |
| No recent actions | Hide Recent section | Menu shows All Actions only |
| Submenu target not available | Disable option, show tooltip | Select different option |
| Permission denied (e.g., Copy) | Show permission error | Dismiss, try different action |

---

### State Management

```javascript
// TabMenu.svelte
let isOpen = false;
let selectedAction = null;
let activeSubmenu = null; // null | 'save' | 'move' | 'close' | 'appearance'
let filterQuery = '';
let recentActions = [];

// From stores
import { recentActionsStore } from '../stores/recentActionsStore';

// Submenu state
let submenuStack = []; // For nested submenus
```

---

### Animation Specifications

**Menu Entry:**
- Duration: 200ms
- Easing: ease-out
- Effect: Scale up (0.95 → 1.0) + fade in

**Submenu Expansion:**
- Duration: 150ms
- Easing: ease-out
- Effect: Slide out from parent item + fade in

**Selection Change:**
- Duration: 100ms
- Easing: ease-in-out
- Effect: Background color transition

**Menu Exit:**
- Duration: 150ms
- Easing: ease-in
- Effect: Scale down (1.0 → 0.95) + fade out

---

### Success Metrics

1. Menu opens within 100ms of Meta key, **"a"**, or **"m"**
2. Basic actions execute within 100ms
3. Submenu opens within 100ms
4. Recent actions provide single-tap repeat
5. User can complete any action in ≤ 3 selections
6. Menu doesn't accidentally close during use

---

### Related Interactions

- [interaction_tab_info_display.md](./interaction_tab_info_display.md) - Trigger point for menu
- [interaction_navigation_mode.md](./interaction_navigation_mode.md) - Access menu from navigation
- [interaction_windows_overview.md](./interaction_windows_overview.md) - Move actions open windows overview

---

### Code References

**Components:**
- `TabMenu.svelte` - Main menu container
- `TabMenuAction.svelte` - Individual action button
- `TabMenuSubmenu.svelte` - Expandable submenu panel
- `RecentActions.svelte` - Recent section

**Store Integration:**
- `recentActionsStore.js` - Persistence and retrieval
- `tabStore.js` - Tab data for actions

**Actions:**
- `src/services/tabActions.js` - Action execution logic

**Global triggers:**
- `App.svelte` — **"a"** / **"m"** open Tab Menu; typing-context and modifier guards; coordination with omnibox and `HelpMenu`
