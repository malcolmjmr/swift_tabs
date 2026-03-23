## Feature: Gesture-Based Tab Navigation

**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Efficient Tab Navigation

---

### Description

Enable users to navigate through open tabs and windows using **Meta-Scroll** gestures. Vertical scroll while holding the Meta key switches between tabs in the current window, and horizontal scroll switches between browser windows. Arrow keys provide the same functionality without requiring the Meta key.

---

### Trigger & Activation

1. **Meta-Scroll Navigation:**
   - **Vertical Scroll + Meta:** While holding the **Meta key** (⌘/⊞), scroll vertically to switch between tabs in the current window.
   - **Horizontal Scroll + Meta:** While holding the **Meta key**, scroll horizontally to switch between open browser windows.

2. **Keyboard Navigation:**
   - **Arrow Keys:** Use **Up/Down** arrows to switch tabs and **Left/Right** arrows to switch windows (no modifier key required if not in a text input).

3. **Immediate Feedback:**
   - The browser immediately switches to the selected tab or window.
   - The Active Tab Information Display or Windows Overview updates to show the new context.

---

### Navigation Behavior

| Input | Action | Feedback |
|-------|--------|----------|
| **Meta + Scroll Up/Down** | Switch Tab | Immediate switch to prev/next tab |
| **Meta + Scroll Left/Right** | Switch Window | Immediate switch to prev/next window |
| **Up/Down Arrow** | Switch Tab | Same as Meta-Scroll |
| **Left/Right Arrow** | Switch Window | Same as Meta-Scroll |

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
