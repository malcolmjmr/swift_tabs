## Feature: Omnibox with Tab Search

**Status:** Implemented
**Priority:** High
**Addresses Need:** Efficient Tab Navigation (Need 1), Tab Management (Need 3)

---

### Description

A unified search interface with tabbed sections for different search scopes. Opens from **o** / **n** (and can be focused while navigation mode is active). Supports searching across open tabs, tab groups, bookmarks, and history. Eliminates the need to visually hunt through tabs or manually type full URLs.

---

### Trigger

- Press **"o"** or **"n"** while **not** in a typing context (`input`, `textarea`, `select`, contenteditable), with **no modifier keys** (Ctrl/Alt/Meta/Shift).
- If navigation mode is not already active, **"o"** / **"n"** **enter navigation mode** and open the omnibox with an empty query.
- Opening is **suppressed** while the tab menu or keyboard shortcuts help panel is open.
- **In navigation mode:** arbitrary printable keys **do not** open the omnibox (TabsView quick actions use single-letter shortcuts). Use **o** / **n** to open the omnibox; once open, type normally in the omnibox field.
- Omnibox appears with the focus ready for input.

---

### Layout Structure

The Omnibox is organized into three areas: Search Input, Section Tabs, and Results List.

```
┌─────────────────────────────────────────┐
│  Search or enter URL...                 │  ← Search Input
│  [user types "git"]                     │
├─────────────────────────────────────────┤
│  [Tabs] [Groups] [Bookmarks] [History]  │  ← Section Tabs (horizontal scroll)
├─────────────────────────────────────────┤
│  📑 github.com/my-project               │  ← Results List (vertical scroll)
│  📑 gitlab.com/dashboard                │
│  📑 gist.github.com/snippets            │
│                                         │
└─────────────────────────────────────────┘
```

---

### Search Input

- **Placeholder:** "Search or enter URL..."
- **Behavior:** As user types, results in the current section are filtered
- **URL Detection:** If input is URL-like (has dots, http://, etc.), shows "Open URL" option at bottom

**URL Detection Logic (existing):**
```102:104:src/components/Omnibox.svelte
    function isUrlLike(str) {
        const trimmed = str.trim();
        if (!trimmed) return false;
        if (/^https?:\/\//i.test(trimmed)) return true;
        if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return true;
        if (trimmed.includes(".") && !trimmed.includes(" ")) return true;
        return false;
    }
```

---

### Section Tabs

Horizontal tab bar for switching between search scopes. User navigates sections via **horizontal scroll** or click.

| Tab | Icon | Content |
|-----|------|---------|
| **Tabs** | 📑 | Open tabs matching query (title or URL) |
| **Groups** | 📦 | Tab groups matching query |
| **Bookmarks** | 🔖 | Bookmarks matching query |
| **History** | 🕐 | Recently visited URLs matching query |

**Navigation:**
- **Horizontal Scroll:** Switch between section tabs (wraps around)
- **Click:** Directly select a tab
- **Indicator:** Underline or highlight on active tab

**Default Section:** Tabs
- Omnibox opens with **Tabs** section active by default
- User sees open tab matches immediately

---

### Results List

Each section displays a vertically scrollable list of matching items.

**Navigation:**
- **Vertical Scroll:** Navigate up/down through results
- **Enter:** Activate selected result (switch to tab, open bookmark, etc.)
- **Escape:** Close omnibox

**Result Item Structure:**
```
┌─────────────────────────────────────────┐
│  📑 favicon  Title of the Page          │
│     example.com/path                  │
└─────────────────────────────────────────┘
```

**Visual Elements:**
- **Icon:** Type indicator (📑 tab, 📦 group, 🔖 bookmark, 🕐 history)
- **Title:** Page or group name
- **Subtitle:** URL or additional context

---

### Section Behaviors

#### Tabs Section
- Searches open tabs by **title** and **URL**
- **Selecting a tab:** Switches to that tab (does not open new tab)
- **Empty state:** "No open tabs match 'query'"

#### Groups Section
- Searches tab groups by **name**
- **Selecting a group:** Switches to that group's window and activates the group's active tab
- **Empty state:** "No tab groups match 'query'"

#### Bookmarks Section
- Searches bookmarks by **title** and **URL**
- **Selecting a bookmark:** Opens in new tab
- **Empty state:** "No bookmarks match 'query'"

#### History Section
- Searches history by **title** and **URL**
- **Selecting a history item:** Opens in new tab
- **Empty state:** "No history matches 'query'"

---

### Interaction Flow

**Opening and Searching:**
```
User presses "o" or "n" (enters navigation mode if needed)
              │
              ▼
    ┌─────────────────────┐
    │ Omnibox appears     │
    │ Tabs section active │
    │ (default)           │
    └─────────────────────┘
              │
              ▼
    User types "git"
              │
              ▼
    ┌─────────────────────┐
    │ Tabs section shows  │
    │ matching open tabs  │
    │                     │
    │ 📑 github.com/...  │
    │ 📑 gitlab.com/...  │
    │ 📑 gist.github...  │
    └─────────────────────┘
```

**Switching Sections:**
```
User types "doc"
              │
              ▼
    ┌─────────────────────┐
    │ Tabs: few results   │
    └─────────────────────┘
              │
    Horizontal Scroll Right
              │
              ▼
    ┌─────────────────────┐
    │ Bookmarks section   │
    │ now active          │
    │                     │
    │ 🔖 Documentation    │
    │ 🔖 Docker Guide     │
    └─────────────────────┘
```

**Activating Result:**
```
User vertical scrolls to select
              │
              ▼
    Select 📑 github.com/my-project
              │
              ▼
    Press Enter
              │
              ▼
    ┌─────────────────────┐
    │ Switch to that tab  │
    │ Close omnibox       │
    │ Exit nav mode       │
    └─────────────────────┘
```

---

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate up/down in results list (same as vertical scroll) |
| ←/→ | Navigate left/right between section tabs (same as horizontal scroll) |
| Enter | Activate selected result |
| Escape | Close omnibox |
| Tab | (Optional) Complete with first suggestion or cycle sections |

---

### State Management

**Input:**
- `query`: Current input string
- `selectedSection`: Active tab index (0=Tabs, 1=Groups, 2=Bookmarks, 3=History)
- `selectedResultIndex`: Currently selected result in the list
- `filteredResults`: Matching items for current section

**Actions:**
- `filterTabs(query)`: Search through open tabs
- `filterGroups(query)`: Search through tab groups
- `filterBookmarks(query)`: Search through bookmarks
- `filterHistory(query)`: Search through history
- `activateTab(tabId)`: Switch to existing tab
- `activateGroup(groupId)`: Switch to group
- `openUrl(url)`: Create new tab with URL

---

### Technical Approach

**Search Implementation:**
- Query all tabs from `tabStore` and filter by title/URL match
- Query tab groups and filter by name
- Access Chrome bookmarks API for bookmark search
- Access Chrome history API for history search
- Simple `includes()` matching for MVP, consider fuzzy search (fuse.js) for future

**Result Prioritization within Sections:**
- Match in title > match in URL
- Recently active > older
- Alphabetical as tiebreaker

---

### Code References

- **Component:** `src/components/Omnibox.svelte`
- **Integration:** `src/App.svelte` (trigger handling)
- **Store:** `src/stores/tabStore.js`
- **Service:** `src/services/chromeApi.js`

---

### Future Considerations

- **Fuzzy Search Library:** Consider `fuse.js` for typo-tolerant matching
- **Combined Results View:** Future option for "All" section showing top matches from all sources
- **Recent Searches:** Show recent queries when omnibox opens empty
- **Machine Learning:** Learn frequently accessed tabs and prioritize

---

### Implementation Checklist

- [x] Basic omnibox UI and positioning
- [x] URL detection and navigation
- [x] Search query handling
- [x] Escape to close
- [x] Trigger by "o" key (also when not in nav mode)
- [x] Tabbed section navigation (horizontal scroll / ←→ keys)
- [x] Tabs section (search open tabs)
- [x] Groups section (search tab groups)
- [x] Bookmarks section
- [x] History section
- [x] Vertical scroll for results (↑↓ keys)
- [x] Direct tab activation (switch vs new tab)
- [x] Direct group activation
