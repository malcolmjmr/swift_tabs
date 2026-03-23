## Need: Efficient Tab Navigation

**Status:** Implemented  
**Priority:** Critical

---

### Jobs to Be Done

When I have many tabs and windows open, I want to **switch between them effortlessly** so that I can **maintain my flow state without breaking focus**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm working, I want to use the Meta key and scroll wheel to flip through tabs and windows, keeping my hands in place and my eyes on the content.

2. **Secondary JTBD**: When I'm at the keyboard, I want to use arrow keys to navigate my workspace without needing to remember complex shortcuts.

---

### Current Pain Points (Without Solution)

1. **Precise Clicking**: Small tab targets require careful mouse positioning.
2. **Window Isolation**: Switching windows usually requires OS-level shortcuts (Alt+Tab/Cmd+`) which feels disconnected from tab navigation.
3. **Chorded Shortcuts**: Default browser shortcuts are often physically awkward (Ctrl+Tab, Cmd+Option+Arrows).

---

### Desired Outcome

The user can navigate through the entire workspace (tabs and windows) using **Meta-Scroll** or **Arrow Keys**:
- Vertical movement for tabs, horizontal for windows.
- Works without moving the mouse to the chrome.
- Provides immediate feedback.

---

### Success Metrics

1. Tab/Window switching happens instantly upon scroll or keypress.
2. No mouse movement to tab bar required.
3. User can navigate across windows as easily as across tabs.

---

### Related Features

- [Feature: Gesture-Based Tab Navigation](../features/feature_gesture_tab_navigation.md)
- Need: [Discoverable Keyboard Interaction](./need_discoverable_keyboard_interaction.md) (keyboard navigation path)

---

### Notes

This need is a **core value proposition** of Swift Tabs, supported by [Immersive Experience](./need_immersive_experience.md) and [Ergonomic Input Primacy](./need_ergonomic_input_primacy.md). Navigation should prioritize scroll and keyboard so the mouse stays in the content area. Most other features support or enhance this primary workflow.
