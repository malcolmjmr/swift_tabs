# Features Overview

## Swift Tabs Chrome Extension

This document catalogs the features that address the user needs. Each feature is a concrete capability that can be implemented, tested, and delivered.

---

## Features Catalog

| Feature ID | Feature Name | Addresses Need(s) | Status | Priority |
|------------|--------------|-------------------|--------|----------|
| 1 | Active Tab Information Display | Tab Context Awareness (Need 2) | Implemented | High |
| 2 | Gesture-Based Tab Navigation | Efficient Tab Navigation (Need 1) | Implemented | High |
| 3 | Quick Tab Actions | Tab Lifecycle Management (Need 3) | Partially Implemented | High |
| 4 | Tab Close with Undo | Quick Recovery (Need 4) | Planned | Medium |
| 5 | Overview Widget | Tab Context Awareness, Window Management (Needs 2, 5) | Implemented | High |
| 6 | New Window Creation | Window Management (Need 5) | Implemented | Medium |
| 7 | Omnibox with Tab Search | Efficient Tab Navigation, Content Discovery (Needs 1, 6) | Partially Implemented | High |
| 8 | Tab Context Menu | Tab Lifecycle Management (Need 3) | Planned | High |
| 9 | Move to New Window | Window Management, Tab Lifecycle Management (Needs 3, 5) | Partially Implemented | Medium |
| 10 | Find in Page | Content Discovery (Need 6) | Planned | Medium |
| 11 | Tab Reorder with Scroll | Tab Lifecycle Management (Need 3) | Planned | Medium |

---

## Feature Dependency Map

```
Core Foundation Features (Implemented)
├─ Active Tab Information Display [1]
│  └─ Quick Tab Actions [3] (share, reload)
│
├─ Gesture-Based Tab Navigation [2]
│  ├─ Tab Close with Undo [4] (gesture action)
│  └─ Omnibox [7] (opens from nav mode)
│
└─ Overview Widget [5]
   └─ New Window Creation [6]

Extended Features (In Progress/Planned)
├─ Omnibox with Tab Search [7]
│  ├─ Tab title/URL search
│  ├─ Bookmark search
│  └─ History search
│
├─ Tab Context Menu [8]
│  ├─ Consolidates Quick Actions [3]
│  ├─ Move to New Window [9]
│  ├─ Pin/Unpin
│  ├─ Mute/Unmute
│  └─ Close variants (other, to right)
│
└─ Navigation Enhancements
   ├─ Move to New Window [9] (Shift+Enter)
   ├─ Find in Page [10] (/ key)
   └─ Tab Reorder with Scroll [11] (Alt+scroll)
```

---

## Implementation Status

### Implemented Features
- **Active Tab Information Display**: Short right-click shows active tab with favicon, title, quick actions, and adjacent tabs
- **Gesture-Based Tab Navigation**: Wheel scroll in gesture mode to navigate tabs with immediate switch and visual feedback
- **Overview Widget**: Long-press right-click for comprehensive window/tab view with navigation
- **New Window Creation**: Create empty windows from overview widget

### Partially Implemented
- **Quick Tab Actions**: Share (copy URL) and reload implemented; save action needs simplification
- **Omnibox**: Basic URL/search input working; needs tab/bookmark search integration
- **Move to New Window**: Enter key moves to existing windows; needs Shift+Enter for new window creation

### Planned Features
- **Tab Close with Undo**: Swipe-left gesture to close with temporary undo button
- **Tab Context Menu**: Right-click menu with all tab actions (pin, mute, duplicate, close variants)
- **Find in Page**: `/` key to search within current page
- **Tab Reorder with Scroll**: Alt+horizontal scroll to reorder tabs in navigation mode

---

## Detailed Documentation

For full details on each feature, see the individual feature documents:

- [feature_active_tab_information.md](./feature_active_tab_information.md)
- [feature_gesture_tab_navigation.md](./feature_gesture_tab_navigation.md)
- [feature_quick_tab_actions.md](./feature_quick_tab_actions.md)
- [feature_tab_close_undo.md](./feature_tab_close_undo.md)
- [feature_overview_widget.md](./feature_overview_widget.md)
- [feature_new_window_creation.md](./feature_new_window_creation.md)
- [feature_omnibox.md](./feature_omnibox.md)
- [feature_tab_context_menu.md](./feature_tab_context_menu.md)
- [feature_move_to_new_window.md](./feature_move_to_new_window.md)
- [feature_find_in_page.md](./feature_find_in_page.md)
- [feature_tab_reorder_scroll.md](./feature_tab_reorder_scroll.md)
