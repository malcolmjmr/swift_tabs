## Feature: Tab Menu (Actions)

**Status:** Partially Implemented  
**Priority:** High  
**Addresses Need:** Tab Management (Need 3)

---

### Description

A comprehensive, scrollable menu of tab actions accessible from the Active Tab Information Display. The Tab Menu provides quick access to all tab operations organized into Recent (for repeat actions) and All Actions (categorized by type). Basic actions execute immediately; complex actions expand into submenus.

---

### Trigger

**Method 1: From Active Tab Information Display (In Navigation Mode)**
1. **Invoking Display:** Active Tab Information Display appears upon navigation or scroll up.
2. **Affordance:** The display shows the Meta key symbol (⌘/⊞) as a visual hint.
3. **Trigger Menu:** While the Tab Information Display is visible, pressing the **Meta key** launches the Tab Menu.

**Method 2: Direct Keyboard Shortcut (Any Time)**
- Press **"a"** (for "actions") while not in a text input element.
- Opens Tab Menu directly without requiring navigation mode or Active Tab Info.
- Current tab is used as the target for all actions.

**Method 3: In Navigation Mode (Alternative)**
- While in navigation mode (TabsView visible), press **"a"** to open Tab Menu for the currently selected tab.

---

### Menu Structure

The Tab Menu is organized into two main sections:

#### Section 1: Recent
Recently used actions including nested submenu selections. This section allows single-tap repeat of common complex actions.

**Recent Items Include:**
- "Save to Task: Project Alpha"
- "Move to Group: Research"
- "Save to Brief: Morning Brief"
- "Save as Entity"
- "Move to New Window"
- "Pin"
- "Mute"
- Any other recently used action or submenu selection

**Behavior:**
- Shows last 5-8 unique recent actions
- Recent items are deduplicated (if you "Save to Task: X" twice, it appears once at top)
- Persists across sessions
- Accessible via scroll or arrow keys

---

#### Section 2: All Actions

All available actions organized by category. Categories are visual groupings, not expandable sections.

##### Basic Actions
Single tap/click to execute immediately:

| Icon | Action | Description | Shortcut Hint |
|------|--------|-------------|---------------|
| 📌 | **Pin/Unpin** | Toggle pinned state. Pinned tabs appear at top with full title+icon, separated by divider from unpinned tabs. | |
| 🔄 | **Reload** | Refresh the page | |
| 📄 | **Duplicate** | Create a copy of the tab in same window | |
| 📋 | **Copy** | Copy URL to clipboard | |
| 😴 | **Sleep** | Chrome's discard action — frees memory, tab stays in list, reloads on activate | |
| 🔍 | **Find** | Open find-in-page for current tab | `/` key |
| 🔇 | **Mute/Unmute** | Toggle audio. Speaker icon visible when tab is playing audio. | |
| ❌ | **Close** | Close current tab with undo available | Delete/Backspace key |

##### Actions with Submenus
Tap to expand submenu options:

**Save** — Multi-level submenu:
```
Save
├── Save as
│   ├── Bookmark — Traditional browser bookmark
│   ├── File — Download page (HTML/PDF/MHTML)
│   └── Entity — LLM extracts: Person, Org, Product, Service, Concept
│
└── Save to
    ├── Folder — Bookmark folder or file folder
    ├── Task — Existing task or create new
    │   └── [Recent tasks appear here]
    └── Brief — Morning, Evening, Weekly (future)
        └── [Recent briefs appear here]
```

**Move** — Flat submenu:
```
Move
├── New Window — Creates immediately, moves tab (no dialog)
├── Existing Window — [List of open windows]
├── Group/Workspace — [List of tab groups/workspaces, open or closed]
│   └── [Recent groups appear at top]
├── Reading List — Chrome's reading list
├── Bookmarks — Shortcut for Save → Bookmark
└── Time — Evening, Tomorrow, This Week... (future)
```

**Close Variants** — Confirmation for destructive actions:
```
Close Variants
├── Close Others — Close all tabs except current (with undo)
└── Close to the Right — Close all tabs after current (with undo)
```

**Appearance** — Visual adjustments:
```
Appearance
├── Theme — Light, Dark, System
├── Zoom — 50%, 75%, 100%, 125%, 150%, 200%
└── Reader Mode — Distraction-free reading view
```

**Assistance** — LLM-powered features (future):
```
Assistance
├── Summarize — Generate page summary
├── Translate — Translate page content
└── Explain — Explain selected text or page
```

##### Additional Actions (Contextual)
Appear only when relevant:

| Action | When Available | Description |
|--------|----------------|-------------|
| 💬 **Chat** | Page has chat interface or AI assistant | Open chat panel |
| ▶️ **Play** | Audio/video detected on page | Media controls (play/pause) |
| ⬇️ **Download** | Downloadable content detected | Download page or media |

---

### Visual Design

**Tab Menu (Collapsed View):**
```
┌─────────────────────────────────────────┐
│  [Favicon] Current Tab Title            │
│  [URL] example.com/page                 │
├─────────────────────────────────────────┤
│  📌 Pin          🔄 Reload    😴 Sleep  │  ← Basic actions row 1
│  📄 Duplicate     🔍 Find      ❌ Close  │  ← Basic actions row 2
├─────────────────────────────────────────┤
│  > Save            [Recent: Task: Proj] │  ← Recent shortcut
│  > Move            [Recent: New Win]    │  ← Recent shortcut
│  > Close Variants                       │
│  > Appearance                           │
│  > Assistance                           │
└─────────────────────────────────────────┘
```

**Tab Menu with Submenu Open:**
```
┌─────────────────────────────────────────┐
│  [Favicon] Current Tab Title            │
├─────────────────────────────────────────┤
│  Recent                                 │
│  ├─ Save to Task: Project Alpha         │
│  ├─ Move to Group: Research             │
│  └─ Pin                                 │
├─────────────────────────────────────────┤
│  All Actions                            │
│  📌 Pin        🔄 Reload      😴 Sleep   │
│  📄 Duplicate   🔍 Find        ❌ Close  │
├─────────────────────────────────────────┤
│  > Save                                 │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │  Save as                    │     │  ← Section header
│    │  ├─ Bookmark                │     │
│    │  ├─ File                    │     │
│    │  └─ Entity >                │     │  ← Nested submenu
│    │                             │     │
│    │  Save to                    │     │  ← Section header
│    │  ├─ Folder                  │     │
│    │  ├─ Task >                  │     │  ← Shows recent tasks
│    │  └─ Brief >                 │     │  ← Future
│    │                             │     │
│    └─────────────────────────────┘     │
│  > Move                                 │
│  > Close Variants                       │
└─────────────────────────────────────────┘
```

**Submenu Structure:**
- Submenus contain **sections** (not tabs) — visual groupings of related options
- User **vertically scrolls** through all items in the submenu
- Section headers are non-selectable labels that organize the list
- Horizontal scroll switches between sibling submenus at the same level (if applicable)

---

### Interaction Flow

**Opening the Menu:**
```
Active Tab Info showing
         │
         ▼
   Press Meta key
         │
         ▼
   Tab Menu appears
         │
         ├─── Recent section (if any recent actions)
         └─── All Actions section
```

**Selecting a Basic Action:**
```
Tab Menu open
         │
         ▼
   Scroll/Arrow to action
         │
         ▼
   Press Enter or Space
         │
         ▼
   Action executes immediately
         │
         ▼
   Menu closes, feedback shown
```

**Selecting a Submenu Action:**
```
Tab Menu open
         │
         ▼
   Select "Save" (or "Move")
         │
         ▼
   Submenu expands
         │
         ▼
   Navigate to option
         │
         ├─ Simple option: Execute immediately
         └─ "Task" submenu: Expand again, show recent tasks
              │
              ▼
         Select existing task or "Create New"
              │
              ▼
         Action executes, added to Recent
```

**Using Recent Shortcut:**
```
Tab Menu open
         │
         ▼
   Recent section visible
         │
         ▼
   "Save to Task: Project Alpha" shown
         │
         ▼
   Select it → Immediate execution
         │
         ▼
   No submenu navigation needed!
```

**Search/Filter:**
```
Tab Menu open
         │
         ▼
   Start typing
         │
         ▼
   Menu filters to matching actions
         │
         ▼
   "sa" → shows: Save, Save as, Save to
   "mov" → shows: Move, Move to New Window
```

**Dismissal:**
- Press Escape: Close menu, return to Active Tab Info
- Release Meta key (if held): Close menu
- Click outside menu: Close menu

---

### Navigation

**Scroll Navigation (Primary):**

| Input | Action |
|-------|--------|
| **Vertical Scroll** | Navigate up/down through actions and sections |
| **Horizontal Scroll** | In submenus with sections: switch between sections |
| **Enter / Space** | Select / Execute action or open submenu |
| **Escape** | Close menu (or close submenu if in one) |
| **Type "a-z"** | Filter actions by name |

**Keyboard Navigation (Alternative):**

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate up/down in current list |
| ← | Go back (close submenu, return to parent) |
| → / Enter | Select / Open submenu |
| Space | Execute selected action |
| Escape | Close menu (or close submenu if in one) |
| a-z | Type to filter actions |

---

### State Management

**Component State:**
```javascript
// TabMenu.svelte
let isOpen = false;
let selectedSection = 'recent'; // 'recent' or 'all'
let selectedActionIndex = 0;
let filterQuery = '';
let activeSubmenu = null; // 'save', 'move', 'close', 'appearance', 'assistance'
let activeSubmenuLevel = 0; // 0 = root, 1 = first submenu, 2 = nested
```

**Store Integration:**
```javascript
// Recent actions (persisted)
recentActions: [
  { type: 'save', destination: 'task', name: 'Project Alpha', timestamp: ... },
  { type: 'move', destination: 'new_window', timestamp: ... },
  { type: 'pin', timestamp: ... }
]

// Available actions (static config)
actions: { basic: [...], submenu: [...], contextual: [...] }
```

**Recent Action Structure:**
```javascript
{
  id: 'save-to-task-project-alpha',
  category: 'save',
  action: 'save_to',
  targetType: 'task',
  targetName: 'Project Alpha',
  targetId: 123,
  lastUsed: timestamp,
  useCount: 5
}
```

---

### Recent Actions Algorithm

**Adding to Recent:**
1. User executes any action (basic or submenu selection)
2. If submenu selection: Create recent item with full context (e.g., "Save to Task: X")
3. If basic action: Create simple recent item (e.g., "Pin")
4. Insert at top of recent list
5. Remove duplicates (same action + same target)

**Pruning Recent:**
- Keep maximum 8 unique items
- If exceeds 8: Remove oldest by `lastUsed`
- Persist to chrome.storage.local

**Display in Menu:**
- Show up to 5 most recent in main view
- If more than 5: Show "More..." option expanding to full recent list

---

### Code References

**Components:**
- `TabMenu.svelte` — Main menu container
- `TabMenuSection.svelte` — Recent/All sections
- `TabMenuAction.svelte` — Individual action button
- `TabMenuSubmenu.svelte` — Expandable submenu panel
- `RecentActions.svelte` — Recent section logic

**Integration Points:**
- Triggered from: `ActiveTabInfo.svelte` (Meta key handler)
- Uses store: `tabStore` for recent actions persistence
- Uses service: `chromeApi` for action execution

---

### Implementation Checklist

- [ ] Create TabMenu.svelte component structure
- [ ] Implement Recent section with persistence
- [ ] Implement All Actions section with categories
- [ ] Create Basic Action components (Pin, Reload, etc.)
- [ ] Create Submenu system (Save, Move, Close Variants, Appearance)
- [ ] Implement Save submenu: Save as (Bookmark, File, Entity)
- [ ] Implement Save submenu: Save to (Folder, Task, Brief)
- [ ] Implement Move submenu: New Window, Existing Windows, Groups
- [ ] Implement Close Variants submenu
- [ ] Implement Appearance submenu
- [ ] Add contextual actions (Chat, Play, Download)
- [ ] Add search/filter functionality
- [ ] Add keyboard navigation (↑↓←→ Enter Space Escape)
- [ ] Add scroll navigation support
- [ ] Integrate with Active Tab Info (Meta key trigger)
- [ ] Persist recent actions to storage
- [ ] Add visual feedback for executed actions
- [ ] Test submenu nesting (up to 3 levels for Entity types)
