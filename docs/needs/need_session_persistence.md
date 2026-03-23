## Need: Session Persistence

**Status:** Planned  
Priority: High

---

### Jobs to Be Done

When my browser crashes, restarts, or I accidentally close a window, I want to **restore my complete workspace** so that I can **resume work without losing context or re-establishing my browsing environment**.

#### Key JTBD Statements:

1. **Main JTBD**: When Chrome crashes or restarts, I want all my windows and tabs restored exactly as they were, so I don't lose my workspace.

2. **Secondary JTBD**: When I accidentally close a window with many tabs, I want to recover it quickly, so I don't have to hunt through history.

3. **Tertiary JTBD**: When I want to preserve a specific workspace configuration, I want to save it as a named session, so I can return to it later.

---

### Current Pain Points (Without Solution)

1. **Chrome's Native Restore Is Limited**: Chrome restores windows, but doesn't maintain the organizational context users build with Swift Tabs
2. **Lost Gesture Context**: Overview widget state, recent navigations, and user context isn't preserved
3. **Window Confusion After Restore**: When Chrome restores windows, they often appear in wrong order or wrong monitors
4. **No Named Sessions**: Can't save specific project workspaces to return to later
5. **Incognito Data Loss**: Incognito windows are intentionally not restored, but users may have important work there

---

### Desired Outcome

Complete workspace persistence that users can trust:
- Automatic saving of all window/tab state every 30 seconds
- Automatic restore after browser restart (configurable)
- Named session snapshots that can be saved and restored on demand
- Recovery of recently closed windows (separate from Chrome's history)
- Session preview before restoring (see what you're about to restore)

---

### Success Metrics

1. All windows/tabs restored within 2 seconds of Chrome restart
2. Tab order preserved exactly
3. Active tab in each window remembered
4. Named sessions: Save in under 3 clicks, restore in under 3 clicks
5. Zero data loss for sessions saved within last 30 seconds before crash

---

### Related Features

- Feature: Auto-Save Session (planned)
- Feature: Named Session Snapshots (planned)
- Feature: Window Recovery (planned)
- Feature: Session Browser (planned)

---

### Notes

Session persistence is a **trust-critical feature**. Users won't fully adopt Swift Tabs for serious work if they fear losing their workspace. This need underpins confidence in all other features.

Chrome's built-in session restore can serve as a backup, but Swift Tabs should maintain its own session state for reliability and to preserve the organizational structure users create with the overview widget.
