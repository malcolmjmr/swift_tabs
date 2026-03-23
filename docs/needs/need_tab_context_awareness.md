## Need: Tab Context Awareness

**Status:** Implemented  
**Priority:** High

---

### Jobs to Be Done

When I'm working in a browser, I want to **understand my current browsing context** so that I can **make informed decisions about where I am and what else is available**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm on a tab, I want to see basic information about it (title, favicon) and what other tabs are nearby, so I understand my place in the browsing session.

2. **Secondary JTBD**: When I'm considering switching tabs, I want to preview what's in adjacent tabs without committing to switching, so I can decide if I want to go there.

---

### Current Pain Points (Without Solution)

1. **Truncated Titles**: Tab bar cuts off long titles, making identification hard
2. **Lost Context**: Can't see what other tabs are nearby without hovering
3. **No Quick Preview**: Must click to a tab to see what it contains
4. **Missing Tab Metadata**: Can't quickly see if tab is pinned, loading, etc.

---

### Desired Outcome

User can instantly see:
- Current tab's full title and favicon
- What tabs are immediately above and below in the window
- Quick status indicators (loading, pinned, muted)

All presented in a non-intrusive overlay that appears on demand.

---

### Success Metrics

1. User can see active tab info within 100ms of triggering
2. Adjacent tabs visible without scrolling
3. Information remains visible as long as user holds gesture
4. Dismisses naturally when user completes their action

---

### Related Features

- [Feature: Active Tab Information Display](../features/feature_active_tab_information.md)
- [Feature: Overview Widget](../features/feature_overview_widget.md)

---

### Notes

This need supports the navigation need by providing context before/during navigation decisions. The active tab display is the "resting state" of the gesture interface.
