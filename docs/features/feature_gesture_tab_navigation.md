## Feature: Gesture-Based Tab Navigation

**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Efficient Tab Navigation

---

### Description

Enable users to navigate through open tabs using vertical scroll gestures while holding right-click. This provides rapid, eyes-free tab switching with immediate visual feedback showing the selected tab and its neighbors.

---

### Trigger & Activation

1. **Enter Navigation Mode:**
   - User performs short right-click
   - System enters `isInNavigationMode = true`
   - Tab information display appears

2. **Navigation Gestures:**
   - While holding right-click, user scrolls wheel up/down
   - Each scroll tick moves selection to next/previous tab
   - Browser immediately switches to selected tab

3. **Exit Navigation Mode:**
   - User releases right-click
   - Modal dismisses after short delay (1.5s)
   - `isInNavigationMode = false`

---

### Scroll Behavior

| Gesture | Action | Visual Feedback |
|---------|--------|-----------------|
| Scroll up | Select previous tab | Active tab moves up in display |
| Scroll down | Select next tab | Active tab moves down in display |
| Hold scroll | Continuous navigation | Throttled to prevent rapid jumps |
| Release | Keep current tab | Modal fades, normal browsing resumes |

**Technical Details:**
- Throttle: 100ms between scroll events to prevent accidental skips
- Wrap-around: Optional (not implemented currently)
- Auto-activation: Tab switches immediately on selection (not just on release)

---

### Visual Feedback

**During Navigation:**
```
┌─────────────────────────────┐
│     Previous Tab Preview    │  ← Fades as it moves further
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   CURRENT TAB         │  │  ← Highlighted, full size
│  │   (Switched to this)  │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│     Next Tab Preview        │  ← Visible for context
└─────────────────────────────┘
```

**Display Modes:**
- Gallery: Card view with tab thumbnails
- List: Vertical list with favicons and titles
- Icon: Grid of favicons only

---

### State Management

**Local State (App.svelte):**
- `isInNavigationMode`: Boolean for mode state
- `isInTabSwitchingMode`: Boolean for modal visibility
- `tabSwitchingDismissTimeout`: Timer reference for auto-dismiss

**Local State (Toolbar.svelte):**
- `selectedTabIndex`: Currently selected tab in list
- `activeTabIndex`: Actual active tab index (synced with Chrome)

**Global Store (read-only):**
- `currentWindowTabs`: List of tabs to navigate
- `activeTabId`: Currently active tab ID

---

### Code References

- Mode management: `App.svelte` lines 200-350
- Scroll handler: `App.svelte` `handleWheel()` function
- Tab display: `Toolbar.svelte`, `TabSwitchingModal.svelte`
- Tab switching: `tabStore.activateTab(tabId)`

---

### Performance Considerations

1. **Immediate Response:** Tab activation should happen within 50ms of scroll
2. **Visual Feedback:** Display update should be 60fps smooth
3. **No Jank:** Preload tab thumbnails where possible
4. **Memory:** Clear references to closed tabs immediately

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Single tab | Show "Only 1 tab" indicator, disable scroll |
| Tab closed during navigation | Refresh state, adjust index if needed |
| Window loses focus | Dismiss modal, exit navigation mode |
| Rapid scroll events | Throttle to prevent skipping tabs |
| Tab at boundary | Stop at first/last tab (no wrap) |

---

### Related Interactions

- Works with [Active Tab Information Display](./feature_active_tab_information.md) as the resting state
- Precedes [Tab Close with Undo](./feature_tab_close_undo.md) as an alternative to closing
