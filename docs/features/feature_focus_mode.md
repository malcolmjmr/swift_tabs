## Feature: Focus Mode View Toggle

**Feature ID:** 106  
**Status:** Planned  
**Priority:** Medium

---

### Overview

A view filter that distinguishes between "focused" and "unfocused" tabs, allowing users to hide off-topic tabs and concentrate on their current activity. Unfocused tabs fade visually by default; when Focus Mode is activated, unfocused tabs are completely hidden from the tab list.

---

### Tab States

**Unfocused (Default):**
- Visual: Opacity 0.85
- Behavior: Visible in tab list, navigable
- Timer: Not actively tracked

**Focused:**
- Visual: Opacity 1.0
- Behavior: Highlighted as active/current
- Timer: 15 minutes from first activation (calculated on tab data updates)

**Hidden (Focus Mode Active):**
- Visual: Not visible in tab list at all
- Behavior: Excluded from navigation (Meta+Scroll skips them)
- Timer: N/A (while in Focus Mode, timer doesn't apply to visible tabs)

---

### How Tabs Become Focused

**Automatic Focus:**
- User activates a tab (clicks, Meta+Scroll to it, keyboard navigation)
- Tab becomes "focused" immediately
- 15-minute timer starts from this activation
- Timer only calculated when tab data is updated (e.g., title change, URL change)

**Timer Behavior:**
- Fixed 15-minute window from first activation
- Timer resets on new activation
- While in Focus Mode (filtering unfocused tabs): Timer doesn't apply to visible tabs
- No grace period: When timer expires, tab becomes unfocused immediately

---

### Access

| Location | Path |
|----------|------|
| Tab Menu | Toggle "Hide Unfocused Tabs" option |
| Container Actions Menu | Toggle "Focus Mode" for current window |
| Keyboard Shortcut | TBD (e.g., Meta+F) |

---

### Visual Behavior

**Normal Mode (Toggle OFF):**
- All tabs visible in tab list
- Focused tabs: Opacity 1.0
- Unfocused tabs: Opacity 0.85
- Active tab: Always focused

**Focus Mode (Toggle ON):**
- Only focused tabs visible in tab list
- Unfocused tabs: Hidden (filtered out entirely)
- Navigation (Meta+Scroll): Only cycles through focused tabs
- Visual indicator: "Focus Mode" badge/icon in UI

---

### Navigation in Focus Mode

**Meta+Scroll Behavior:**
- Normal Mode: Scrolls through all tabs in container
- Focus Mode: Scrolls only through focused tabs
- When reaching last focused tab: Wraps or stops (TBD)

**Switching Windows:**
- Meta+Horizontal Scroll: Works normally (switches containers)
- Only focused tabs shown in each window

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| All tabs unfocused in window | Show message: "No focused tabs. Disable Focus Mode to see all tabs." |
| Only one tab focused | Normal navigation, no wrapping |
| Timer expires while viewing tab | Tab immediately becomes unfocused (opacity 0.85) |
| Timer expires while in Focus Mode | Tab remains focused (timer disabled in Focus Mode) |
| User closes last focused tab | Falls back to showing unfocused tabs or shows empty state |
| Switching to tab with only unfocused tabs | Prompt to disable Focus Mode or show all tabs grayed out |

---

### Related Features

- Tab Menu [6] - Contains Focus Mode toggle
- Container Actions Menu [11] - Contains Focus Mode toggle for window
- Task Management [12] - Future: Tabs saved to tasks can be batch-focused
- Suggestions & Assistance [107] - Future: AI suggests which tabs to focus based on activity

---

### Implementation Notes

**Focus Tracking:**
- Store `lastActivated` timestamp per tab
- Store `isFocused` boolean per tab
- Calculate focus state on-demand based on timestamp + 15min window
- Update on tab data changes (title, URL updates)

**State Persistence:**
- Focus state is session-based (not persisted across browser restarts)
- Focus Mode toggle is per-window (can have different windows in different modes)

**Performance:**
- Focus calculation should be lazy (only when needed for display/navigation)
- No background polling required

---

### Future Enhancements

**AI-Powered (Suggestions & Assistance):**
- Auto-suggest entering Focus Mode based on browsing patterns
- Smart focus detection: Tab remains focused if actively reading (scroll detection)
- Task-aware focus: Focus all tabs associated with current task

**Manual Controls:**
- Pin focused state (keep tab focused indefinitely)
- Batch focus: Select multiple tabs, mark all as focused
- Focus by domain/topic: Focus all tabs from same site or similar content
