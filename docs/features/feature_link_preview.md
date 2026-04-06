## Feature: Link Preview Overlay

**Feature ID:** 101  
**Status:** Planned (vision); **partially superseded in app by [Link Context Menu (9c)](./feature_link_context_menu.md)**  
**Priority:** Medium

---

### Overview

Renders a preview of a link's webpage in a popup window without leaving the current tab. Similar to Chrome's 2024 link preview feature, this allows users to quickly view linked content and decide whether to open it fully or dismiss it.

**Swift Tabs today:** In-page preview is available as the **Preview** action on the **Link Context Menu** (long-press an http(s) link). That uses an **iframe overlay** in the content script, not a separate Chrome popup window. The table below describes the original product vision; see [feature_link_context_menu.md](./feature_link_context_menu.md) for implemented triggers and behavior.

---

### Trigger (vision — not all implemented as standalone gestures)

| Method | Action |
|--------|--------|
| Right-click | On any link, right-click to trigger preview |
| Modifier+Click | Alt/Option+Click on link to trigger preview |

---

### Behavior

**Opening:**
- Preview opens immediately on trigger
- Popup window appears above the cursor
- Smart positioning to avoid screen edges (repositions if near top/left/right edge)
- Window size: Approximately 800x600px (TBD based on testing)

**Content:**
- Renders the actual webpage in a popup window (not an iframe in the current page)
- Loads the full webpage content
- User can scroll and interact with the previewed page
- Navigation within preview is allowed (clicking links in preview loads them in preview)

**Closing:**
- Scroll in the original tab → preview closes
- Click anywhere in the original tab → preview closes
- Press Escape key → preview closes
- Click "Open in New Tab" button → tab opens, preview closes

**Fullscreen Considerations:**
- Opening popup window while browser is fullscreen may cause issues
- Requires testing and potential workarounds (e.g., temporary exit fullscreen, use alternative preview method)
- **Implementation note:** TBD based on testing in fullscreen mode

---

### UI Elements

**Preview Window:**
- Title bar with page title and URL
- Close button (X) in top-right
- "Open in New Tab" button in top-left or header area
- Standard window chrome (minimize, maximize if supported)

**Visual Positioning:**
- Default: Above cursor, centered horizontally on cursor
- Smart adjust: If too close to top edge → appears below cursor
- Smart adjust: If too close to left/right edge → shifts to stay on screen

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Link is dead/offline | Show error page in preview |
| Link takes long to load | Show loading spinner, timeout after 10s |
| User scrolls original tab | Preview closes immediately |
| Browser in fullscreen | TBD - may need alternative implementation |
| Multiple previews triggered | Close previous preview, open new one |
| Popup blocked by OS | Graceful fallback - show notification to allow popups |

---

### Related Features

- Information Summarization [102] - AI-enhanced summary can be added to preview header
- SERP Link Selector [103] - Preview can be integrated with batch selection workflow

---

### Notes

**Mobile:** Not in scope for initial implementation.

**Security:** Preview window runs in separate process; no access to original tab's data.

**Fullscreen Issue:** Chrome's popup window behavior in fullscreen mode needs testing. Alternative approaches if needed:
- Use side panel instead of popup window
- Temporarily exit fullscreen, show popup, re-enter fullscreen
- Render preview in a floating div within the page (iframe-based)
