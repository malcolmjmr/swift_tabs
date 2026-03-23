## Feature: Omnibox with Tab Search

**Status:** Partially Implemented
**Priority:** High
**Addresses Needs:** Efficient Tab Navigation (Need 1), Content Discovery (Need 6)

---

### Description

A unified search interface that appears when typing in navigation mode. Supports searching across open tabs, URLs, and web search. Eliminates the need to visually hunt through tabs or manually type full URLs.

---

### Current Implementation

The omnibox is currently implemented in `src/components/Omnibox.svelte` with basic functionality:

**Trigger:**
- Type any printable character while in navigation mode (press Space to enter)
- Omnibox appears with that character as initial query

**Current Behavior:**
1. User types query
2. System detects if input is URL-like (has dots, http://, etc.)
3. If URL: navigates to that URL in a new tab
4. If search query: performs Google search in new tab
5. Press Escape to close without action

**Code Reference:**
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

### Planned Enhancements

#### 1. Tab Search in Omnibox

**Behavior:**
- As user types, show suggestions from:
  - Open tabs (matching title or URL)
  - Bookmarks
  - History
  - Web search (default)

**UI Flow:**
```
┌─────────────────────────────────────────┐
│  Search or enter URL                    │
│  [user types "git"]                       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  📑 Open Tabs (2)                       │
│  ├─ github.com/my-project              │
│  └─ gitlab.com/dashboard                │
│                                         │
│  🔖 Bookmarks (1)                       │
│  └─ Git Documentation                   │
│                                         │
│  🌐 Search "git" on Google              │
│                                         │
│  ↵ Open "github.com" in new tab         │
└─────────────────────────────────────────┘
```

**Keyboard Navigation:**
- ↑/↓ to navigate suggestions
- Enter to activate selected (switch to tab or open URL)
- Escape to close
- Tab to complete with first suggestion

**Technical Approach:**
- Query all tabs from `tabStore` and filter by title/URL match
- Fuzzy search for better matching (e.g., using `fuse.js` or simple contains)
- Prioritize: open tabs > bookmarks > history > search

---

#### 2. Prefix-Based Search Modes

**Syntax:**
- `tab: github` - Search only open tabs
- `bm: recipes` - Search only bookmarks
- `hist: meeting` - Search history
- Default (no prefix): Search everything

---

#### 3. Direct Tab Activation

**Behavior:**
- When an open tab is selected from suggestions
- Instead of opening new tab, switch to existing tab
- Close navigation mode after activation

**Technical:**
```javascript
await chromeService.activateTab(tabId);
// Close omnibox and navigation mode
```

---

### State Management

**Input:**
- `query`: Current input string
- `suggestions`: Filtered list of matches

**Actions:**
- `filterTabs(query)`: Search through all tabs
- `activateTab(tabId)`: Switch to existing tab
- `openUrl(url)`: Create new tab with URL
- `performSearch(query)`: Open Google search

---

### Code References

- **Component:** `src/components/Omnibox.svelte`
- **Integration:** `src/App.svelte` (lines 18-20, 253-262, 572-579)
- **Store:** `src/stores/tabStore.js`
- **Service:** `src/services/chromeApi.js`

---

### Future Considerations

- **Fuzzy Search Library:** Consider `fuse.js` for typo-tolerant matching
- **Bookmark Integration:** Access Chrome bookmarks API for suggestions
- **History Integration:** Query browser history for recently visited URLs
- **Machine Learning:** Learn frequently accessed tabs and prioritize
- **Recent Queries:** Show recent searches when omnibox opens empty

---

### Implementation Checklist

- [x] Basic omnibox UI and positioning
- [x] URL detection and navigation
- [x] Search query handling
- [x] Escape to close
- [ ] Tab search suggestions
- [ ] Bookmark search
- [ ] History search
- [ ] Keyboard navigation (arrows, enter)
- [ ] Direct tab activation
- [ ] Prefix-based search modes
