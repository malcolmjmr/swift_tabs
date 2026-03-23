## Need: Tab Lifecycle Management

**Status:** Partially Implemented  
Priority: High

---

### Jobs to Be Done

When I'm managing my browsing session, I want to **perform common actions on tabs** (close, reload, save, move) so that I can **maintain a clean, organized workspace**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm done with a tab, I want to close it or move it out of the way, so my workspace stays focused on current work.

2. **Secondary JTBD**: When I find useful content, I want to save it to a session or bookmark it, so I can return to it later without keeping the tab open indefinitely.

3. **Tertiary JTBD**: When a tab is stuck or outdated, I want to reload it quickly, so I can continue working without hunting for the reload button.

---

### Current Pain Points (Without Solution)

1. **Close Friction**: Small X button, accidental closures
2. **Save Friction**: Multiple clicks to bookmark, organize into folders
3. **Reload Friction**: Must target small reload button in address bar
4. **Move Friction**: Drag-and-drop is imprecise, especially between windows
5. **No Quick Share**: Copying URL requires clicking address bar, selecting all, copying

---

### Desired Outcome

Common tab actions available instantly from gesture interface:
- Close with confirmation/undo
- Reload instantly
- Copy URL (share)
- Save to current session or bookmark folder
- Move to another window or saved session

Each action should be one or two gestures maximum.

---

### Success Metrics

1. Close tab: Single gesture (swipe left), with undo available
2. Reload: Single click/tap
3. Share (copy URL): Single click/tap
4. Save: Single click, intelligent defaults for location
5. Move: Single gesture + selection

---

### Related Features

- [Feature: Quick Tab Actions](../features/feature_quick_tab_actions.md)
- [Feature: Tab Close with Undo](../features/feature_tab_close_undo.md)
- [Feature: Window Merge & Move](../features/feature_window_merge_move.md)

---

### Notes

Currently implemented: Share (copy URL), Reload  
Partially implemented: Save (needs session integration)  
Planned: Close with undo, Move to window/session
