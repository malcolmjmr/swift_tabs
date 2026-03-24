# Interfaces Overview

## Swift Tabs Chrome Extension

This document catalogs all UI interfaces (screens, components, and visual elements). Each interface document defines the layout structure, component specifications, and state bindings.

**Related Documentation:**
- [Needs Overview](../needs/needs_overview.md) - User needs these interfaces address
- [Features Overview](../features/features_overview.md) - Features using these interfaces
- [Interactions Overview](../interactions/interactions_overview.md) - User flows these interfaces support

---

## Interface Catalog

### Core Interfaces (Implemented/Planned)

| Interface ID | Interface Name | Associated Screen | Status | Priority |
|--------------|----------------|-------------------|--------|----------|
| 1 | Active Tab Information | Overlay (any page) | In Progress | High |
| 2 | Tab Switching Modal | Overlay (any page) | In Progress | High |
| 3 | Tab Menu | Overlay (from Active Tab Info) | Planned | High |
| 4 | Tabs View | Navigation Mode | In Progress | High |
| 5 | Windows Overview | Navigation Mode | Planned | Medium |
| 6 | Omnibox | Navigation Mode | Planned | Medium |
| 7 | Find in Page Bar | Bottom overlay | Planned | Medium |
| 8 | Container Actions Menu | Navigation Mode | Planned | Medium |

### Component Interfaces

| Interface ID | Interface Name | Parent Interface | Status |
|--------------|----------------|------------------|--------|
| 101 | Tab List Item | Tabs View | In Progress |
| 102 | Window Card | Windows Overview | Planned |
| 103 | Menu Action Button | Tab Menu | Planned |
| 104 | Recent Actions Section | Tab Menu | Planned |
| 105 | Search Input | Omnibox | Planned |

---

## Implementation Priority

### Phase 1: Foundation (Current Sprint)
1. **Active Tab Information** - Info overlay with favicon, title, URL
2. **Tab Switching Modal** - Simple overlay showing selected tab
3. **Tabs View** - List/icon/gallery views of current window tabs

### Phase 2: Navigation & Overview (Next Sprint)
4. **Tab Menu** - Action buttons and submenus
5. **Windows Overview** - Multi-window display
6. **Omnibox** - Search input and results

### Phase 3: Power Features (Future)
7. **Find in Page Bar** - Search within page
8. **Container Actions Menu** - Window-level operations

---

## Interface Structure

Each interface document follows this format:

```
## Interface: [Name]
**Associated Screen:** [Screen/Mode name]
**Supports Interaction:** [Interaction name]

### Layout Structure
Diagram or ASCII representation of layout

### Component Hierarchy
Tree structure of components

### Component Specs
Purpose, structure, and style for each component (prose descriptions only—no code)

### State Bindings
Table mapping component props to stores

### Animation Specifications
Descriptions of timing and effect (no code—e.g., "150ms fade-in, ease-out")
```

---

## Layout Principles

### 1. Overlay-Based Design
All interfaces appear as overlays on top of web content:
- Position: `fixed` to viewport
- Z-index: 999999 (above most content)
- Background: Semi-transparent or blurred backdrop (for modals)
- Pointer events: Controlled to allow/prevent content interaction

### 2. Positioning Strategy

| Interface | Default Position | Rationale |
|-----------|------------------|-----------|
| Active Tab Info | Bottom-right | Doesn't block content, natural eye flow |
| Tab Switching Modal | Center | Attention-grabbing, symmetrical |
| Tabs View | Bottom-right | Consistent with Active Tab Info |
| Tab Menu | Near trigger point | Contextual, reduces mouse travel |
| Omnibox | Top-center | Familiar search bar position |
| Find in Page | Bottom-left | Doesn't block main content |

### 3. Responsive Considerations
- Minimum width: 280px (mobile-friendly)
- Maximum width: 600px (readable line length)
- Height: Content-adaptive with max-height and scroll
- Safe margins: 10-20px from viewport edges

---

## Detailed Documentation

### Core Interfaces
- [interface_active_tab_info.md](./interface_active_tab_info.md) - Active tab information overlay
- [interface_tab_switching_modal.md](./interface_tab_switching_modal.md) - Tab switching indicator
- [interface_tab_menu.md](./interface_tab_menu.md) - Tab actions menu
- [interface_tabs_view.md](./interface_tabs_view.md) - Navigation mode tab list
- [interface_windows_overview.md](./interface_windows_overview.md) - Windows and groups view
- [interface_omnibox.md](./interface_omnibox.md) - Search interface
- [interface_find_in_page.md](./interface_find_in_page.md) - In-page search bar
- [interface_container_actions.md](./interface_container_actions.md) - Container actions menu

### Component Interfaces
- [interface_tab_list_item.md](./interface_tab_list_item.md) - Individual tab display
- [interface_window_card.md](./interface_window_card.md) - Window/group card
- [interface_menu_action_button.md](./interface_menu_action_button.md) - Menu item component
- [interface_recent_actions.md](./interface_recent_actions.md) - Recent actions section
- [interface_search_input.md](./interface_search_input.md) - Search field component

---

## Styling Standards

### Color Palette

| Token | Value | Use |
|-------|-------|-----|
| `--st-bg-primary` | rgba(30, 30, 30, 0.95) | Main surfaces |
| `--st-bg-secondary` | rgba(50, 50, 50, 0.9) | Secondary surfaces |
| `--st-bg-hover` | rgba(70, 70, 70, 0.9) | Hover states |
| `--st-bg-active` | rgba(0, 123, 255, 0.3) | Selected/highlight background |
| `--st-text-primary` | #ffffff | Primary text |
| `--st-text-secondary` | #b0b0b0 | Secondary text |
| `--st-text-muted` | #808080 | Hints, labels |
| `--st-accent-primary` | #007bff | Primary accent |
| `--st-accent-success` | #28a745 | Success state |
| `--st-accent-warning` | #ffc107 | Warning state |
| `--st-accent-danger` | #dc3545 | Danger state |
| `--st-border-color` | rgba(255, 255, 255, 0.1) | Default borders |
| `--st-border-active` | #007bff | Active/selected border |

### Typography
- Font family: System UI stack (`-apple-system, BlinkMacSystemFont, ...`)
- Base size: 14px
- Tab title: 14px, weight 500
- URL: 12px, weight 400, secondary color
- Action hints: 12px, uppercase, muted color

### Spacing Scale
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

---

## Notes

- Interfaces are designed to be minimal and non-intrusive
- All animations should feel fast (< 200ms) and purposeful
- Focus states must be visible for keyboard navigation
- Touch targets minimum 44x44px for accessibility
