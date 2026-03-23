## Need: Tab Management

**Status:** Partially Implemented  
Priority: High

---

### Jobs to Be Done

When I'm managing my browsing session, I want to **access, navigate, and perform actions on tabs efficiently** so that I can **maintain a clean, organized workspace and find what I need quickly**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm working, I want to see which tabs are open and switch between them effortlessly, so I can maintain flow state.

2. **Secondary JTBD**: When I'm done with a tab, I want to close it or move it out of the way, so my workspace stays focused on current work.

3. **Tertiary JTBD**: When I find useful content, I want to save it intelligently (as bookmark, entity, or to a task/brief), so I can return to it later in the right context.

4. **Quaternary JTBD**: When a tab is stuck or outdated, I want to reload it quickly, so I can continue working without hunting for the reload button.

5. **Quinary JTBD**: When my tabs are in the wrong order, I want to reorder them with simple gestures, so I can organize my workspace without drag-and-drop precision.

6. **Senary JTBD**: When I have many tabs open, I want to search through them to find a specific one, so I don't have to scroll through the entire list.

7. **Septenary JTBD**: When I need to establish a new task context, I want to quickly move relevant tabs to a new window, so I can separate concerns without disrupting my current flow.

---

### Tab Overwhelm Prevention

A critical sub-need of Tab Management is **combating tab overwhelm**—the cognitive burden of having too many open tabs. This is addressed through three strategies:

#### Strategy 1: Open Fewer Tabs
Reduce the need to open tabs in the first place:

| Technique | Mechanism | JTBD |
|-----------|-----------|------|
| **Link Previews** | Hover or quick-action summary before opening | "Should I open this?" answered without new tab |
| **Tab Summarization** | Abstract/ToC available for open tabs | Replaces need to keep "might read later" tabs open |
| **SERP Batch Processing** | Select and queue links for comparison without opening | Research without tab proliferation |
| **Save to Task/Brief** | Immediate organization without opening | Link saved to task without becoming open tab |

#### Strategy 2: Hide Irrelevant Tabs
Reduce visual and cognitive distraction from off-topic tabs (see [Task Management](./need_task_management.md) for Focus Mode):

| Technique | Mechanism | JTBD |
|-----------|-----------|------|
| **Focus Mode** | Show only tabs associated with current task ([Task Management](./need_task_management.md)) | Eliminate distraction from unrelated work |
| **Task-Centric View** | Filter tab display by task association | See only what supports current objective |
| **Topic Grouping** | Auto-group similar tabs; collapse groups | Reduce visual clutter through organization |
| **Pinning** | Keep essential tabs accessible but minimized | Reserve mental space for active work |

#### Strategy 3: Move or Remove Irrelevant Tabs
Proactively clean workspace through batch operations:

| Technique | Mechanism | JTBD |
|-----------|-----------|------|
| **Batch Close** | Select multiple tabs; close in one action | Rapid workspace hygiene |
| **Move to Workspace** | Batch move tabs to different context | Relocate rather than close for future reference |
| **Sleep/Dismiss** | Remove from active view but retain reference | Clear now, access later without reopening |
| **Proactive Suggestions** | AI suggests actions based on patterns | "Close 8 tabs you haven't visited in 3 days?" |
| **Duplicate Merging** | Detect and close duplicate URLs | Eliminate redundant tabs automatically |

---

### The Tab Overwhelm Equation

Tab overwhelm occurs when:
```
(Cognitive Load) = (Number of Tabs) × (Relevance Variance) × (Time Since Last Visit)
```

**Swift Tabs reduces overwhelm by:**
1. **Reducing numerator**: Open fewer (link previews, batch processing)
2. **Reducing relevance variance**: Group by task/topic; hide off-topic (focus mode)
3. **Managing time factor**: Proactively suggest closing stale tabs; sleep unused tabs

---

### Current Pain Points (Without Solution)

1. **Navigation Friction**: Small tab targets, hard to see all tabs at once
2. **Close Friction**: Small X button, accidental closures
3. **Save Friction**: Multiple clicks to bookmark, organize into folders, or save content
4. **Reload Friction**: Must target small reload button in address bar
5. **Move Friction**: Drag-and-drop is imprecise, especially between windows
6. **No Quick Share**: Copying URL requires clicking address bar, selecting all, copying
7. **Reorder Friction**: Drag-and-drop requires precise mouse control and visible drop targets
8. **Hidden Actions**: Advanced actions (pin, mute, duplicate, save variants) buried in browser menus

---

### Desired Outcome

Tab management capabilities available instantly from gesture interface:
- **View**: See active tab info, adjacent tabs, and workspace overview
- **Navigate**: Flip through tabs and windows via scroll or keyboard
- **Find**: Search through open tabs to locate specific content
- **Act**: Perform any tab action (close, reload, save, move, reorder) with minimal gestures
- **Undo**: Recover from accidental closures immediately

Each capability should be one or two gestures maximum.

**Tab Overwhelm Prevention as Core Goal:**

The ultimate outcome is not just "manage many tabs" but **"maintain a focused workspace with only relevant tabs visible"**:

1. **Prevent Opening**: Link previews and batch processing replace "open everything, sort later"
2. **Filter Visibility**: [Focus mode](./need_task_management.md) and task-centric views show only what matters now
3. **Proactive Cleanup**: Batch operations and AI suggestions maintain hygiene before it becomes overwhelming
4. **Smart Persistence**: Save to task/brief without keeping tabs open; restore when needed

**Success Indicators:**
- Users open 30% fewer "exploratory" tabs (link previews replace speculative opening)
- Users with 20+ tabs use [focus mode](./need_task_management.md) daily to reduce visible set to <10
- 80% of hygiene suggestions ("close old tabs") are accepted
- Average active tab count decreases over time as users adopt save-to-task patterns

---

### Tab Menu Structure

The Tab Menu is the central hub for all tab actions, accessed by Meta key while Active Tab Info is showing. The menu is organized into two sections:

#### Section 1: Recent
Recently used actions, including nested submenu selections. Examples:
- "Save to Task: Project Alpha"
- "Move to Group: Research"
- "Save to Brief: Morning Brief"
- "Move to New Window"
- "Save as Entity"

Recent items allow quick repeat of common complex actions without navigating submenus.

#### Section 2: All Actions
All available actions organized by category:

**Basic Actions** (single tap/click):
| Action | Description |
|--------|-------------|
| **Pin/Unpin** | Toggle pinned state. Pinned tabs appear at top with title+icon, separated by divider |
| **Reload** | Refresh the page |
| **Duplicate** | Create a copy of the tab |
| **Copy** | Copy URL to clipboard |
| **Sleep** | Chrome's discard action — frees memory, tab stays in list, reloads on activate |
| **Find** | Open find-in-page for current tab |
| **Mute/Unmute** | Toggle audio. Speaker icon visible in Active Tab Info and Tab View |
| **Close** | Close current tab (with undo available) |

**Actions with Submenus** (tap to expand):
| Action | Submenu Items |
|--------|---------------|
| **Save** | **Save as**: Bookmark, File, Entity (person, org, product, service, concept — extracted by LLM) / **Save to**: Folder, Task (existing or new), Brief (morning, evening, weekly) |
| **Move** | New Window, Existing Window, Group/Workspace, Reading List, Bookmarks, Time (evening, tomorrow, this week, this month, this year — future feature) |
| **Close Variants** | Close Others, Close to the Right (with undo) |
| **Appearance** | Theme, Zoom, Reader Mode |
| **Assistance** | Summarize, Translate, Explain (LLM-powered — future feature) |

**Additional Actions** (contextual, future):
| Action | When Available |
|--------|----------------|
| **Chat** | Page has chat interface or AI assistant available |
| **Play** | Media controls for audio/video present |
| **Download** | Download page content |

---

### Quick Context Creation — Move to New Window

**In Navigation Mode (TabsView):**

The user can quickly establish a new task context by moving tabs:

- **Delete/Backspace**: Close the selected tab (with undo available)
- **Enter**: Move the selected tab to a new window

**Enter Key Logic:**
1. **First Enter press**: Creates a new browser window and moves the selected tab there
2. **Subsequent Enter presses**: Moves additional selected tabs to the *same* newly created window

This allows rapidly collecting tabs for a new task context without repeated window creation. The user stays in navigation mode throughout, selecting tabs and pressing Enter to batch-move them.

**Example Flow:**
```
User in navigation mode (TabsView showing current window tabs)
              │
    Scroll to select Tab A (for new context)
              │
    Press Enter → New Window created, Tab A moved
              │
    Scroll to select Tab B (also for new context)
              │
    Press Enter → Tab B moved to same new window
              │
    User can now horizontal scroll to switch to new window
```

**Outside Navigation Mode:**

- **Shift+Enter** while Active Tab Info is showing: Move current tab to new window (immediate, no dialog)

---

### Tab Reorder Gestures

**Alt + Scroll (in Navigation Mode):**

| Gesture | Action |
|---------|--------|
| **Alt + Scroll Up/Down** | Move selected tab earlier/later in current window's tab index |
| **Alt + Scroll Horizontal** | Move selected tab to different window |

**Visual Feedback:**
- Tab "lifts" visually during reorder
- Position indicator shows current index (e.g., "3 of 8")
- Edge bounce effect when at first/last position

**Multi-Select (Future):**
- **Another Modifier + Scroll Up/Down**: Select multiple tabs (vertical only, no horizontal)
- Allows batch operations on selected tabs

---

### Save Action Deep Dive

**Save as** (what format/type to save):
- **Bookmark** — Traditional browser bookmark with title and URL
- **File** — Download page content (HTML, PDF, or MHTML depending on settings)
- **Entity** — LLM extracts structured data (person, organization, product, service, concept) and saves as typed entity for knowledge base

**Save to** (destination container):
- **Folder** — Bookmark folder or file system folder
- **Task** — Existing task or create new task from this tab; links tab to task context
- **Brief** — *Future*: Add to morning brief, evening brief, or weekly brief. System opens all tabs in brief, extracts updates, and summarizes into single page

---

### Move Action Deep Dive

**Move to destinations:**
- **New Window** — Creates immediately, moves tab (no dialog)
- **Existing Window** — List of open windows; selecting moves tab there
- **Group/Workspace** — Tab groups treated as workspaces; can be open or closed. Moving to a closed workspace saves it there for later
- **Reading List** — Chrome's native reading list
- **Bookmarks** — Shortcut for Save → Bookmark
- **Time** — *Future*: Schedule tab to reopen (evening, tomorrow, this week, this month, this year)

**Note on Workspaces vs Windows:**
- Groups/workspaces are peer containers with windows
- Distinction: A workspace (tab group) may be closed; a window is always open
- Moving to a closed workspace saves the tab reference there; user can resume workspace later

---

### Success Metrics

1. View active tab info: Automatic on navigation, dismisses on scroll
2. View workspace overview: Single gesture (hold right-click)
3. Navigate tabs: Single scroll gesture or arrow key
4. Find tab: Type to search in omnibox, results in under 500ms
5. Close tab: Delete key, with undo available within 5 seconds
6. Move to new context: Enter key (first = create window, subsequent = move to same)
7. Move outside nav mode: Shift+Enter from Active Tab Info
8. Reload: Single click/tap from Tab Menu
9. Copy URL: Single click/tap from Tab Menu
10. Save/Move submenus: Maximum 2 taps to reach any destination
11. Reorder: Alt+scroll up/down for index, Alt+scroll horizontal for window
12. Tab Menu access: Meta key while Active Tab Info showing
13. Recent actions: Recently used nested actions appear in Recent section for single-tap repeat

---

### Related Features

- [Feature: Active Tab Information Display](../features/feature_active_tab_information.md) — View active tab context
- [Feature: Gesture-Based Tab Navigation](../features/feature_gesture_tab_navigation.md) — Navigate tabs and windows
- [Feature: Windows Overview](../features/feature_windows_overview.md) — View all windows and tab groups
- [Feature: Tab Menu (Actions)](../features/feature_tab_context_menu.md) — Complete tab action hub
- [Feature: Omnibox with Tab Search](../features/feature_omnibox.md) — Search and switch to tabs
- [Feature: Tab Reorder with Scroll](../features/feature_tab_reorder_scroll.md) — Reorganize tabs via gestures
- [Feature: Move to New Window](../features/feature_move_to_new_window.md) — Quick context creation

### Related Needs (Tab Overwhelm Prevention)

- [Information Summarization](./need_information_summarization.md) — Link previews, batch processing to open fewer tabs
- [Task Management](./need_task_management.md) — Focus mode, save-to-task for filtering visibility
- [Suggestions & Assistance](./need_suggestions_assistance.md) — Proactive hygiene suggestions, related content discovery

---

### Notes

**Scope Evolution:**
This need evolved from "Tab Lifecycle Management" (focused on actions like close/reload/save) to the broader "Tab Management" which encompasses:
- **View** (seeing tab info, workspace overview)
- **Navigate** (switching between tabs/containers)
- **Find** (searching for tabs)
- **Act** (lifecycle actions with intelligent save/move options)

All tab-related capabilities in Swift Tabs flow from this core need.

**Currently Implemented:**
- View: Active Tab Info, Windows Overview
- Navigate: Gesture-based navigation (tabs vertical, containers horizontal)
- Find: Omnibox basic (URL/search only, needs tab/bookmark/history search)
- Act: Copy URL, Reload, Delete to close (no undo yet), Enter to move to next existing window

**Planned:**
- Find: Full tab search in omnibox
- Act: Complete Tab Menu with Recent section, all Basic/Submenu/Additional actions, Save submenus (Entity, Task, Brief), Move submenus (New Window logic, Groups, Time), Close with undo, Pin/Unpin, Sleep, Find in page
- Reorder: Alt+scroll up/down for index within window, Alt+scroll horizontal for window move
- Multi-select: Modifier+scroll for batch operations (future)
