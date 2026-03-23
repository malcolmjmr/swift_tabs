## Feature: Window Merge & Move

**Status:** Planned  
**Priority:** Low  
**Addresses Need:** Window Management

---

### Description

Enable advanced window management operations from the expanded overview view: moving tabs between windows and merging entire windows together.

---

### Expanded View Activation

**Trigger:** Click expand button (↗) in overview widget footer

**Transition:**
```
Collapsed View                    Expanded View
┌─────────────────────┐          ┌─────────────────────────────────────┐
│ [Content]           │    →     │ ┌─────┐ ┌─────┐ ┌─────┐            │
│                     │          │ │Win 1│ │Win 2│ │Win 3│            │
│ [Footer with dots]  │          │ └─────┘ └─────┘ └─────┘            │
└─────────────────────┘          │                                     │
                                 │ ┌───────────────────────────────┐   │
                                 │ │ Window 1 Title                │   │
                                 │ │ [Active Tab]                  │   │
                                 │ │ (saved session name)          │   │
                                 │ ├───────────────────────────────┤   │
                                 │ │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐     │   │
                                 │ │ │A│ │B│ │C│ │D│ │E│ │F│     │   │
                                 │ │ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘     │   │
                                 │ │ (wrapped favicons)            │   │
                                 │ └───────────────────────────────┘   │
                                 │                                     │
                                 │ ┌───────────────────────────────┐   │
                                 │ │ Window 2 Title                │   │
                                 │ │ ...                           │   │
                                 │ └───────────────────────────────┘   │
                                 │                                     │
                                 │ [↑ Collapse]  [? Help]            │
                                 └─────────────────────────────────────┘
```

---

### Window Representation in Expanded View

**Each Window Card:**
```
┌─────────────────────────────────────────┐
│ [☆] Window Title           [× Close]  │  ← Header with star (save)
│ Saved Session Name (if applicable)    │
├─────────────────────────────────────────┤
│ [Active Tab Favicon] Active Tab Title │  ← Active tab highlighted
├─────────────────────────────────────────┤
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐      │
│ │A│ │B│ │C│ │D│ │E│ │F│ │G│ │H│      │  ← All tab favicons
│ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘      │    (wrapped)
│                                         │
│ [🗑️ Drop here to move]               │  ← Drop zone indicator
└─────────────────────────────────────────┘
```

**Hover Behavior:**
- Hovering tab favicon updates header to show that tab's title
- Helps identify tabs before selecting/moving

---

### Move Tabs Between Windows

**Drag & Drop Flow:**

```
1. User drags favicon from Window A
         │
         ▼
2. Drag ghost shows tab title
         │
         ▼
3. User hovers over Window B
   Window B highlights (drop target)
         │
         ▼
4. User releases
         │
         ▼
5. Tab disappears from Window A
   Tab appears in Window B
   (Animation: smooth fade/transition)
```

**Technical Implementation:**
- Uses HTML5 Drag and Drop API
- `dragstart` on favicon: store tab ID
- `dragover` on window card: preventDefault, highlight
- `drop` on window card: call `tabStore.moveTab(tabId, targetWindowId)`

**Alternative: Click-Based Move**
If drag & drop is problematic:
- Right-click tab → "Move to..." menu
- Shows list of open windows
- Click to complete move

---

### Merge Windows

**Definition:** Combine all tabs from Window A into Window B, then close Window A. Destination window retains its title/identity.

**Flow:**

```
User clicks "Merge" button on source window
              │
              ▼
    ┌─────────────────────┐
    │ Show window selector│
    │ (target selection)  │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Confirm merge?      │
    │ "Merge 'Window 1'   │
    │  into 'Window 2'?"  │
    │ All 12 tabs will    │
    │ move to Window 2    │
    └─────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
    ┌───────┐  ┌───────┐
    │ Cancel│  │ Merge │
    └───────┘  └───────┘
                   │
                   ▼
    ┌─────────────────────┐
    │ • Move all tabs     │
    │ • Close Window A    │
    │ • Animate transition│
    │ • Update view       │
    └─────────────────────┘
```

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| Source has pinned tabs | Preserve pinned state in destination |
| Destination closes during merge | Cancel operation, show error |
| Large number of tabs | Show progress, process in batches |
| Active tab in source | Make it active in destination |

---

### State Management

**Local State:**
- `isExpanded`: Boolean for view mode
- `draggingTabId`: Currently dragged tab
- `dropTargetWindowId`: Window being hovered

**Global Store:**
- `windows`: All windows with tabs
- `tabStore.moveTab()`: Move single tab
- `tabStore.mergeWindows()`: New method (merge source into target)

---

### Visual Feedback

**Drag States:**
- `dragstart`: Favicon scales up slightly, opacity reduces
- `dragover`: Window card gets border highlight, drop zone appears
- `drop`: Success animation (brief flash), tab moves visually

**Merge States:**
- Pre-merge: Source window gets "merging" overlay
- During merge: Progress indicator if many tabs
- Post-merge: Source window fades out, destination updates

---

### Code References (Planned)

- Expanded view: `WindowsView.svelte` extension or new component
- Drag & drop: Native HTML5 API in Svelte handlers
- Move logic: `tabStore.moveTab()` (exists)
- Merge logic: New `tabStore.mergeWindows(sourceId, targetId)`

---

### Dependencies

- Chrome Tabs API (move, remove)
- HTML5 Drag and Drop API
- Svelte transition animations

---

### Related Features

- [Overview Widget](./feature_overview_widget.md) - Parent feature, provides entry point
- [Gesture Tab Navigation](./feature_gesture_tab_navigation.md) - Alternative for single tab moves

---

### Future Enhancements

- **Reorder windows:** Drag window cards to reorder in the grid
- **Split window:** Select tabs in window, "Move to new window"
- **Undo merge:** Brief undo option after merge completes
- **Keyboard shortcuts:** Tab selection + key commands for power users
