## Feature: Active Tab Information Display

**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Tab Context Awareness

---

### Description

Display an overlay showing the current tab's information (favicon, title, URL, navigation state, and audio status) automatically upon tab activation or navigation. This provides immediate context about the current browsing position without requiring the user to scan the tab bar.

---

### Trigger

- **Activation:** Automatically appears upon **tab activation** (switching tabs) or **page navigation** (URL change, including SPA navigation).
- **SPA Detection:** Click-based detection catches Single Page App navigations by monitoring `document.title` changes.

---

### Visibility & Persistence

- **Auto-Hide:** Automatically hides when the user **scrolls down** on the web page.
- **Manual Dismiss:** Click outside overlay, press Escape, or scroll down.
- **Timeout:** Auto-dismisses after 3 seconds if not manually dismissed.

---

### Information Displayed

| Element | Icon/Format | Condition |
|---------|-------------|-----------|
| Favicon | Tab's favicon or first-letter fallback | Always shown |
| Title | Tab title (truncated if long) | Always shown |
| URL | Hostname only (e.g., example.com) | Always shown |
| Back Navigation | `←` arrow | Shown when back navigation is possible |
| Forward Navigation | `→` arrow | Shown when forward navigation is possible |
| Audio Playing | `🔊` icon | Shown when tab is playing audio |

---

### Visual Design

**Layout:**
```
┌─────────────────────────────────────────┐
│  [🔲 Favicon]  Page Title Goes Here     │
│  ← → example.com                🔊      │
└─────────────────────────────────────────┘
```

**Position:** Bottom-right corner, 20px from edges  
**Style:** Semi-transparent dark background, light text  
**Size:** Fixed 360px × 80px

---

### Dismissal

- **Scroll down:** Hide immediately when user scrolls down (deltaY > 0)
- **Click outside:** Hide immediately when clicking outside the overlay
- **Escape key:** Hide immediately when Escape is pressed
- **Timeout:** Auto-fade out after 3000ms of no interaction
- **Transition:** Fade out over 200ms

---

### Code References

- Implementation: `ActiveTabInfo.svelte`, `App.svelte`
- Trigger: `App.svelte` - `fetchTabInfo()`, `onTabActivatedMessage()`, `onTabUpdatedMessage()`
- SPA Detection: `App.svelte` - `handleClick()` with `lastDocumentTitle` tracking
- State: Local state in `App.svelte` (`showActiveTabInfo`, `lastDocumentTitle`)
- Store access: `chromeService.getCurrentTab()` for tab data including `audible`, navigation state

---

### Dependencies

- Chrome Tabs API for tab information (title, URL, favicon, audible)
- Chrome History/Navigation API (indirectly via tab state for back/forward)

---

### Future Enhancements

- ~~Audio playing indicator~~ ✅ **Implemented**
- ~~Back/Forward navigation indicators~~ ✅ **Implemented**
- Show more adjacent tabs (2 above, 2 below)
- Tab preview thumbnails instead of just favicons
- Pinned tab indicator
- Loading state indicator
- Quick actions (Share, Reload, Save)
