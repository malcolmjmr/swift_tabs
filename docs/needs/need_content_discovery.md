## Need: Content Discovery

**Status:** Planned
Priority: Medium

---

### Jobs to Be Done

When I'm consuming content on a webpage, I want to **quickly locate specific text within the page** so that I can **find the information I need without scrolling or re-reading the entire page**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm reading a page and need to locate specific text, I want to quickly open find-in-page without reaching for Cmd+F, so I can stay in the gesture/keyboard flow.

2. **Secondary JTBD**: When I have many tabs open, I want to search through all open tabs for specific content, so I can find the page I need even if I don't remember which tab it's in.

---

### Current Pain Points (Without Solution)

1. **Cmd+F Friction**: Must leave gesture flow to use browser's find shortcut
2. **No Multi-Tab Search**: Can't search across all open tabs for specific content
3. **Find UI Interruption**: Browser's find bar takes up space and breaks immersion
4. **Lost Context**: Switching to find mode loses visual context of where you were reading

---

### Desired Outcome

Find capabilities integrated into the gesture interface:
- Quick find-in-page with dedicated key ("/" like Vim)
- Search within current tab with match navigation
- Search across all open tabs for specific titles or content
- Non-intrusive UI that doesn't break the browsing flow

---

### Success Metrics

1. Open find-in-page: Single keypress from navigation mode ("/" or "f")
2. Navigate matches: Enter/Shift+Enter to next/previous
3. Close find: Escape key
4. Search across tabs: Available in omnibox with "tab:" prefix or dedicated mode

---

### Related Features

- [Feature: Find in Page](../features/feature_find_in_page.md)
- [Feature: Omnibox with Tab Search](../features/feature_omnibox.md)

---

### Notes

This need extends the "Tab Context Awareness" need to include content-level awareness. While context awareness shows you what tabs exist, content discovery helps you find specific information within those tabs.

The omnibox can serve as the primary search interface, with different modes for:
- URL/search input (default)
- Tab title search (prefix: "tab:")
- History/bookmark search

Find-in-page is a separate, more immediate action for the current tab.
