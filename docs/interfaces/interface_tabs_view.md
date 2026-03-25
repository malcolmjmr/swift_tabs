## Interface: Tabs View

**Associated Screen:** Navigation Mode (content script overlay)  
**Supports Interaction:** [Navigation Mode](../interactions/interaction_navigation_mode.md)  
**Addresses Need:** [Window and Group Management](../needs/need_window_management.md) (windows-only carousel; tab groups future)

---

### Layout Structure

Fixed **card** at **bottom-right** of the viewport, aligned with Active Tab Information and Tab Menu styling (`--st-bg-primary`, `--st-border-color`, `8px` radius, shadow).

**Top section — tab list region**

- Horizontal **scroll-snap** track: each **slide** is exactly the width of the visible area (`100%` of the track).
- Only **one window’s tabs** appear at a time; other windows’ lists are off-screen until the user changes the carousel (scroll, dots, or **←** / **→** in Navigation Mode).
- Inner area: `max-height` ~ `min(50vh, 420px)` with **vertical** scrolling for long tab lists.

**Bottom section — window dots** (only if **more than one** open window)

- Row of dots **directly below** the tab list, separated by a light top border.
- One dot per window (same order as sorted open windows: non-empty, sorted by `window.id`).
- Active dot indicates which window’s tabs are shown; dots are clickable to jump to that window.

---

### Component Hierarchy

- `TabsView` (card)
  - **Track** (horizontal scroll container)
    - **Slide** × N (one per open window)
      - `ListView` | `IconView` | `GalleryView` (per `viewType`)
  - **Dots** (`role="tablist"`; each dot `role="tab"`, `aria-selected`)

---

### Component Specs

| Element | Behavior |
|---------|----------|
| Slide | Full-width page; scroll-snap align start |
| List / icon / gallery | Same as before per `viewType`; receives sorted tabs for that window |
| Dots | Navigate carousel; styled muted vs active using design tokens |

---

### State Bindings

| Prop / binding | Owner | Purpose |
|----------------|-------|---------|
| `windows` | Parent (`App`, `Toolbar`) | Raw Chrome windows from store |
| `currentTab` | Two-way | Browser’s current tab context |
| `selectedTab` | Two-way | Highlighted tab in overlay; **Space** activates |
| `carouselIndex` | Two-way (`navCarouselIndex` in `App.svelte`) | Index into sorted open windows |
| `viewType` | Parent | `"list"` \| `"icon"` \| `"gallery"` |

When `carouselIndex` changes, TabsView ensures `selectedTab` belongs to that window (defaults to active tab in that window if the prior selection was another window).

---

### Code References

- [TabsView.svelte](../../src/components/tabs_view/TabsView.svelte) — card, track, slides, dots, scroll sync
- [ListView.svelte](../../src/components/tabs_view/ListView.svelte) — list styling inside each slide
- [App.svelte](../../src/App.svelte) — `navCarouselIndex`, wheel handlers, Navigation Mode arrow keys
