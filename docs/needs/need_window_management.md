## Need: Window Management

**Status:** Partially Implemented  
Priority: Medium

---

### Jobs to Be Done

When I'm organizing my digital workspace, I want to **create and navigate between browser windows** so that I can **separate different contexts and manage screen real estate effectively**.

#### Key JTBD Statements:

1. **Main JTBD**: When I need to start a new task or context, I want to create a new window instantly, so I can separate it from my current workspace.

2. **Secondary JTBD**: When I have multiple windows open, I want to see what's in each and navigate between them, so I can find the context I need.

3. **Tertiary JTBD**: When I want to separate a specific tab into its own workspace, I want to move it to a new window quickly, so I can organize my browsing contexts without drag-and-drop.

---

### Current Pain Points (Without Solution)

1. **Hidden Windows**: Multiple windows are invisible to each other; must use OS taskbar
2. **New Window Friction**: Ctrl+N works, but not integrated with tab management
3. **Context Confusion**: Don't remember which window has which tabs
4. **Move to New Window Friction**: Dragging tab out creates new window, but breaks flow; no keyboard shortcut

---

### Desired Outcome

User can from the overview widget:
- See all open windows represented visually
- Navigate to any window instantly
- Create new windows (normal or incognito)
- See active window indicator
- Move any tab to a new window with simple key combination

---

### Success Metrics

1. See all windows: Available in overview widget
2. Navigate to window: One click
3. Create new window: One click, opens immediately
4. Move tab to new window: Modifier key + Enter (Shift+Enter)

---

### Related Features

- [Feature: Overview Widget](../features/feature_overview_widget.md)
- [Feature: New Window Creation](../features/feature_new_window_creation.md)
- [Feature: Move to New Window](../features/feature_move_to_new_window.md)

---

### Notes

This need covers basic window operations. The overview widget is the central hub for window navigation and creation.

Implemented: New window creation, window dots navigation, Move to existing window
Partially implemented: Move to new window (Shift+Enter planned)
