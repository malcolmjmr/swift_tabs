## Feature: Saved Session Browser

**Status:** Planned  
**Priority:** Medium  
**Addresses Need:** Window/Session Organization

---

### Description

A dedicated interface for browsing, searching, and restoring saved sessions (bookmark folders). Accessible via horizontal swipe in the overview widget or through a dedicated entry point.

---

### Access Methods

#### 1. Horizontal Swipe in Overview Widget

**Gesture:**
- User in overview widget (collapsed)
- Swipes horizontally through window dots
- Reaches end of window list
- Continues swiping → reveals session browser

**Animation:**
```
Window Dots View                Session Browser
┌─────────────────────┐        ┌─────────────────────┐
│ ● ○ ○ ○             │   →    │ [Sessions List      │
│                     │ swipe  │  Scrollable]        │
│ [Window Content]    │        │                     │
│                     │        │ • Today             │
├─────────────────────┤        │   ├─ Session A      │
│ [+] ...footer... [↗]│        │   └─ Session B      │
└─────────────────────┘        │ • Yesterday         │
                               │   ├─ Session C      │
                               │ • This Week         │
                               │   ├─ Session D      │
                               │   └─ Session E      │
                               │ • This Month        │
                               │   └─ ...            │
                               │                     │
                               │ [Search/Create...] │
                               └─────────────────────┘
```

#### 2. Direct Access (Future)

- Keyboard shortcut
- Menu option in popup
- Quick action from toolbar

---

### Session List Organization

**Grouping by Time Period:**

```
📁 Sessions
├─ 📅 Today
│  ├─ Morning Research (10:30 AM)
│  └─ Shopping List (2:15 PM)
│
├─ 📅 Yesterday
│  ├─ Project Documentation
│  └─ Weekend Planning
│
├─ 📅 This Week
│  ├─ Client Meeting Prep
│  ├─ Recipe Collection
│  └─ Home Renovation Ideas
│
├─ 📅 This Month
│  └─ ...
│
├─ 📅 March 2026
│  └─ ...
│
└─ 📅 2025
   └─ ...
```

**Sorting:**
- Primary: `lastAccessed` (most recent first)
- Secondary: `created` (if never accessed)

---

### Session List Item

**Each Session Card:**
```
┌─────────────────────────────────────────┐
│ 📁 Session Name                         │
│    Last opened: 2 hours ago             │
│                                         │
│ Tabs (8):                               │
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐       │
│ │A│ │B│ │C│ │D│ │E│ │F│ │G│ │H│       │
│ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘       │
│                                         │
│ [🪟 Open All]  [➕ Add Tab]  [🗑️ Delete]│
└─────────────────────────────────────────┘
```

**Interactions:**
- Click session name/card → Expand/collapse tab list
- Hover favicon → Show tab title tooltip
- Click "Open All" → Restore all tabs in new window
- Click "Add Tab" → Add current tab to this session
- Click "Delete" → Remove session (with confirmation)

---

### Search & Create Interface

**Bottom of Session Browser:**
```
┌─────────────────────────────────────────┐
│                                         │
│ [🔍 Search sessions...          ]      │
│                                         │
│    [🪟 New Window]  [📁 New Session]  │
│                                         │
└─────────────────────────────────────────┘
```

**Search Behavior:**
- Real-time filtering as user types
- Searches session names and tab titles
- Results update instantly
- Empty state: "No sessions found"

**Create Buttons:**
- New Window: Opens empty window
- New Session: Creates empty session, prompts for name

---

### State Management

**Global State:**
```javascript
// New derived store or store extension
savedSessions: {
  byId: { [id]: Session },
  allIds: string[],
  groupedByTime: {
    today: string[],
    yesterday: string[],
    thisWeek: string[],
    thisMonth: string[],
    byMonth: { [monthYear]: string[] },
    byYear: { [year]: string[] }
  }
}
```

**Local State:**
- `searchQuery`: Current search term
- `expandedSessionId`: Which session is expanded
- `selectedSessionId`: For potential multi-select (future)

---

### Data Flow

```
Chrome Bookmarks API
        │
        ▼
┌─────────────────────┐
│ Fetch bookmark tree │
│ Find session folder │
│ (Swift Tabs folder) │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ Parse into Session  │
│ objects             │
│ • Extract metadata  │
│ • Group by time     │
│ • Sort by access    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ Update store        │
│ Reactive update     │
│ UI re-renders       │
└─────────────────────┘
```

---

### Code References (Planned)

- Session browser: New component `SessionsView.svelte`
- Session card: `SessionCard.svelte`
- Time grouping: Utility function in store or helper
- Search filtering: Derived store with search predicate

---

### Dependencies

- Chrome Bookmarks API (read tree, get subtrees)
- Date utilities for time grouping (date-fns or native)
- Search utilities (fuse.js for fuzzy search, or simple string matching)

---

### Related Features

- [Overview Widget](./feature_overview_widget.md) - Entry point via horizontal swipe
- [Window Save & Session Management](./feature_window_save_sessions.md) - Creates the sessions browsed here
- [New Window Creation](./feature_new_window_creation.md) - "New Session" button creates empty sessions

---

### Future Enhancements

- **Import/Export:** JSON import/export of sessions
- **Sync:** Integration with Chrome sync for cross-device sessions
- **Tags:** Color-coding or tagging for organization
- **Favorites:** Pin important sessions to top
- **Preview:** Hover shows larger thumbnail of window state
- **Merge on restore:** Option to merge session into current window vs. new window
