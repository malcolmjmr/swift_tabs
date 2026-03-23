## Feature: Windows Overview

**Status:** Partially Implemented  
**Priority:** High  
**Addresses Needs:** Tab Context Awareness (Need 2), Window and Group Management (Need 4)

---

### Description

A comprehensive workspace visualization showing all open browser windows and tab groups as peer containers. Activated during navigation mode to provide a "bird's-eye view" of the entire browser session. Both windows and tab groups appear in the same vertical list with identical navigation patterns.

---

### Trigger

- **Activation:** Accessible from the navigation flow (Meta+Scroll or Arrow keys).
- **Navigation Mode:** When the user is navigating and wants to see more than the current container's context.

---

### Layout Structure

The Overview is organized into three areas: Header, Content, and Footer.

```
┌─────────────────────────────────────────────────────────────────┐
│  Swift Tabs                    12 tabs  |  3 containers        │  ← Header
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Current Tab Title (Window 1)                           │   │
│  │    [○][○][○][○][○][○][○][○][○][○][○][○]                 │   │  ← Selected
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Work Tasks              │██████│                       │   │
│  │    [○][○][○][○][○][○][○][○]                             │   │  ← Group
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Current Tab Title (Window 3)                         │   │
│  │    [○][○][○]                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [+]  [⚙]  [←]                                                  │  ← Footer
└─────────────────────────────────────────────────────────────────┘
```

---

### Header

The header provides context about the current workspace state:

| Element | Description |
|---------|-------------|
| **App Name** | "Swift Tabs" (left-aligned) |
| **Tab Count** | Total tabs across all containers (e.g., "12 tabs") |
| **Container Count** | Total containers — windows + groups (e.g., "3 containers") |

**Visual:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Swift Tabs                    12 tabs  |  3 containers        │
└─────────────────────────────────────────────────────────────────┘
   ↑ left                              ↑ right-aligned stats
```

---

### Content Area — Container Cards

Containers are displayed as a **vertically scrollable list**. Each card represents one window or tab group.

**Navigation Model:**
- **Vertical Scroll:** Navigate up/down through containers (scroll to select)
- **Space or Enter:** Navigate to the active tab in the selected container
- **Visual Indicator:** Selected container has highlighted border/background

**For Windows:**
```
┌─────────────────────────────────────────┐
│  ○ Current Tab Title                    │  ← Title area with selection indicator
│    example.com/page                     │
├─────────────────────────────────────────┤
│  [○][○][○][○][○][○][○][○][○][○][○][○] │  ← Wrapped favicons
│  [○][○][○][○]                           │    (hover shows tab title tooltip)
└─────────────────────────────────────────┘
```

**For Tab Groups:**
```
┌─────────────────────────────────────────┐
│  ○ Current Tab Title                    │  ← Title area
│    example.com/page                     │
├─────────────────────────────────────────┤
│  Work Tasks              │██████│        │  ← Group name + colored bar
├─────────────────────────────────────────┤
│  [○][○][○][○][○][○][○][○]               │  ← Group's tabs only
└─────────────────────────────────────────┘
```

**Card Elements:**
- **Selection indicator (○/●):** Left side shows selection state (○ = selected, ● = not selected, or highlight style)
- **Title area:** Shows the container's current tab title by default; updates to show hovered tab's title
- **Group row** (tab groups only): Displays the group name and a colored bar matching the group's Chrome color
- **Favicon grid:** All tabs in the container shown as favicons (wrapped); hovering displays the tab's full title

---

### Footer

The footer provides action buttons for workspace management:

```
┌─────────────────────────────────────────────────────────────────┐
│  [+]         [⚙]              [←]                                 │
│  create    actions menu    close/back                          │
└─────────────────────────────────────────────────────────────────┘
```

| Button | Icon | Function |
|--------|------|----------|
| **Create** | `[+]` | Opens Create Menu (New Window, Incognito, etc.) — see [New Window Creation](./feature_new_window_creation.md) |
| **Actions** | `[⚙]` or `[⋯]` | Opens [Container Actions Menu](./feature_container_actions.md) for the selected container |
| **Close/Back** | `[←]` or `[×]` | Closes the Overview, returns to browsing |

---

### Interaction Flow

**Opening and Navigating:**
```
User enters navigation mode (Space key or Active Tab Info showing)
              │
              ▼
    ┌─────────────────────┐
    │ Windows Overview    │
    │ appears             │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ User can:           │
    │ • Vertical scroll   │
    │   to select a       │
    │   container         │
    │ • Click container   │
    │   to select         │
    │ • Click [+] for     │
    │   Create menu       │
    │ • Click [⚙] for     │
    │   Actions menu      │
    │ • Click [←] to      │
    │   close             │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Press Space or      │
    │ Enter on selected   │
    │ container           │
    │                     │
    │ → Switch to that    │
    │   container's       │
    │   active tab        │
    └─────────────────────┘
```

**Navigation Behaviors:**

| Input | Action |
|-------|--------|
| **Vertical Scroll** | Navigate up/down through containers (scroll-to-select pattern) |
| **Space or Enter** | Navigate to active tab in selected container |
| **Click container card** | Select that container (does not navigate) |
| **Double-click container** | Select AND navigate to active tab |
| **Click [+]** | Open Create Menu |
| **Click [⚙]** | Open Container Actions Menu for selected container |
| **Click [←]** or **Escape** | Close Overview |

**Hover Feedback:**
- Moving mouse over favicons provides instant title feedback for rapid triage
- Selected container has visual highlight (border, background, or indicator)

---

### State Management

**Local State:**
- `overviewIsOpen`: Boolean visibility
- `selectedContainerId`: Currently selected container ID in the list

**Global Store:**
- `windows`: Raw windows from Chrome API
- `tabGroups`: Raw tab groups from Chrome API
- `containers`: Unified array for navigation — each item has `type: 'window' | 'group'`
- `activeTabId`: Currently active tab across all containers
- `activeContainerId`: Which container is currently focused

**Container Structure:**
```javascript
{
  type: 'window' | 'group',
  id: number,
  title: string,           // For groups: group name; For windows: window title or "Window N"
  tabs: [...],             // Tabs in this container
  color?: string,          // For groups: Chrome group color
  windowId?: number        // For groups: parent window ID (tabs still belong to a window)
}
```

---

### Visual States

**Default View:**
- Shows all containers in a vertically scrollable list
- First container is selected by default (or the currently active container)
- Selected container has visual highlight
- Footer with Create, Actions, and Close buttons

**Selection States:**
- **Unselected:** Normal appearance
- **Selected:** Highlighted border/background with selection indicator
- **Hover:** Subtle highlight on container card

**Empty State:**
- If only one window with few tabs, Overview still shows (no minimum)
- All containers always visible

---

### Code References

- Overview container: `Toolbar.svelte` (contains Overview logic)
- Container views: `WindowsView.svelte`, `WindowView.svelte`
- Header: `WindowsHeader.svelte` — stats display
- Footer: `WindowsFooter.svelte` — Create [+], Actions [⚙], Close [←]
- Tab display: `TabList.svelte`, `TabListItem.svelte`
- Store: `tabStore.js` — manages `windows`, `tabGroups`, `containers`

---

### Related Features

- [Container Actions Menu](./feature_container_actions.md) — Actions menu triggered from footer [⚙]
- [New Window Creation](./feature_new_window_creation.md) — Create button [+] functionality
- [Gesture-Based Tab Navigation](./feature_gesture_tab_navigation.md) — Same navigation model

---

### Implementation Notes

**Current:**
- Windows display with favicon grid
- Vertical scroll navigation for containers
- Footer with action buttons

**Pending:**
- Tab group API integration (`chrome.tabGroups`)
- Unified `containers` array in store
- Group row with Chrome colors
- Tab groups extracted from windows and displayed as peer containers
- Header with tab/container count

---

### Future Enhancements

- **Search:** Filter containers or tabs within overview
- **Sort:** Reorder containers via drag-and-drop
- **Batch actions:** Select multiple containers for close/move
- **Recently closed:** Section in overview for recently closed tabs
- **Workspace previews:** Thumbnail previews of tab contents
