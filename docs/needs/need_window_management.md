## Need: Window and Group Management

**Status:** Partially Implemented  
**Priority:** High (Core Tier 1)

---

### Jobs to Be Done

When I'm organizing my digital workspace, I want to **navigate between browser windows and tab groups** so that I can **switch between different contexts instantly**.

#### Key JTBD Statements:

1. **Main JTBD**: When I have multiple windows or tab groups open, I want to flip through them using the same ergonomics as switching tabs (Meta+Scroll Horizontal), so I don't break my flow.

2. **Secondary JTBD**: When I need a bird's-eye view, I want to see all open windows/groups and their respective tabs in the Windows Overview.

3. **Tertiary JTBD**: When using the TabsView in navigation mode, I want to see dot indicators for each window/group and horizontally scroll between them, so I can access any context from the same interface.

---

### Current Pain Points (Without Solution)

1. **Hidden Windows**: Multiple windows are invisible to each other; must use OS taskbar.
2. **Tab Groups Hidden**: Chrome's tab groups are collapsed or require precise clicking to see.
3. **Context Confusion**: Don't remember which window/group has which tabs.
4. **Disconnected Navigation**: Switching windows feels like a "system" action rather than a "browser" action.

---

### Desired Outcome

User can navigate across the entire workspace, treating **windows and tab groups as peer containers**:

**Navigation Model:**
- **Horizontal movement** (Meta+Horizontal Scroll or Arrow Left/Right): Navigate between containers (windows AND tab groups)
- **Vertical movement** (Meta+Vertical Scroll or Arrow Up/Down): Navigate between tabs within the selected container
- **Activation** (Space or Enter): Switch to the selected container and activate the selected tab

Both windows and tab groups appear in the same navigation sequence — there is no separate "tab group navigation feature." They use identical display and interaction patterns.

**Windows Overview:**
Displays all containers (windows and tab groups) in a horizontal layout. Each container card shows:

```
┌─────────────────────────────────────────┐
│  [Active Tab Title - or hovered tab]    │  ← Title area
├─────────────────────────────────────────┤
│  [Group Name]        │  [color bar]     │  ← Group row (if tab group)
├─────────────────────────────────────────┤
│  [○][○][○][○][○][○][○][○][○][○][○][○] │  ← Wrapped favicons
│  [○][○][○][○]                           │    (hover shows tooltip)
└─────────────────────────────────────────┘
```

- **Title area**: Shows active tab title by default; changes to show hovered tab's title
- **Group row**: For tab groups, displays group name and colored bar matching the group's Chrome color
- **Favicon grid**: All tabs in the container shown as favicons (wrapped); hover displays tab title

**TabsView (Navigation Mode):**
- Dot indicators represent all containers (windows and tab groups)
- Horizontal scroll switches between containers
- Vertical list shows only the tabs within the selected container
- For tab groups: shows only the tabs in that group
- For windows: shows only the tabs directly in that window (grouped tabs appear under their respective group containers)

---

### Data Model

The store maintains three related structures:

```javascript
windows: [...]        // Raw windows from Chrome API
tabGroups: [...]      // Raw tab groups from Chrome API (via chrome.tabGroups)
containers: [...]     // Unified array for navigation:
                     //   { type: 'window'|'group', id, title, tabs, color?, ... }
```

- `windows` and `tabGroups` hold the raw Chrome data
- `containers` is the merged, sorted array used for navigation and display
- Both windows and tab groups appear as peers in `containers`

---

### Success Metrics

1. Window/group switching is as fast and ergonomic as tab switching.
2. TabsView displays dot indicators for all containers; horizontal scroll switches between them.
3. Overview provides a single view of the complete multi-window, multi-group session.
4. Tab groups display with their Chrome color in the group row.
5. Favicon hover shows tab titles immediately.
6. Zero reliance on OS-level window management for browser navigation.

---

### Related Features

- [Feature: Windows Overview](../features/feature_windows_overview.md)
- [Feature: New Window Creation](../features/feature_new_window_creation.md)
- [Feature: Move to New Window](../features/feature_move_to_new_window.md)

---

### Notes

**Windows and Tab Groups as Peers:**

In Swift Tabs, both OS windows and Chrome tab groups are first-class containers:
- They appear interleaved in the `containers` array
- They share the same navigation, display, and interaction logic
- The only visual distinction is the group row (name + color bar) for tab groups

This simplifies the mental model: users navigate containers horizontally and tabs within them vertically, without thinking about whether a container is a window or a group.

**Tab Group API:**
- Groups have IDs, titles, colors, and collapsible state via `chrome.tabGroups` API
- A tab group's tabs are a subset of a window's tabs (they still belong to the window)
- In the `containers` model, tab groups are extracted and displayed separately from their parent window

**Implementation Status:**
- New window creation, window dots navigation, Move to existing window: Implemented
- Tab group API integration: Not implemented (requires chrome.tabGroups permission)
- Unified containers data model: Not implemented
- Windows Overview with group row and favicon grid: Partially implemented
