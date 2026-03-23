## Feature: Container Actions Menu

**Status:** Planned  
**Priority:** High  
**Addresses Needs:** Window and Group Management (Need 4), Tab Management (Need 3)

---

### Description

A comprehensive menu for performing actions at the container level (window or tab group). Provides quick access to operations that affect all tabs in a container — such as closing all tabs, saving the entire container as a session, or merging containers. Accessible from the Windows Overview footer or via keyboard shortcut.

**Visual Style:** Same component structure as the Tab Menu (scrollable list, sections, submenus) but without the "Recent" section.

---

### Trigger

**Method 1: From Windows Overview Footer**
- In Windows Overview, click the **[⚙] Actions** button in the footer
- Opens Container Actions Menu for the **currently selected container**
- Selected container is highlighted in the overview

**Method 2: Direct Keyboard Shortcut (Any Time)**
- Press **"w"** (for "window") while not in a text input element.
- Opens Container Actions Menu directly for the **current window**
- Works outside of navigation mode

**Method 3: In Navigation Mode (Alternative)**
- While in navigation mode (Windows Overview visible), press **"w"** to open Container Actions Menu for the **currently selected container**.

---

### Menu Structure

The Container Actions Menu is organized into **sections** (visual groupings, no Recent section).

```
┌─────────────────────────────────────────┐
│  Window Actions                         │  ← Title
│  "Window 1"  (12 tabs)                  │  ← Selected container name + stats
├─────────────────────────────────────────┤
│                                         │
│  Organization                           │  ← Section header
│  ├─ 🔀 Merge with...         >         │
│  ├─ ➡️  Move to Window          >         │  (groups only)
│  ├─ 📦 Save as Session         >         │
│  │    ├─ New Session                    │
│  │    ├─ Add to Existing               │
│  │    └─ Export (HTML/JSON)            │
│  │                                      │
│  Tab States                             │  ← Section header
│  ├─ 😴 Sleep All Tabs                   │
│  ├─ 🔇 Mute All Tabs                    │
│  ├─ 🔊 Unmute All Tabs                  │
│  ├─ 📌 Pin All Tabs                     │
│  └─ 📍 Unpin All Tabs                   │
│                                         │
│  Close                                  │  ← Section header
│  ├─ 🗑️  Close Window         >          │
│  │    ├─ Close Window (keep tabs)      │
│  │    ├─ Close All Tabs                │
│  │    └─ Close and Save Session        │
│  ├─ 🗑️  Close Other Windows            │
│  └─ 🗑️  Close All Windows              │
│                                         │
│  Maintenance                            │  ← Section header
│  ├─ 🔄 Reload All Tabs                  │
│  ├─ 🗂️  Sort Tabs              >         │
│  │    ├─ By Title                      │
│  │    ├─ By URL                        │
│  │    └─ By Domain                       │
│  └─ 🧹 Close Duplicate Tabs             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Sections and Actions

#### Organization Section

| Action | Description | Availability |
|--------|-------------|--------------|
| **Merge with...** | Combine this container with another; all tabs moved to target | Windows and Groups |
| **Move to Window** | Move entire group to a different window | Tab Groups only |
| **Save as Session** | Save all tabs as a named session/bookmark folder | Windows and Groups |

**Save as Session Submenu:**
- **New Session** — Create new bookmark folder, name it, save all tab URLs
- **Add to Existing** — Append tabs to an existing session folder
- **Export** — Export as HTML file or JSON for backup

#### Tab States Section

| Action | Description |
|--------|-------------|
| **Sleep All Tabs** | Discard all tabs to free memory (Chrome's discard) |
| **Mute All Tabs** | Mute all audible tabs at once |
| **Unmute All Tabs** | Unmute all muted tabs |
| **Pin All Tabs** | Pin every tab in the container |
| **Unpin All Tabs** | Unpin all pinned tabs |

#### Close Section

| Action | Description | Submenu |
|--------|-------------|---------|
| **Close Window** | Close the container | Yes — options for what happens to tabs |
| **Close Other Windows** | Close all other windows (keep current) | No |
| **Close All Windows** | Close entire browser session | No (with confirmation) |

**Close Window Submenu:**
- **Close Window (keep tabs)** — Close window, tabs moved to another window or saved
- **Close All Tabs** — Close all tabs in this window (with undo)
- **Close and Save Session** — Close window after saving as session

#### Maintenance Section

| Action | Description | Submenu |
|--------|-------------|---------|
| **Reload All Tabs** | Refresh all tabs in the container | No |
| **Sort Tabs** | Reorder tabs by criteria | Yes |
| **Close Duplicate Tabs** | Detect and close duplicate URLs (keep first) | No |

**Sort Tabs Submenu:**
- **By Title** — Alphabetical by page title
- **By URL** — Alphabetical by URL
- **By Domain** — Group by domain, then by title

---

### Navigation

**Scroll Navigation (Primary):**

| Input | Action |
|-------|--------|
| **Vertical Scroll** | Navigate up/down through actions and sections |
| **Enter / Space** | Select / Execute action or open submenu |
| **Escape** | Close menu (or close submenu if in one) |
| **Type "a-z"** | Filter actions by name |

**Keyboard Navigation (Alternative):**

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate up/down in the list |
| ← | Go back (close submenu, return to parent) |
| → / Enter | Select / Open submenu |
| Space | Execute selected action |
| Escape | Close menu (or close submenu if in one) |
| a-z | Type to filter actions |

---

### Submenu Structure

Submenus in the Container Actions Menu use the same pattern as the Tab Menu:
- Submenus contain **sections** — visual groupings of related options
- User **vertically scrolls** through all items in the submenu
- Section headers are non-selectable labels that organize the list
- Horizontal scroll at submenu level switches between sibling submenus at the same level (if applicable)

---

### Interaction Flow

**Opening from Windows Overview:**
```
Windows Overview visible
         │
         ▼
   Vertical scroll to select
   desired container
         │
         ▼
   Click [⚙] Actions button
   (or press "w" key)
         │
         ▼
   Container Actions Menu
   appears for selected container
         │
         ├─── Organization section
         ├─── Tab States section
         ├─── Close section
         └─── Maintenance section
```

**Direct from Browsing:**
```
User presses "w" key
         │
         ▼
   Container Actions Menu
   appears for current window
         │
         ▼
   User scrolls to action
         │
         ▼
   Select "Save as Session"
         │
         ▼
   Submenu expands
         │
         ▼
   Select "New Session"
         │
         ▼
   Enter name, confirm
         │
         ▼
   Session saved, menu closes
```

**Executing Close with Options:**
```
Menu open
         │
         ▼
   Scroll to Close section
         │
         ▼
   Select "Close Window >"
         │
         ▼
   Submenu expands with options:
   - Close Window (keep tabs)
   - Close All Tabs
   - Close and Save Session
         │
         ▼
   Select "Close and Save Session"
         │
         ▼
   Prompt for session name
         │
         ▼
   Save, then close window
```

---

### Visual Design

**Collapsed Menu (First Open):**
```
┌─────────────────────────────────────────┐
│  Window Actions                         │
│  "Work Tasks"   8 tabs    Group         │
├─────────────────────────────────────────┤
│                                         │
│  Organization                           │
│  ├─ 🔀 Merge with...          >         │
│  ├─ ➡️  Move to Window          >         │
│  └─ 📦 Save as Session        >         │
│                                         │
│  Tab States                             │
│  ├─ 😴 Sleep All Tabs                   │
│  ├─ 🔇 Mute All Tabs                    │
│  └─ 📌 Pin All Tabs                     │
│                                         │
│  Close                                  │
│  ├─ 🗑️  Close Window          >          │
│  └─ 🗑️  Close Other Windows             │
│                                         │
│  Maintenance                            │
│  └─ 🔄 Reload All Tabs                  │
│                                         │
└─────────────────────────────────────────┘
```

**With Submenu Open:**
```
┌─────────────────────────────────────────┐
│  Window Actions                         │
│  "Window 1"   12 tabs    Window         │
├─────────────────────────────────────────┤
│                                         │
│  Organization                           │
│  ├─ 🔀 Merge with...          >         │
│  │    ┌─────────────────────────┐      │
│  │    │                         │      │
│  │    │  Select target window   │      │
│  │    │  ├─ Window 2    (5t)   │      │
│  │    │  ├─ Work Tasks  (8t)   │      │
│  │    │  ├─ Window 3    (3t)   │      │
│  │    │  └─ New Window         │      │
│  │    │                         │      │
│  │    │  [Cancel]  [Confirm]    │      │
│  │    └─────────────────────────┘      │
│  ├─ ➡️  Move to Window          >         │
│  └─ 📦 Save as Session        >         │
│                                         │
│  ... (rest of menu)                     │
│                                         │
└─────────────────────────────────────────┘
```

---

### State Management

**Component State:**
```javascript
// ContainerActionsMenu.svelte
let isOpen = false;
let targetContainer = null; // { type: 'window'|'group', id, title, tabs, ... }
let selectedSectionIndex = 0;
let selectedActionIndex = 0;
let filterQuery = '';
let activeSubmenu = null; // 'merge', 'move', 'save', 'close', 'sort'
```

**Store Integration:**
```javascript
// Available containers from tabStore
containers: [...] // All windows and groups

// Current context
activeContainerId: number // Currently active window/group
activeTabId: number // Currently active tab

// For merge/move operations
selectedTargetContainer: number | null // Target for merge/move
```

---

### Code References

**Components:**
- `ContainerActionsMenu.svelte` — Main menu container (shares style with TabMenu)
- `ContainerActionsSection.svelte` — Section headers (Organization, Tab States, etc.)
- `ContainerActionsItem.svelte` — Individual action row
- `ContainerActionsSubmenu.svelte` — Expandable submenu panel

**Integration Points:**
- Triggered from: `WindowsFooter.svelte` [⚙] button
- Triggered by: Key handler in `App.svelte` ("w" key)
- Uses store: `tabStore` for container data and operations
- Uses service: `chromeApi` for window/tab operations

---

### Differences from Tab Menu

| Aspect | Tab Menu | Container Actions Menu |
|--------|----------|------------------------|
| **Target** | Single tab | Entire container (window/group) |
| **Recent Section** | Yes | No |
| **Trigger** | Meta key (from Active Tab Info) or "a" key | "w" key or [⚙] button |
| **Context** | Always for current/selected tab | For selected or current container |
| **Scope** | Tab-level actions (pin, reload, close one) | Container-level actions (pin all, merge, save session) |

---

### Implementation Checklist

- [ ] Create ContainerActionsMenu.svelte component (share style with TabMenu)
- [ ] Implement menu sections (Organization, Tab States, Close, Maintenance)
- [ ] Create Organization submenu (Merge with, Move to, Save as Session)
- [ ] Create Tab States actions (Sleep All, Mute All, Pin All, etc.)
- [ ] Create Close submenu (Close Window options, Close Others, Close All)
- [ ] Create Maintenance submenu (Sort Tabs options, Close Duplicates)
- [ ] Implement vertical scroll navigation
- [ ] Implement filter by typing
- [ ] Add keyboard shortcuts ("w" key)
- [ ] Integrate with Windows Overview footer [⚙] button
- [ ] Integrate with tabStore for container operations
- [ ] Add confirmation for destructive actions (Close All Windows)
- [ ] Add session saving functionality (bookmark folder creation)
- [ ] Implement merge containers logic
- [ ] Implement sort tabs logic
- [ ] Add visual feedback for executed actions
