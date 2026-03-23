## Need: Ergonomic Input Primacy

**Status:** Partially Implemented  
**Priority:** Critical

---

### Jobs to Be Done

When I interact with browser controls, I want to use **scroll gestures and keyboard as primary inputs** so that I can **keep the mouse for page content and reduce wrist movement, finger contortion, and long cursor travel across the screen**.

#### Key JTBD Statements:

1. **Main JTBD**: When I need to switch tabs or perform a browser action, I want to use a scroll gesture or a single keyboard key, so I don't have to move my mouse to the tab bar and make a precise click.

2. **Secondary JTBD**: When I'm interacting with content (clicking links, selecting text, using app UI), I want my mouse to stay in the content area, so I'm not constantly moving between content and browser chrome.

3. **Tertiary JTBD**: When I use keyboard shortcuts, I want them to be single-key actions within modes, so I'm not contorting my fingers to hold Cmd+Shift+Alt+Something.

---

### Current Pain Points (Without Solution)

1. **Mouse Dependency**: Tab bar and toolbar require precise mouse targeting
2. **Long Cursor Travel**: Moving from content area to top of screen for tabs is ergonomically costly
3. **Chorded Shortcuts**: Many apps use multi-key shortcuts that strain hands
4. **Context Switching**: Reaching for the mouse breaks typing flow

---

### Desired Outcome

**Input Hierarchy:**

1. **Scroll gestures** — Primary for navigation and menu traversal:
   - Vertical scroll: Navigate tabs
   - Horizontal scroll: Navigate windows
   - Scroll within menus: Navigate sections and lists

2. **Keyboard** — Primary for triggering modes, menus, and text input:
   - `Space`: Enter navigation mode
   - `/`: Enter find-in-page mode
   - Typing in navigation mode: Open omnibox for tab/action search
   - Single-key actions within menus (no chorded shortcuts)

3. **Mouse** — Optional for browser controls; primary use remains page content interaction

**Key Principles:**
- Few entry points: Easy-to-remember triggers (`Space`, `/`)
- Single-key actions: Within each mode, actions use one key (no Cmd+Shift+Key contortions)
- On-screen affordances: Valid keys shown contextually—no memorization required
- No chorded shortcuts as the primary interaction model for core features
- All browser management possible without moving mouse to screen edges

---

### Success Metrics

1. Tab/Window navigation: Primary via scroll; keyboard arrows as alternative
2. Mode entry: Single key (`Space` for nav, `/` for find)
3. Menu navigation: Primary via scroll; single-key shortcuts within menus
4. Omnibox/search: Triggered by typing in nav mode; searchable with keyboard
5. No chorded shortcuts required for primary workflows
6. On-screen affordances visible whenever a mode is active
7. Mouse use for browser controls: optional, not default path

---

### Related Features

- Feature: Gesture-Based Tab Navigation (scroll primary)
- Feature: Find in Page (`/` entry point, keyboard navigation)
- Feature: Omnibox (typing to search tabs and actions)
- Feature: Quick Tab Actions
- Feature: Tab Reorder with Scroll

---

### Notes

This need is the **second value proposition** of Swift Tabs (see [Vision](../vision.md)). Ergonomics is not about "keyboard vs. mouse"—it's about reducing the physical cost of browser interaction so the user can reserve effort for the actual work.

**Input Model Clarification:**

- **Scroll** excels at linear navigation (tabs, windows, menu sections). It provides immediate, tactile feedback and works from any mouse position.
- **Keyboard** excels at triggering modes and text input. It's not a parallel navigation path to scrolling—it's complementary. Use `Space` to enter nav mode, then scroll. Use `/` for find, then type and navigate matches.

This "few entry points, single-key actions" approach replaces the traditional model of chorded shortcuts (Cmd+Shift+Key). Users see available keys on screen, so no memorization is required.

Both scroll and keyboard follow the same philosophy: minimal effort, immediate feedback, no complex combinations to remember.
