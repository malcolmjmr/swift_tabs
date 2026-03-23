# Features Overview

## Swift Tabs Chrome Extension

This document catalogs the features that address the user needs. Each feature is a concrete capability that can be implemented, tested, and delivered.

**Vision:** See [Vision](../vision.md) and [Needs Overview](../needs/needs_overview.md) for product direction and need hierarchy.

---

## Features Catalog

### Core Tier (1-50)

| Feature ID | Feature Name | Addresses Need(s) | Status | Priority |
|------------|--------------|-------------------|--------|----------|
| 1 | Active Tab Information Display | Tab Context Awareness (Need 2), Tab Management (Need 3) | Implemented | High |
| 2 | Gesture-Based Tab Navigation | Efficient Tab Navigation (Need 1), Tab Management (Need 3) | Implemented | High |
| 3 | Windows Overview | Tab Context Awareness (Need 2), Tab Management (Need 3), Window and Group Management (Need 4) | Partially Implemented | High |
| 4 | New Window Creation | Window and Group Management (Need 4) | Implemented | Medium |
| 5 | Move to New Window | Window and Group Management (Need 4), Tab Management (Need 3) | Partially Implemented | Medium |
| 6 | Tab Menu (Actions) | Tab Management (Need 3), Task Management (Need 12) | Planned | High |
| 7 | Tab Close with Undo | Quick Recovery (Need 5), Tab Management (Need 3) | Planned | Medium |
| 8 | Tab Reorder with Scroll | Tab Management (Need 3) | Planned | Medium |
| 9 | Omnibox with Tab Search | Efficient Tab Navigation (Need 1), Tab Management (Need 3), Suggestions & Assistance (Need 13) | Partially Implemented | High |
| 10 | Find in Page | Find in Page (Need 10) | Planned | Medium |
| 11 | Container Actions Menu | Window and Group Management (Need 4), Tab Management (Need 3) | Planned | High |

### Enhancement Tier (100-150)

**AI-Required Features:**
| Feature ID | Feature Name | Addresses Need(s) | Status | Priority |
|------------|--------------|-------------------|--------|----------|
| 102 | Tab Summary Panel | Information Summarization (Need 11) | Planned | Medium |
| 104 | Brief Generator | Information Summarization (Need 11), Task Management (Need 12) | Planned | Medium |
| 107 | Omnibox Suggestions | Suggestions & Assistance (Need 13) | Planned | Medium |

**Non-AI Features (Enhanced by AI):**
| Feature ID | Feature Name | Addresses Need(s) | Status | Priority |
|------------|--------------|-------------------|--------|----------|
| 101 | Link Preview Overlay | Information Summarization (Need 11), Tab Management (Need 3) | Planned | Medium |
| 103 | SERP Link Selector | Information Summarization (Need 11), Tab Management (Need 3) | Planned | Medium |
| 105 | Task Inbox / Schedule View | Task Management (Need 12) | Planned | Medium |
| 106 | Focus Mode View Toggle | Task Management (Need 12), Tab Management (Need 3) | Planned | Medium |

---

## Feature Dependency Map

```
Core Foundation Features (Implemented)
├─ Active Tab Information Display [1]
│  └─ Tab Menu [6] (Meta or "a" key, with Recent section)
│
├─ Gesture-Based Tab Navigation [2]
│  ├─ Meta+Vertical: Navigate tabs in container
│  ├─ Meta+Horizontal: Navigate containers (windows/groups)
│  └─ Omnibox [9] (typing in nav mode, or "o" key)
│
└─ Windows Overview [3]
   ├─ Container list (windows + tab groups as peers)
   ├─ Header (tab/window counts)
   ├─ Footer with [+] Create, [⚙] Actions, [←] Close
   ├─ New Window Creation [4]
   ├─ Container Actions Menu [11]
   └─ Move to New Window [5]

Tab Management Features (Planned/In Progress)
├─ Tab Menu [6]
│  ├─ Recent Section (recently used actions)
│  ├─ Basic Actions (Pin, Reload, Duplicate, Copy, Sleep, Find, Mute, Close)
│  ├─ Save Submenu (Bookmark, File, Entity; to Folder, Task, Brief)
│  ├─ Move Submenu (New Window, Existing, Groups, Reading List, Bookmarks, Time)
│  ├─ Close Variants (Others, To Right)
│  ├─ Appearance (Theme, Zoom, Reader)
│  └─ Assistance (Summarize, Translate, Explain — future)
│
├─ Tab Close with Undo [7]
│  ├─ Delete key in nav mode (with undo)
│  ├─ Close from Tab Menu (with undo)
│  └─ Stack up to 5 recent closes
│
├─ Tab Reorder with Scroll [8]
│  ├─ Alt+Scroll Up/Down: Reorder within window
│  └─ Alt+Scroll Horizontal: Move to different window
│
└─ Move to New Window [5]
   ├─ In Nav Mode: Enter (first = create, subsequent = same window)
   └─ Outside Nav Mode: Shift+Enter from Active Tab Info

Window/Container Management Features
├─ Container Actions Menu [11]
│  ├─ Organization (Merge, Move, Save Session)
│  ├─ Tab States (Sleep All, Mute All, Pin All)
│  ├─ Close (Close Window variants, Close Others, Close All)
│  └─ Maintenance (Reload All, Sort, Close Duplicates)
│
└─ New Window Creation [4]
   ├─ New Normal Window
   ├─ New Incognito Window
   └─ New Saved Session

Extended Features
├─ Omnibox with Tab Search [9]
│  ├─ Tabbed sections: Tabs, Groups, Bookmarks, History
│  ├─ Horizontal scroll: Switch sections
│  ├─ Vertical scroll: Navigate items
│  ├─ Direct tab/group activation
│  ├─ URL/search input
│  └─ Suggestions [107] — Next steps within current task/activity
│
├─ Find in Page [10] ("/" key)
│
└─ Enhancement Tier (100-series)
   ├─ AI-Required Features
   │  ├─ Tab Summary Panel [102] — Floating overlay with Active Tab Info, abstract/ToC/highlights
   │  ├─ Brief Generator [104] — Morning/evening/weekly digests
   │  └─ Omnibox Suggestions [107] — Task/activity-aware next step suggestions
   │
   └─ Non-AI Features (Enhanced by AI)
      ├─ Link Preview Overlay [101] — Right-click or modifier+click, popup with title/meta; AI enhances with summary
      ├─ SERP Link Selector [103] — Affordances on SERP for batch link selection; AI enhances with comparative summary
      ├─ Task Inbox / Schedule View [105] — Opens in tab, shows tasks with deadlines; AI enhances with auto-categorization
      └─ Focus Mode View Toggle [106] — Filter to show/hide unfocused tabs; AI enhances with auto-suggest relevance
```

---

## Implementation Status

### Implemented Features
- **Active Tab Information Display**: Automatically appears on navigation; shows Meta symbol (⌘/⊞) as affordance; hides on scroll down.
- **Gesture-Based Tab Navigation**: Meta+Vertical Scroll navigates tabs; Meta+Horizontal Scroll navigates containers; Arrow keys work without modifiers; Enter to move to new window (needs update for batch context creation).
- **New Window Creation**: Creates empty window; accessible from Windows Overview footer [+] button.

### Partially Implemented
- **Windows Overview**: Basic structure with header (tab/window counts) and footer ([+] [⚙] [←] buttons); vertical scroll to select containers; Space/Enter to navigate; needs tab group integration, group row with Chrome colors, favicon hover titles.
- **Omnibox**: URL/search input; triggered by "o" key or typing in nav mode; needs tabbed sections (Tabs, Groups, Bookmarks, History), horizontal scroll for section switching, vertical scroll for item navigation.
- **Move to New Window**: Enter key moves to next existing window; needs update: Enter creates new window on first press, Shift+Enter outside nav mode.
- **Tab Menu**: Not implemented; needs "a" key shortcut, Meta key from Active Tab Info, Recent section, Basic Actions, and Submenus.

### Planned Features

**Core Features:**
- **Tab Menu [6]**: Complete action hub triggered by "a" key or Meta key from Active Tab Info; Recent section; Basic Actions (Pin, Reload, Duplicate, Copy, Sleep, Find, Mute, Close); Submenus with sections:
  - **Save**: Bookmark, File, Entity; to Folder, Task [12], Brief [11]
  - **Move**: New Window, Existing, Groups, Reading List, Bookmarks, Schedule [12]
  - **Close Variants**: Others, To Right
  - **Appearance**: Theme, Zoom, Reader
  - **Assistance**: Summarize [11], Translate, Explain (future)
- **Container Actions Menu [11]**: Container-level actions triggered by "w" key or [⚙] button in Overview footer; Organization (Merge, Save Session), Tab States (Sleep/Mute/Pin All), Close variants, Maintenance (Sort, Close Duplicates [6]); Focus Mode toggle [106]; no Recent section.
- **Tab Close with Undo [7]**: Delete/Backspace key closes with 5s undo; stack up to 5 recent closes; undo pill button UI.
- **Tab Reorder with Scroll [8]**: Alt+Scroll Up/Down to reorder within window; Alt+Scroll Horizontal to move between windows; position indicator and visual feedback.
- **Find in Page [10]**: "/" key to search within current page; "n"/"N" to navigate matches; Esc to close.

**Enhancement Features (100-series):**
- **Link Preview Overlay [101]**: Right-click or modifier+click on any link → small popup with summary; disappears on scroll or click in tab.
- **Tab Summary Panel [102]**: Floating overlay (with Active Tab Info) showing abstract, table of contents, highlights; triggered via Tab Menu > Summarize.
- **SERP Link Selector [103]**: Content script adds affordances on Google/DDG for batch link selection; queue view with comparative summary; query expansion suggestions.
- **Brief Generator [104]**: Morning/evening/weekly digests accessible via Meta+B or scheduled notification; content from saved tasks and flagged bookmarks.
- **Task Inbox / Schedule View [105]**: Opens in dedicated tab; shows tasks with linked tabs, priorities, deadlines; schedule view for "read later" items.
- **Focus Mode View Toggle [106]**: Filter in Tab Menu and Container Actions to show/hide unfocused tabs; unfocused tabs shown at reduced opacity by default; focused tabs remain active for 15min after interaction.
- **Omnibox Suggestions [107]**: Context-aware next-step suggestions within current task/activity displayed in omnibox dropdown.

---

## Detailed Documentation

For full details on each feature, see the individual feature documents:

### Core Tier 1 Features
- [feature_active_tab_information.md](./feature_active_tab_information.md) — Active tab context display
- [feature_gesture_tab_navigation.md](./feature_gesture_tab_navigation.md) — Scroll and keyboard navigation
- [feature_windows_overview.md](./feature_windows_overview.md) — Windows and tab groups overview

### Tab Management Features
- [feature_tab_context_menu.md](./feature_tab_context_menu.md) — Complete Tab Menu with actions
- [feature_tab_close_undo.md](./feature_tab_close_undo.md) — Close with undo system
- [feature_tab_reorder_scroll.md](./feature_tab_reorder_scroll.md) — Alt+scroll reorder and move
- [feature_move_to_new_window.md](./feature_move_to_new_window.md) — Enter/Shift+Enter move logic

### Window Management Features
- [feature_new_window_creation.md](./feature_new_window_creation.md) — New window creation
- [feature_container_actions.md](./feature_container_actions.md) — Container-level actions (merge, save session, close all, etc.)

### Supporting Features
- [feature_omnibox.md](./feature_omnibox.md) — Unified search interface with tabbed sections and suggestions
- [feature_find_in_page.md](./feature_find_in_page.md) — In-page search

### Enhancement Features (AI-Powered)
- [feature_link_preview.md](./feature_link_preview.md) — Link hover/modifier preview overlay
- [feature_tab_summary_panel.md](./feature_tab_summary_panel.md) — Tab content abstract/ToC/highlights
- [feature_serp_link_selector.md](./feature_serp_link_selector.md) — Batch link selection on SERP
- [feature_brief_generator.md](./feature_brief_generator.md) — Curated morning/evening/weekly digests
- [feature_task_inbox.md](./feature_task_inbox.md) — Task and schedule view
- [feature_focus_mode.md](./feature_focus_mode.md) — Focused/unfocused tab view toggle
- [feature_omnibox_suggestions.md](./feature_omnibox_suggestions.md) — Context-aware next-step suggestions
