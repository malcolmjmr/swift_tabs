## Interaction: Navigation Mode

**Addresses Need:** [Efficient Tab Navigation](../needs/need_efficient_tab_navigation.md), [Window and Group Management](../needs/need_window_management.md)  
**Supports Feature:** Navigation Mode

---

### Preconditions

1. Chrome extension is installed and active
2. User has at least one tab open
3. User is not actively typing in an input field or contenteditable element
4. Current mode is "normal browsing" (not already in Navigation Mode)

---

### Flow Steps

#### Entry: Activating Navigation Mode

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses **Space** key | System captures event, prevents page scroll | `isInNavigationMode = true` |
| 2 | System refreshes tab state | Fetches current tabs from Chrome API | `windows` store updated |
| 3 | TabsView overlay appears | Card at bottom-right: **History** slide, **window** slides, **Create** slide; quick actions; dot row when multiple windows | `TabsView` mounted with `includeEdgeSlides`, `navSlideIndex` = current tab’s window slide (1-based) |
| 4 | Current tab is highlighted | Visual indicator for active/selected tab in that window’s list | `selectedTab` aligned with visible window (typically active tab in that window) |

#### Navigation: Selecting Tabs (Vertical)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User scrolls **up** with Meta key | System detects Meta+scroll up | `scrollSelectDelta` accumulates |
| 2 | Scroll threshold reached | Selection moves to previous tab | `selectedTab = tabs[prevIndex]` |
| 3 | TabsView updates highlight | New selection visually highlighted | UI update |
| 4 | ActiveTabInfo appears (optional) | Shows detailed info for selected tab | `activeTabInfoVisible = true` |
| 5 | User continues scrolling | Selection moves through tabs (clamped at ends) | `selectedTab` updates |
| 6 | User reaches first/last tab | Selection clamps to edge (no wrap) | `selectedTab` stays at boundary |

#### Navigation: Selecting Windows (Horizontal carousel)

While in Navigation Mode, horizontal input changes which **slide** is shown: **History**, a **window’s** tab list, or **Create**. It does **not** call `focusWindow` or show the Tab Switching Modal when stepping between **windows** (same as before). The user switches the real focused window by activating a tab (**Space**) in another window. In **Overview** `viewMode`, horizontal input moves **overview** window focus instead of the horizontal track.

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User scrolls **horizontally** (with Meta, or primary scroll axis horizontal) | `deltaX` accumulates | `scrollCarouselDelta` accumulates |
| 2 | Threshold reached | Carousel moves to next/previous **slide** | `navSlideIndex` updates (clamped); track scrolls to snap; in Overview, `overviewFocusedWindowIndex` steps |
| 3 | TabsView updates | New slide shows History, that window’s tabs, or Create; dots reflect **window** slide when applicable | `selectedTab` defaults to that window’s active tab (or first tab) on window slides |
| 4 | User may tap a **dot** | Jump to that **window’s** slide | `navSlideIndex` = dot index (+1 when edge slides on) |

#### Activation: Opening Selected Tab, History Row, or New Window

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses **Space** on a **window** or **Overview** slide | System activates `selectedTab` | Chrome API: activate tab; exit navigation mode |
| 1b | User presses **Space** on **History** slide | Restores selected session / activates group / opens saved folder | `chrome.sessions.restore` / group focus / bookmarks UI |
| 1c | User presses **Space** on **Create** slide | Opens new empty window | `CREATE_EMPTY_WINDOW`; exit navigation mode |
| 2 | Navigation Mode exits (tab / create paths) | TabsView overlay dismisses | `isInNavigationMode = false` |
| 3 | ActiveTabInfo displays (when applicable) | Shows info for newly active tab | `activeTabInfoVisible = true` |

#### Opening Omnibox (Navigation Mode)

Printable keys **do not** open the omnibox (avoids clashes with TabsView quick actions **S** / **F** / **x** / **M**).

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses **o** or **n** (see idle / global rules) | Omnibox opens; navigation mode if needed | `omniboxIsOpen = true` |
| 2 | User types in omnibox | Query updates | `omniboxQuery` updates |
| 3 | User presses **Enter** | Search or navigate | Depends on query type |

#### Exit: Leaving Navigation Mode

| Method | User Action | System Response |
|--------|-------------|-----------------|
| Activation | Press **Space** | Activate selected tab, exit mode |
| Escape | Press **Escape** | Keyboard shortcuts help closes if open (handled in `App.svelte`). Tab-switching overlay dismisses; Active Tab Info hides. **Omnibox:** Escape closes the omnibox only (navigation mode may remain active). |
| Click Outside | Click outside `#swift-tabs-root` | Dismisses navigation mode, omnibox, tab menu, system menu, and help (among other overlays) |
| Omnibox | Type character → Enter | Search/navigate, exit mode |

#### Idle Browsing: Global Shortcuts (Outside Navigation Mode)

When the user is **not** in navigation mode, **not** in the omnibox, **not** in the tab menu, **not** in the tab-switching overlay, **not** in the system menu, and **not** in the keyboard shortcuts help panel — and focus is **not** in a typing context (`input`, `textarea`, `select`, contenteditable) — the following **single-key** shortcuts apply to the **active tab** (no Ctrl/Alt/Meta/Shift except as noted for **?**):

| Key | Action |
|-----|--------|
| **/** | Open keyboard shortcuts help (`HelpMenu`) |
| **?** | Open help (Shift may be used for **?** on layouts where **?** is Shift+/; Ctrl/Alt/Meta must not be held) |
| **Delete** / **Backspace** | Close active tab if there is no text selection and the key is not a repeat |
| **Enter** | Move active tab to a **new** window (`createWindowWithTab`) |
| **c** | Copy active tab URL (only when there is no text selection; otherwise selection copy may apply elsewhere) |
| **r** | Reload active tab |
| **i** | Toggle Active Tab Information strip visibility |
| **d** | Duplicate active tab |

**Related:** [interaction_tab_menu.md](./interaction_tab_menu.md) (**"a"** / **"m"**), omnibox (**"o"** / **"n"**), and help (**/** / **?**) are handled in `App.svelte` with explicit ordering so overlays and modes do not conflict.

---

### Visual States

#### State 1: Normal Browsing (Entry Point)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PAGE CONTENT                         │
│                      (full screen)                      │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
- No overlays visible
- User presses **Space** to enter Navigation Mode

#### State 2: Navigation Mode Active (TabsView)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PAGE CONTENT                         │
│                      (dimmed 20%)                     │
│                                                         │
│                              ┌────────────────────────┐ │
│                              │ Tabs (12)             │ │
│                              ├────────────────────────┤ │
│                              │ 🔲 First Tab         │ │
│                              │ 🔲 Second Tab        │ │
│                              │ ┌──────────────────┐ │ │
│                              │ │ 🔲 CURRENT TAB   │ │ │ ← Selected
│                              │ │ active-site.com  │ │ │
│                              │ └──────────────────┘ │ │
│                              │ 🔲 Fourth Tab        │ │
│                              │ 🔲 Fifth Tab         │ │
│                              │      ● ○ ○           │ │ ← window dots (multi-window)
│                              └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Visual characteristics:**
- Page content dimmed (20% overlay or backdrop blur)
- TabsView **card** fixed bottom-right (`~360px` wide), styling aligned with Active Tab Info / Tab Menu (`--st-*` tokens)
- **One window visible** at a time; horizontal scroll or dots change window
- Dot row **below** the tab list (hidden when only one window)
- Selected tab highlighted; vertical scroll / **↑** **↓** move selection within the **visible** window’s tabs

#### State 3: Navigation Mode with ActiveTabInfo
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PAGE CONTENT                         │
│                      (dimmed 20%)                     │
│                                                         │
│                              ┌────────────────────────┐ │
│                              │ 🔲 Selected Tab        │ │
│                              │ ┌──────────────────┐ │ │
│                              │ │ Title: Page Name │ │ │
│                              │ │ URL: example.com │ │ │
│                              │ │ Space: Activate  │ │ │
│                              │ │ ⌘: Menu          │ │ │
│                              │ └──────────────────┘ │ │
│                              └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### State 4: Navigation Mode with Omnibox
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│         ┌──────────────────────────────────┐            │
│         │ Search or enter URL...          │            │
│         └──────────────────────────────────┘            │
│                      (centered top)                     │
│                                                         │
│                    PAGE CONTENT                         │
│                      (dimmed 20%)                     │
│                                                         │
│                              ┌────────────────────────┐ │
│                              │ TabsView visible       │ │
│                              └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Scroll Thresholds

```javascript
// Navigation Mode — App.svelte
const SCROLL_SELECT_THRESHOLD = 33; // pixels; used for vertical tab steps and horizontal carousel steps

// scrollSelectDelta — vertical wheel; scrollCarouselDelta — horizontal wheel
```

---

### Error Cases

| Error Condition | System Response | User Recovery |
|-----------------|-----------------|---------------|
| No tabs in window | Show "No tabs" message | Press Escape to exit |
| Single tab in window | Show that tab, navigation has no effect | — |
| Chrome API fails | Show error message, allow retry | Refresh page |
| Text input focused when Space pressed | Space inputs normally, no mode entry | Click outside input first |
| Meta+scroll not detected (trackpad) | Use arrow keys as fallback | **↑** **↓** tabs; **←** **→** carousel windows |
| Window switch fails | Show error, stay in current window | Try again |

---

### State Management

```javascript
// App.svelte (main state)
let isInNavigationMode = false;
let selectedTab = null;
let navSlideIndex = 0;       // 0 history, 1..N windows, N+1 create (with edge slides)
let navViewMode = "list";   // list | icon | gallery | overview
let overviewFocusedWindowIndex = 0;
let scrollSelectDelta = 0;
let scrollCarouselDelta = 0;
let omniboxIsOpen = false;
let omniboxQuery = "";

import { windows } from './stores/tabStore';

// Vertical scroll: tabs in visible window (slide index) or Overview focused window
// Horizontal scroll: step navSlideIndex or overviewFocusedWindowIndex in Overview mode
```

---

### Keyboard/Scroll Mappings

| Input | Context | Action |
|-------|---------|--------|
| **Space** | Not in input, not in Navigation Mode | Enter Navigation Mode |
| **Space** | In Navigation Mode, window / Overview slide | Activate `selectedTab`, exit mode |
| **Space** | In Navigation Mode, History slide | Activate selected history row (restore / group / folder) |
| **Space** | In Navigation Mode, Create slide | New empty window, exit mode |
| **Escape** | Navigation Mode | Does **not** exit Navigation Mode by itself; closes help / tab-switching overlay / Active Tab Info when applicable |
| **↑ / ↓** | In Navigation Mode, window slide (omnibox & tab menu closed) | Move `selectedTab` within that window’s tabs (clamped, no wrap) |
| **↑ / ↓** | In Navigation Mode, History slide | Move selection in history list |
| **↑ / ↓** | In Navigation Mode, Overview | Move `selectedTab` within **focused** window row |
| **← / →** | In Navigation Mode, not Overview | Step **slides** (History ↔ windows ↔ Create), clamped |
| **← / →** | In Navigation Mode, Overview | Step `overviewFocusedWindowIndex` |
| **Meta + Scroll Vertical** | In Navigation Mode | Same as ↑ / ↓ for current context (window, Overview, or ignored on History/Create) |
| **Meta + Scroll Horizontal** | In Navigation Mode | Same as ← / → for current context |
| **Printable keys** | In Navigation Mode | **Do not** open omnibox (use **o** / **n**) |
| **s** / **f** / **x** | In Navigation Mode, window slide, tab menu & omnibox closed | Quick actions: save/share (copy URL), focus window, close tab |
| **Enter** | In Navigation Mode, tab selected, window slide | Move selected tab to next window |
| **Delete / Backspace** | In Navigation Mode, tab selected, window slide | Close selected tab |
| **Enter** | Idle (see preconditions above) | Move active tab to new window |
| **Delete / Backspace** | Idle, empty text selection, not repeat | Close active tab |
| **/** | Idle | Open keyboard shortcuts help |
| **?** | Idle (Shift allowed for **?**) | Open keyboard shortcuts help |
| **c** / **r** / **i** / **d** | Idle | Copy URL / reload / toggle Active Tab Info / duplicate (see idle table) |
| **o** / **n** | Not omnibox/tab menu/help open; not in typing context | Open omnibox (enters navigation mode if needed) |
| **a** / **m** | Tab target known; tab menu & help closed | Open Tab Menu |

---

### Animation Specifications

**Entry Animation:**
- Duration: 200ms
- Easing: ease-out
- Effect: Backdrop fades in (0 → 0.2 opacity), TabsView slides up (20px → 0px)

**Tab Selection Change:**
- Duration: 100ms
- Easing: ease-in-out
- Effect: Highlight border animates, selected item scales (1.0 → 1.02)

**Exit Animation:**
- Duration: 150ms
- Easing: ease-in
- Effect: Backdrop fades out, TabsView slides down (0px → 20px)

---

### Success Metrics

1. Navigation Mode enters within 50ms of Space press
2. Tab selection responds immediately to scroll (< 50ms perceived)
3. Carousel window change (scroll, dots, or arrows) updates the visible tab list within one frame / snap
4. Tab activation (Space) completes within 100ms
5. User can navigate 20+ tabs without confusion
6. Exit methods are all reliable and fast

---

### Related Interactions

- [interaction_tab_switching.md](./interaction_tab_switching.md) - Quick switching without full UI
- [interaction_tab_info_display.md](./interaction_tab_info_display.md) - Shows during and after Navigation Mode
- [interaction_tab_menu.md](./interaction_tab_menu.md) - Accessed via Meta key from Navigation Mode
- [interaction_omnibox.md](./interaction_omnibox.md) - Opened by **o** / **n** (not by arbitrary typing while TabsView quick actions are active)

---

### Code References

**Components:**
- `src/components/tabs_view/TabsView.svelte` - Navigation overlay (History / windows / Create, overview, picker, quick actions, `bind:slideIndex`)
- `src/components/tabs_view/HistoryView.svelte` - Recently closed, groups, saved session folders
- `src/components/tabs_view/ListView.svelte` (and icon/gallery variants) - Tab list inside each slide
- `ActiveTabInfo.svelte` - Context display during navigation
- `Omnibox.svelte` - Search interface
- `HelpMenu.svelte` - Keyboard shortcuts reference overlay

**Store Integration:**
- `tabStore.js` - Tab and window data
- `uiStore.js` - Navigation mode state

**Event Handling:**
- `App.svelte` - Space, navigation keys, omnibox/tab menu/help triggers, idle global tab actions, scroll, and escape handlers
