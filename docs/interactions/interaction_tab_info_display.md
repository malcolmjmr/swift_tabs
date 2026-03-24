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
| 4 | Info overlay fades in | Displays favicon, title, URL, action hints | Animation: 150ms fade-in |
| 5 | Auto-dismiss timer starts (3 seconds) | If no interaction, info will hide | `dismissTimeout` set |
| 6 | User scrolls down OR timeout expires | Info overlay fades out | `isVisible = false` |

**Note:** ActiveTabInfo is **not** shown in Navigation Mode.

#### Dismiss Behaviors

| User Action | System Response | Timing |
|-------------|-----------------|--------|
| Scroll down (deltaY > 0) | Fade out info overlay | Immediate |
| Scroll up (deltaY < 0) | Keep info visible / re-show if hidden | — |
| Click outside info overlay | Fade out info | Immediate |
| Press Escape | Fade out info | Immediate |
| Timeout (no interaction) | Auto-fade out | 3000ms |
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
│  https://example.com/page-path          │
│                                         │
│  [Hold ⌘ for actions]                   │
└─────────────────────────────────────────┘
```

**Position:** Bottom-right corner (default), 20px from edges  
**Style:** Semi-transparent dark background, light text  
**Contents:**
- Favicon (16x16px)
- Tab title (truncated with ellipsis if long)
- URL (truncated, lighter color)
- Meta key hint (⌘ on Mac, ⊞ on Windows/Linux)

---

### Scroll Detection Logic

```javascript
// Dismiss on scroll down
function handleScroll(event) {
  if (event.deltaY > SCROLL_DOWN_THRESHOLD) {
    // User scrolled down - dismiss info
    hideActiveTabInfo();
  } else if (event.deltaY < 0 && !isVisible) {
    // User scrolled up - optionally re-show
    showActiveTabInfo();
  }
}

const SCROLL_DOWN_THRESHOLD = 50; // pixels
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

---

### State Management

```javascript
// Component State (ActiveTabInfo.svelte)
let isVisible = false;
let currentTab = null;
let dismissTimeout = null;
const AUTO_DISMISS_MS = 3000;

// Props
export let tab; // Tab object with id, title, url, favIconUrl
export let mode = 'auto'; // 'auto' | 'navigation'

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
  type: "NAVIGATION_COMPLETE",
  tabId: number,
  url: string,
  title: string
}

// Sent to dismiss info
{
  type: "DISMISS_ACTIVE_TAB_INFO"
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
- Meta key symbol uses platform-appropriate text (⌘ vs ⊞)
- Info is purely contextual and doesn't block content interaction
- Dismiss methods are multiple (scroll, click, Escape, timeout)

---

### Success Metrics

1. Info appears within 100ms of tab activation
2. Info dismisses immediately on scroll down (< 50ms)
3. Info does NOT appear if user has already scrolled down
4. Meta key hint is visible and recognizable
5. Info does not interfere with page scrolling or clicking

---

### Related Interactions

- [interaction_tab_switching.md](./interaction_tab_switching.md) - Precedes info display
- [interaction_tab_menu.md](./interaction_tab_menu.md) - Triggered by Meta key from info display

---

### Code References

**Components:**
- `ActiveTabInfo.svelte` - Main info overlay
- `App.svelte` - Event handling and visibility control

**Store Integration:**
- `tabStore.js` - Current tab data

**Background Script:**
- `background.js` - Tab activation and navigation listeners
