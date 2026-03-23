## Need: Window Management

**Status:** Partially Implemented  
Priority: Medium

---

### Jobs to Be Done

When I'm organizing my digital workspace, I want to **create, navigate between, and reorganize browser windows** so that I can **separate different contexts and manage screen real estate effectively**.

#### Key JTBD Statements:

1. **Main JTBD**: When I need to start a new task or context, I want to create a new window instantly, so I can separate it from my current workspace.

2. **Secondary JTBD**: When I have multiple windows open, I want to see what's in each and navigate between them, so I can find the context I need.

3. **Tertiary JTBD**: When I want to consolidate my workspace, I want to move tabs between windows or merge windows entirely, so I can reduce clutter.

---

### Current Pain Points (Without Solution)

1. **Hidden Windows**: Multiple windows are invisible to each other; must use OS taskbar
2. **Move Friction**: Dragging tabs between windows is finicky
3. **Merge Impossible**: No native way to combine two windows into one
4. **New Window Friction**: Ctrl+N works, but not integrated with tab management
5. **Context Confusion**: Don't remember which window has which tabs

---

### Desired Outcome

User can from the overview widget:
- See all open windows represented visually
- Navigate to any window instantly
- Create new windows (normal or incognito)
- Move tabs between windows via drag/drop or gesture
- Merge two windows into one
- See active window indicator and saved session status

---

### Success Metrics

1. See all windows: Available in overview widget
2. Navigate to window: One click
3. Create new window: One click, opens immediately
4. Move tab between windows: Drag-and-drop or gesture + select
5. Merge windows: Select source + destination, confirm

---

### Related Features

- [Feature: Overview Widget](../features/feature_overview_widget.md)
- [Feature: Window Merge & Move](../features/feature_window_merge_move.md)
- [Feature: New Window Creation](../features/feature_new_window_creation.md)

---

### Notes

This need bridges tab management (single window) and session management (saved contexts). The overview widget is the central hub for all window operations.

Implemented: New window creation, window dots navigation  
Planned: Drag-and-drop between windows, merge functionality
