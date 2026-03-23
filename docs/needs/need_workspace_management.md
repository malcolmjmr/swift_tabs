## Need: Workspace Management

**Status:** Planned  
**Priority:** Medium

---

### Jobs to Be Done

When I switch between projects or contexts, I want to **organize tabs into named workspaces** so that I can **save, suspend, restore, and switch between distinct browsing contexts without juggling windows or losing organization**.

#### Key JTBD Statements:

1. **Main JTBD**: When I have tabs for Work, Personal, Research, etc., I want to group them into named workspaces, so I can switch contexts with one action instead of managing multiple windows.

2. **Secondary JTBD**: When I finish a project session, I want to save the current tab set as a named workspace, so I can return to it later exactly as I left it.

3. **Tertiary JTBD**: When I'm done with a workspace temporarily, I want to suspend it (close tabs but save state), so I free up resources without losing my place.

4. **Quaternary JTBD**: When I'm in a workspace, I want to add new tabs to it or move tabs between workspaces, so my organization stays current without manual cleanup.

5. **Future JTBD**: When I have reference material I don't need right now, I want to save it to workspace storage, so I can access it later without keeping tabs open.

---

### Current Pain Points (Without Solution)

1. **Window Proliferation**: Users open multiple windows to separate contexts, leading to clutter
2. **No Named Grouping**: Tabs are either in one window (mixed) or many windows (unwieldy)
3. **Lost Organization**: Closing a window loses the mental model of "this was my Research session"
4. **Switching Friction**: Switching contexts requires Alt+Tab through windows or hunting through tab bar
5. **Resource Waste**: Keeping all tabs open consumes memory even for inactive contexts
6. **No Quick Resume**: Can't suspend a task and return to it later exactly as it was

---

### Desired Outcome

Complete workspace lifecycle management:
- Create named workspaces from current tab set
- Switch between workspaces (restore that tab set, optionally hide/suspend current)
- Suspend workspace: close tabs but save state for quick resume
- Resume workspace: restore exactly as it was (active tab, scroll positions if possible)
- Add/remove tabs from a workspace while it's active
- Workspace list accessible from overview or command palette
- Future: Storage facility for reference material not currently needed

---

### Success Metrics

1. Create workspace: Under 3 actions from current state
2. Switch workspace: Single action (keyboard or gesture)
3. Suspend workspace: Single action; frees resources immediately
4. Resume workspace: Single action; restores in under 2 seconds
5. Workspace state preserved across browser sessions
6. Clear separation between "workspace" (named context) and "window" (Chrome container)

---

### Related Features

- Feature: Named Session Snapshots
- Feature: Windows Overview (workspace display)
- Feature: New Window Creation (workspace may map to window)
- Feature: Omnibox (workspace commands)
- Feature: Tab Lifecycle Management (move tabs between workspaces)

---

### Notes

This merged need combines two previously separate concerns:
- **Organization**: Named workspaces for context switching
- **Persistence**: Save, suspend, and resume task/activity comprised of multiple tabs

Chrome handles basic crash recovery—this need addresses intentional workspace management during normal use. Users should be able to confidently close/suspend a workspace knowing they can resume exactly where they left off.

The future "storage facility" concept extends this to reference material—saved bookmarks or reading lists associated with a workspace but not kept as open tabs.
