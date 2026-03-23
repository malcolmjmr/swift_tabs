## Need: Window/Session Organization

**Status:** Planned  
Priority: Medium

---

### Jobs to Be Done

When I'm researching or working on a project, I want to **save my entire browsing context** (all tabs in a window) so that I can **return to that workspace later without losing my place**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm done working on a task but might need to return to it, I want to save all open tabs as a named session, so I can close the window but recover it later exactly as it was.

2. **Secondary JTBD**: When I have multiple projects or contexts, I want to organize them into named sessions, so I can switch between work, personal, and research contexts easily.

3. **Tertiary JTBD**: When I revisit a saved session, I want it to restore exactly where I left off, so I don't waste time reconstructing my workspace.

---

### Current Pain Points (Without Solution)

1. **Lost Workspaces**: Closing a window loses all context
2. **Bookmark Clutter**: Saving individual bookmarks loses tab organization
3. **Session Amnesia**: Can't remember what tabs were in a project
4. **Manual Restoration**: Must manually reopen each tab when returning to a task
5. **Naming Friction**: Hard to name/organize sessions meaningfully

---

### Desired Outcome

User can:
- Save any window as a named session with one action
- Auto-generate meaningful names based on tab content (LLM-assisted)
- Browse recent sessions grouped by time period
- Restore any session (open all tabs) or add individual tabs from it
- Create new empty sessions for planning

Sessions stored as bookmark folders with metadata (lastAccess, created timestamps, favicons).

---

### Success Metrics

1. Save window: 2 clicks max (trigger + confirm/edit name)
2. Browse sessions: Accessible from main widget interface
3. Restore: One click to open all tabs, or individual selection
4. Naming: LLM suggests title based on tab content; user can edit
5. Organization: Sessions grouped by recency (today, yesterday, this week, etc.)

---

### Related Features

- [Feature: Window Save & Session Management](../features/feature_window_save_sessions.md)
- [Feature: Saved Session Browser](../features/feature_saved_session_browser.md)

---

### Notes

This is a "power user" feature that extends Swift Tabs from a navigation tool to a session management system. It builds on the core gesture interface but serves a different need (preservation vs. navigation).

Implementation depends on Chrome bookmarks API for storage.
