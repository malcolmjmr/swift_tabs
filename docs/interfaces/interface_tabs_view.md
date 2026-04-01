## Interface: Tabs View

**Associated Screen:** Navigation Mode (content script overlay); optional **Toolbar** (no edge slides)  
**Supports Interaction:** [Navigation Mode](../interactions/interaction_navigation_mode.md)  
**Addresses Need:** [Window and Group Management](../needs/need_window_management.md)

---

### Layout Structure

Fixed **card** at **bottom-right** of the viewport (navigation) or embedded in toolbar, aligned with Active Tab Information and Tab Menu styling (`--st-bg-primary`, `--st-border-color`, `8px` radius, shadow).

**Quick actions row** (navigation mode, **window** slide only, not in **Overview**)

- **Save / share** (<kbd>S</kbd>), **Focus** (<kbd>F</kbd>), **Close** (<kbd>x</kbd>), **Menu** (<kbd>M</kbd>).
- Dispatches events to `App.svelte` (copy URL, `focusWindow`, `closeTab`, open tab menu).

**View picker** (revealed by **wheel up** while the tab list is scrolled to the **top** — overscroll threshold)

- Horizontal row of chips: **List**, **Icons**, **Gallery**, **Overview**, **Done**.
- Sets `viewMode` (`list` | `icon` | `gallery` | `overview`).

**Main region**

- **Navigation + `includeEdgeSlides`:** horizontal **scroll-snap** track:
  - **History** slide (left): [HistoryView](../../src/components/tabs_view/HistoryView.svelte) — recently closed, open tab groups, bookmark session folders.
  - **Window** slides × N: tab list for that window per `viewMode` (except Overview).
  - **Create** slide (right): placeholder; **Space** opens a new empty window.
- **Overview** `viewMode`: single **vertical** scroll — all windows, each row **IconView** (wrapped favicons); focused window ring; **←**/**→** / horizontal wheel move focus between windows.
- **Toolbar** (`includeEdgeSlides={false}`): legacy track — **only** window slides (no History/Create).

**Bottom — window dots** (only if **more than one** open window **and** not in Overview)

- One dot per window; maps to window slides (skips History/Create when edges enabled).
- No dot highlighted on History or Create slides.

Inner slide area: `max-height` ~ `min(50vh, 420px)` with **vertical** scrolling for long tab lists.

---

### Component Hierarchy

- `TabsView` (card)
  - **Quick actions** (conditional)
  - **View picker** (conditional)
  - **Overview** column **or** **Track** (horizontal scroll)
    - **History** slide → `HistoryView`
    - **Slide** × N windows → `ListView` | `IconView` | `GalleryView`
    - **Create** slide → placeholder
  - **Dots** (conditional)

---

### State Bindings

| Prop / binding | Owner | Purpose |
|----------------|-------|---------|
| `windows` | Parent | Raw Chrome windows from store |
| `includeEdgeSlides` | Parent | `true` = History + windows + Create (navigation); `false` = windows only (toolbar) |
| `currentTab` | Two-way | Browser’s current tab context |
| `selectedTab` | Two-way | Highlighted tab; **Space** activates (window / overview slides) |
| `slideIndex` | Two-way (`navSlideIndex` in `App.svelte`) | With edges: `0` history, `1..N` windows, `N+1` create; without edges: `0..N-1` windows |
| `viewMode` | Two-way (`navViewMode` in `App.svelte`) | `list` \| `icon` \| `gallery` \| `overview` |
| `overviewFocusedWindowIndex` | Two-way | Which window row is focused in Overview |

`TabsView` exposes `getNavSlideKind()`, `historyMoveSelection(delta)`, `historyActivateSelection()` for `App.svelte` keyboard handling.

---

### Code References

- [TabsView.svelte](../../src/components/tabs_view/TabsView.svelte) — card, edges, overview, picker, quick actions
- [HistoryView.svelte](../../src/components/tabs_view/HistoryView.svelte) — sessions, groups, saved folders
- [ListView.svelte](../../src/components/tabs_view/ListView.svelte), [IconView.svelte](../../src/components/tabs_view/IconView.svelte), [GalleryView.svelte](../../src/components/tabs_view/GalleryView.svelte)
- [App.svelte](../../src/App.svelte) — `navSlideIndex`, `navViewMode`, wheel, arrows, **Space**, omnibox guard

---

### TODO (Pending)

1. **Window/Container Header** — Add a header for each window slide that displays:
   - Either the tab group name (if tabs are grouped) or the number of tabs in the window
   - On the right side: an Option key symbol (⌥) that opens a window/container menu

2. **Smooth Horizontal Scroll Animation** — Replace the current scroll-snap behavior for window switching with a smooth animated transition between slides rather than snapping directly to the next window.
