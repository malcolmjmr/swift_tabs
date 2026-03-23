## Need: Find in Page

**Status:** Planned  
**Priority:** Medium

---

### Jobs to Be Done

When I'm reading a webpage, I want to **quickly locate specific text** so that I can **find information without scrolling or re-reading**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm reading a page and need to locate specific text, I want to quickly open find-in-page with a single key (`/`), so I can stay in the flow without reaching for Cmd+F.

2. **Secondary JTBD**: When find results appear, I want to navigate between matches with single keys, so I can scan through occurrences efficiently.

---

### Current Pain Points (Without Solution)

1. **Cmd+F Friction**: Must leave gesture flow to use browser's find shortcut
2. **Find UI Interruption**: Browser's find bar takes up space and breaks immersion
3. **Lost Context**: Switching to find mode loses visual context of where you were reading
4. **No Keyboard Navigation**: Navigating matches requires mouse clicks or arrow keys

---

### Desired Outcome

Find-in-page integrated into the gesture/keyboard interface:
- Quick find-in-page with dedicated key (`/` like Vim)
- Search within current tab with match navigation
- Non-intrusive UI that doesn't break the browsing flow
- Navigate matches: `n` for next, `N` for previous, `Esc` to close

---

### Success Metrics

1. Open find-in-page: Single keypress (`/`) from any state
2. Navigate matches: `n`/`N` or Enter/Shift+Enter to next/previous
3. Close find: `Esc` key
4. No mouse required for full find workflow
5. Find UI overlays content minimally, preserves immersion

---

### Related Features

- [Feature: Find in Page](../features/feature_find_in_page.md)
- Feature: Omnibox (related but separate—omnibox searches tabs, this searches within page)

---

### Notes

This need extends "Tab Context Awareness" to include content-level awareness within the active tab. While context awareness shows you what tab you're on, find-in-page helps you locate specific information within that tab.

The `/` key is chosen to match Vim conventions and be easily accessible without modifiers.
