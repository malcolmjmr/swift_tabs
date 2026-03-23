## Need: Tab Context Awareness

**Status:** Implemented  
**Priority:** High

---

### Jobs to Be Done

When I'm working in a browser, I want to **understand my current browsing context** so that I can **make informed decisions about where I am and what else is available**.

#### Key JTBD Statements:

1. **Main JTBD**: When I navigate to a new URL or switch tabs, I want to see the tab's information instantly, so I confirm I'm in the right place.

2. **Secondary JTBD**: When I'm reading a page, I want the browser interface to stay out of my way, but be easily accessible if I scroll back up for context.

---

### Current Pain Points (Without Solution)

1. **Truncated Titles**: Tab bar cuts off long titles, making identification hard.
2. **Persistent UI**: Tab bars take up space even when not needed for navigation.
3. **Implicit Context**: Users often lose track of which tab they just switched to.

---

### Desired Outcome

User can instantly see:
- Current tab's full title and favicon upon navigation.
- The Meta key symbol (⌘/⊞) indicating available deep actions.
- Interface that respects content focus (hides on scroll down).

---

### Success Metrics

1. User sees active tab info immediately upon navigation.
2. Interface disappears as soon as user engages with content (scroll down).
3. Meta key symbol is visible as an affordance for the Tab Menu.

---

### Related Features

- [Feature: Active Tab Information Display](../features/feature_active_tab_information.md)
- [Feature: Windows Overview](../features/feature_windows_overview.md)

---

### Notes

This need supports the navigation need by providing context before/during navigation decisions. The active tab display is the "resting state" of the gesture interface.
