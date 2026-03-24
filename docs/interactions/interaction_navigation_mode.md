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
| 3 | TabsView overlay appears | Shows current window's tabs in list view | `TabsView.visible = true` |
| 4 | Current tab is highlighted | Visual indicator shows active tab | `selectedTab = currentTab` |

#### Navigation: Selecting Tabs (Vertical)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User scrolls **up** with Meta key | System detects Meta+scroll up | `scrollSelectDelta` accumulates |
| 2 | Scroll threshold reached | Selection moves to previous tab | `selectedTab = tabs[prevIndex]` |
| 3 | TabsView updates highlight | New selection visually highlighted | UI update |
| 4 | ActiveTabInfo appears (optional) | Shows detailed info for selected tab | `activeTabInfoVisible = true` |
| 5 | User continues scrolling | Selection cycles through tabs | `selectedTab` updates |
| 6 | User reaches first tab | Edge indicator shown, selection stays | Bounce animation |

#### Navigation: Selecting Windows (Horizontal)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User scrolls **horizontally** with Meta key | System detects Meta+horizontal scroll | — |
| 2 | Threshold reached | Focus switches to next/previous window | `activeWindowId` changes |
| 3 | Chrome focuses new window | Window comes to foreground | Chrome API call |
| 4 | TabsView updates | Shows tabs in newly focused window | UI refresh |
| 5 | Tab Switching Modal appears | Brief indicator of window change | `isInTabSwitchingMode = true` |

#### Activation: Opening Selected Tab

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses **Space** (while in Navigation Mode) | System activates selected tab | Chrome API: `tabs.update(selectedTab.id, { active: true })` |
| 2 | Navigation Mode exits | TabsView overlay fades out | `isInNavigationMode = false` |
| 3 | ActiveTabInfo displays | Shows info for newly active tab | `activeTabInfoVisible = true` |
| 4 | User returns to normal browsing | Page content fully visible | All overlays dismissed |

#### Alternative Activation: Opening Omnibox

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User types any character while in Navigation Mode | System detects printable key | `omniboxQuery = event.key` |
| 2 | Omnibox appears | Search interface overlays page | `omniboxOpen = true` |
| 3 | User types search query | Query updates in real-time | `omniboxQuery` updates |
| 4 | User presses **Enter** | System searches or navigates | Depends on query type |

#### Exit: Leaving Navigation Mode

| Method | User Action | System Response |
|--------|-------------|-----------------|
| Activation | Press **Space** | Activate selected tab, exit mode |
| Escape | Press **Escape** | Exit without activation, return to current tab |
| Click Outside | Click outside TabsView | Exit without activation |
| Omnibox | Type character → Enter | Search/navigate, exit mode |

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
│                              └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Visual characteristics:**
- Page content dimmed (20% overlay or backdrop blur)
- TabsView positioned bottom-right (default)
- Selected tab highlighted with border and background
- Adjacent tabs visible with subtle styling
- Scroll or arrows to navigate

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
// Vertical scroll (tab navigation)
const VERTICAL_SCROLL_THRESHOLD = 33; // pixels

// Horizontal scroll (window navigation)
const HORIZONTAL_SCROLL_THRESHOLD = 50; // pixels

// Scroll accumulation logic
let scrollSelectDelta = 0;

function handleWheel(event) {
  const isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
  
  if (isVertical) {
    scrollSelectDelta += event.deltaY;
    if (Math.abs(scrollSelectDelta) >= VERTICAL_SCROLL_THRESHOLD) {
      const direction = scrollSelectDelta > 0 ? -1 : 1; // Up = prev, Down = next
      navigateTab(direction);
      scrollSelectDelta = 0;
    }
  } else {
    // Horizontal - navigate windows
    if (Math.abs(event.deltaX) >= HORIZONTAL_SCROLL_THRESHOLD) {
      const direction = event.deltaX > 0 ? 1 : -1;
      navigateWindow(direction);
    }
  }
}
```

---

### Error Cases

| Error Condition | System Response | User Recovery |
|-----------------|-----------------|---------------|
| No tabs in window | Show "No tabs" message | Press Escape to exit |
| Single tab in window | Show that tab, navigation has no effect | — |
| Chrome API fails | Show error message, allow retry | Refresh page |
| Text input focused when Space pressed | Space inputs normally, no mode entry | Click outside input first |
| Meta+scroll not detected (trackpad) | Use arrow keys as fallback | Press ↑ ↓ |
| Window switch fails | Show error, stay in current window | Try again |

---

### State Management

```javascript
// App.svelte (main state)
let isInNavigationMode = false;
let selectedTab = null;
let scrollSelectDelta = 0;
let omniboxIsOpen = false;
let omniboxQuery = "";

// Derived from stores
import { windows, currentWindowTabs, activeTabId } from './stores/tabStore';

// Reset scroll delta after navigation
function navigateTab(direction) {
  const tabs = [...get(currentWindowTabs)].sort((a, b) => a.index - b.index);
  const currentIndex = tabs.findIndex(t => t.id === selectedTab?.id);
  const nextIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
  selectedTab = tabs[nextIndex];
}
```

---

### Keyboard/Scroll Mappings

| Input | Context | Action |
|-------|---------|--------|
| **Space** | Not in input, not in Navigation Mode | Enter Navigation Mode |
| **Space** | In Navigation Mode | Activate selected tab, exit mode |
| **Escape** | In Navigation Mode | Exit without activation |
| **↑ / ↓** | In Navigation Mode | Navigate tabs (prev/next) |
| **← / →** | In Navigation Mode | Navigate windows (prev/next) |
| **Meta + Scroll Vertical** | Anywhere in Navigation Mode | Navigate tabs |
| **Meta + Scroll Horizontal** | Anywhere in Navigation Mode | Navigate windows |
| **Any printable char** | In Navigation Mode, not in Omnibox | Open Omnibox, type character |
| **Enter** | In Navigation Mode, tab selected | Move selected tab to next window |
| **Delete / Backspace** | In Navigation Mode, tab selected | Close selected tab |

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
3. Window switching completes within 200ms
4. Tab activation (Space) completes within 100ms
5. User can navigate 20+ tabs without confusion
6. Exit methods are all reliable and fast

---

### Related Interactions

- [interaction_tab_switching.md](./interaction_tab_switching.md) - Quick switching without full UI
- [interaction_tab_info_display.md](./interaction_tab_info_display.md) - Shows during and after Navigation Mode
- [interaction_tab_menu.md](./interaction_tab_menu.md) - Accessed via Meta key from Navigation Mode
- [interaction_omnibox.md](./interaction_omnibox.md) - Opened by typing in Navigation Mode

---

### Code References

**Components:**
- `TabsView.svelte` - Main navigation overlay
- `ActiveTabInfo.svelte` - Context display during navigation
- `Omnibox.svelte` - Search interface

**Store Integration:**
- `tabStore.js` - Tab and window data
- `uiStore.js` - Navigation mode state

**Event Handling:**
- `App.svelte` - Space key, scroll, and escape handlers
