## Interaction: Tab Information Display

**Addresses Need:** [Tab Context Awareness](../needs/need_tab_context_awareness.md)  
**Supports Feature:** Active Tab Information Display

---

### Preconditions

1. Chrome extension is installed and active
2. User has at least one tab open
3. For automatic trigger: Tab becomes active OR page navigation completes
4. For dismiss: User scrolls down on the page

---

### Flow Steps

#### Trigger Method 1: Automatic (Tab Activation/Navigation)

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User switches to tab OR page finishes loading | Chrome runtime message sent to content script | `currentTab` updated in store |
| 2 | Content script receives "TAB_ACTIVATED" or "TAB_UPDATED" (for this tab) | ActiveTabInfo component prepares to display | `showActiveTabInfo = true` |
| 3 | System checks scroll position | If user has not scrolled down, show info | `isVisible = true` |
| 4 | Info overlay fades in | Displays favicon, title, URL, nav icons, audio indicator | Animation: 150ms fade-in |
| 5 | User scrolls down OR clicks outside | Info overlay fades out | `isVisible = false` |

**Note:** ActiveTabInfo is **not** shown in Navigation Mode.

#### Trigger Method 2: SPA Navigation Detection

| Step | User Action | System Response | State Change |
|------|-------------|-----------------|--------------|
| 1 | User clicks on SPA link/button | Click detected by content script | — |
| 2 | SPA updates page content and title | After 100ms delay, title change detected | `document.title !== lastDocumentTitle` |
| 3 | Title change confirmed | Update `lastDocumentTitle`, trigger info display | `showActiveTabInfo = true` |
| 4 | Info overlay fades in | Show updated tab information | Animation: 150ms fade-in |

**Note:** This detection method handles Single Page Apps (SPAs) that use `history.pushState()` without full page reloads.

---

### Dismiss Behaviors

| User Action | System Response | Timing |
|-------------|-----------------|--------|
| Scroll down (deltaY > 0) | Fade out info overlay | Immediate |
| Click outside info overlay | Fade out info | Immediate |
| Press Escape | Fade out info | Immediate |
| Page navigation starts | Hide immediately | Immediate |

---

### Visual States

#### State 1: Hidden (Default)
- No overlay visible
- User sees only page content
- Extension is "invisible"

#### State 2: Active Tab Info (Auto-triggered)
```
┌─────────────────────────────────────────┐
│  [🔲 Favicon]  Page Title Goes Here     │
│  ← → example.com                🔊      │
└─────────────────────────────────────────┘
```

**Position:** Bottom-right corner (default), 20px from edges  
**Style:** Semi-transparent dark background, light text  
**Contents:**
- Favicon (16x16px)
- Tab title (truncated with ellipsis if long)
- Navigation arrows (← →) shown when back/forward navigation is possible
- URL (truncated, lighter color)
- Audio icon (🔊) shown when tab is playing audio

---

### Scroll Detection Logic

```javascript
// Dismiss on scroll down only
function handleScroll(event) {
  if (event.deltaY > SCROLL_DOWN_THRESHOLD) {
    // User scrolled down - dismiss info
    hideActiveTabInfo();
  }
  // Note: Scroll up does NOT re-show the info
}

const SCROLL_DOWN_THRESHOLD = 50; // pixels
```

---

### SPA Navigation Detection

```javascript
// Detect SPA navigation via document title change
let lastDocumentTitle = "";

// Initialize when tab info is fetched
function fetchTabInfo() {
  lastDocumentTitle = document.title;
  // ... fetch tab data
}

// Check for title change on any click
function handleClick() {
  setTimeout(() => {
    if (document.title !== lastDocumentTitle) {
      lastDocumentTitle = document.title;
      showActiveTabInfoForCurrentTab();
    }
  }, 100); // Short delay for SPA to update title
}
```

---

### Error Cases

| Error Condition | System Response | User Recovery |
|-----------------|-----------------|---------------|
| Tab has no favicon | Show default placeholder icon | N/A (graceful degradation) |
| Tab title is empty | Show "Untitled" or URL domain | N/A |
| URL is extremely long | Truncate with middle-ellipsis | Hover to see full URL (future) |
| Extension just installed | No existing tab data | Info shows on next tab switch |
| Chrome API fails | Log error, don't show info | Reload extension |
| SPA navigation missed | No title change detected | N/A (best-effort detection) |

---

### State Management

```javascript
// Component State (App.svelte)
let showActiveTabInfo = false;
let currentTab = null;
let lastDocumentTitle = "";

// Props passed to ActiveTabInfo
export let tab; // Tab object with id, title, url, favIconUrl, audible, canGoBack, canGoForward

// Store Integration
import { currentWindowTabs, activeTabId } from '../stores/tabStore';
```

---

### Chrome Runtime Messages

```javascript
// Messages received from background script
{
  type: "TAB_ACTIVATED",
  tabId: number,
  windowId: number
}

{
  type: "TAB_UPDATED",
  tabId: number,
  changeInfo: object,
  tab: Tab
}
```

---

### Animation Specifications

**Entry Animation:**
- Duration: 150ms
- Easing: ease-out
- Effect: Slide up from bottom (20px → 0px) + fade in

**Dismiss Animation:**
- Duration: 200ms
- Easing: ease-in
- Effect: Slide down (0px → 20px) + fade out

---

### Accessibility Considerations

- Info overlay has `aria-live="polite"` for screen readers
- Navigation arrows have descriptive titles ("Can go back", "Can go forward")
- Audio icon has descriptive title ("Audio playing")
- Info is purely contextual and doesn't block content interaction
- Dismiss methods are multiple (scroll, click, Escape)

---

### Success Metrics

1. Info appears within 100ms of tab activation
2. Info dismisses immediately on scroll down (< 50ms)
3. Info does NOT appear if user has already scrolled down
4. Navigation arrows accurately reflect back/forward state
5. Audio icon appears when tab is playing audio
6. SPA navigation detection works for common frameworks (React, Vue, etc.)
7. Info does not interfere with page scrolling or clicking

---

### Related Interactions

- [interaction_tab_switching.md](./interaction_tab_switching.md) - Precedes info display
- [interaction_tab_menu.md](./interaction_tab_menu.md) - Tab menu for actions

---

### Code References

**Components:**
- `ActiveTabInfo.svelte` - Main info overlay
- `App.svelte` - Event handling, visibility control, and SPA detection

**Store Integration:**
- `tabStore.js` - Current tab data

**Background Script:**
- `background.js` - Tab activation and navigation listeners
