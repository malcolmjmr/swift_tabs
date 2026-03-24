## Interaction: Tab Switching

**Addresses Need:** [Efficient Tab Navigation](../needs/need_efficient_tab_navigation.md)  
**Supports Feature:** Gesture-Based Tab Navigation

---

### Preconditions

1. Chrome extension is installed and active
2. User has multiple tabs open in the current window
3. User is not actively typing in an input field or contenteditable element
4. For scroll gestures: User is holding the Meta key (⌘ on Mac, ⊞ on Windows/Linux)

---

### Flow Steps

#### Method 1: Arrow Key Navigation (Keyboard)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User presses ↑ or ↓ arrow key | System captures key event, prevents default scrolling | `isInTabSwitchingMode = true` |
| 2 | System identifies current active tab | System highlights current tab in overlay | `selectedTab = currentTab` |
| 3 | User presses ↑ (previous) or ↓ (next) | System moves selection to adjacent tab | `selectedTab = tabs[nextIndex]` |
| 4 | System displays tab switch indicator | Overlay shows selected tab with visual highlight | `tabSwitchingModal.visible = true` |
| 5 | User continues pressing arrow keys | Selection cycles through tabs (wraps at ends) | `selectedTab` updates |
| 6 | User stops pressing keys | System starts dismiss timeout (1500ms) | `dismissTimeout` set |
| 7 | Timeout expires OR user presses Escape | Overlay fades out, tab switching mode ends | `isInTabSwitchingMode = false` |

**Note:** The tab is **not** activated during arrow key navigation. The overlay is purely informational.

#### Method 2: Meta + Scroll (Gesture)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User holds Meta key and scrolls vertically | System detects Meta+wheel event | `isInNavigationMode = true` (if not already) |
| 2 | System calculates scroll direction | Up = previous tab, Down = next tab | `scrollSelectDelta` accumulates |
| 3 | Scroll threshold reached (33px) | System selects adjacent tab | `selectedTab = tabs[nextIndex]` |
| 4 | Tab Switching Modal appears | Overlay shows selected tab info | `isInTabSwitchingMode = true` |
| 5 | User continues Meta+scroll | Selection moves through tabs | `selectedTab` updates |
| 6 | User releases Meta key OR stops scrolling | System keeps selection for 1500ms then dismisses | `dismissTimeout` set |
| 7 | Timeout expires | Overlay fades, selection clears | `isInTabSwitchingMode = false` |

#### Method 3: Horizontal Scroll (Window Navigation)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User holds Meta key and scrolls horizontally | System detects Meta+horizontal wheel | — |
| 2 | Scroll threshold reached | System switches to next/previous window | `activeWindowId` changes |
| 3 | Chrome API focuses new window | Window comes to foreground | Chrome window focus changes |
| 4 | Tab Switching Modal appears | Shows tabs in newly focused window | `isInTabSwitchingMode = true` |
| 5 | Modal dismisses after timeout | Returns to normal browsing | `isInTabSwitchingMode = false` |

---

### Visual States

#### State 1: Idle (No Tab Switching)
- No overlay visible
- User sees normal browser content
- No visual indicators

#### State 2: Tab Switching Active
```
┌─────────────────────────────────────────┐
│  [Favicon] Tab Title                      │
│  example.com/page                       │
│                                         │
│  ┌─ Previous Tab Title ─┐                │
│  │ [Fav] Tab Title     │ ← Selected     │
│  └─────────────────────┘                │
│                                         │
│  [Favicon] Next Tab Title               │
│  example.com/other                      │
└─────────────────────────────────────────┘
```

**Visual characteristics:**
- Centered overlay, semi-transparent background
- Selected tab highlighted with border/background color
- Adjacent tabs shown above and below (faded/miniaturized)
- Favicon and title visible for all shown tabs
- Auto-dismisses after 1.5 seconds of inactivity

#### State 3: Window Switching Active
```
┌─────────────────────────────────────────┐
│  Window 1: 5 tabs                       │
│  Window 2: 3 tabs ← Active              │
│  Window 3: 12 tabs                      │
└─────────────────────────────────────────┘
```

---

### Error Cases

| Error Condition | System Response | User Recovery |
|-----------------|-----------------|---------------|
| No tabs in current window | Show "No tabs" message in overlay | Press Escape to dismiss |
| Single tab in window | Show current tab, arrows have no effect | Modal dismisses normally |
| Text input field focused | Ignore arrow keys, allow normal typing | Click outside input to unfocus |
| Meta key conflicts with OS shortcut | Chrome extension receives event first | Release Meta, try again |
| Scroll threshold not reached | No selection change | Continue scrolling |

---

### Keyboard/Scroll Mappings

| Input | Context | Action |
|-------|---------|--------|
| ↑ (Arrow Up) | Not in input field | Select previous tab |
| ↓ (Arrow Down) | Not in input field | Select next tab |
| ← (Arrow Left) | Not in input field | Focus previous window |
| → (Arrow Right) | Not in input field | Focus next window |
| Meta + Vertical Scroll | Anywhere | Navigate tabs (up=prev, down=next) |
| Meta + Horizontal Scroll | Anywhere | Navigate windows (left=prev, right=next) |
| Escape | Tab switching mode active | Dismiss overlay immediately |

---

### State Management

```javascript
// Component State (TabSwitchingModal.svelte)
let isInTabSwitchingMode = false;
let selectedTab = null;
let dismissTimeout = null;
const DISMISS_DELAY_MS = 1500;

// Scroll accumulation for threshold detection
let scrollSelectDelta = 0;
const SCROLL_SELECT_THRESHOLD = 33; // pixels

// Store Integration
import { currentWindowTabs, activeTabId, windows, activeWindowId } from '../stores/tabStore';
```

---

### Animation Specifications

**Entry Animation:**
- Duration: 150ms
- Easing: ease-out
- Effect: Fade in + slight scale up (0.95 → 1.0)

**Selection Change:**
- Duration: 100ms
- Easing: ease-in-out
- Effect: Highlight border color transition, selected item scales slightly

**Dismiss Animation:**
- Duration: 200ms
- Easing: ease-in
- Effect: Fade out + slight scale down (1.0 → 0.95)

---

### Success Metrics

1. Tab switch indicator appears within 100ms of arrow key press
2. Scroll-to-selection response feels immediate (< 50ms perceived latency)
3. User can navigate through 10+ tabs without confusion
4. Modal auto-dismisses predictably (no "stuck" overlays)
5. Window switching completes within 200ms

---

### Related Interactions

- [interaction_navigation_mode.md](./interaction_navigation_mode.md) - Full navigation with selection and activation
- [interaction_tab_info_display.md](./interaction_tab_info_display.md) - Shows after tab switching completes

---

### Code References

**Components:**
- `TabSwitchingModal.svelte` - Main overlay component
- `App.svelte` - Event handling and state management

**Store Integration:**
- `tabStore.js` - Tab and window data

**Key Functions:**
- `handleKeydown()` - Arrow key navigation
- `handleWheel()` - Meta+scroll detection
- `enterTabSwitchingMode()` - Activate overlay
- `resetTabSwitchingDismissTimeout()` - Manage auto-dismiss
