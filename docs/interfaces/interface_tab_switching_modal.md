## Interface: Tab Switching Modal

**Associated Screen:** Overlay (appears on any web page)  
**Supports Interaction:** [Tab Switching](../interactions/interaction_tab_switching.md)

---

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PAGE CONTENT                         │
│                      (background)                       │
│                                                         │
│                                                         │
│              ┌─────────────────────────────┐            │
│              │  [🔲] Previous Tab Title    │            │
│              │  prev-site.com                │            │
│              │                              │            │
│              │  ┌───────────────────────┐  │            │
│              │  │ [🔲] CURRENT TAB       │  │ ← Selected │
│              │  │ active-site.com        │  │   (Active) │
│              │  │                       │  │            │
│              │  │ ↑ ↓ to navigate       │  │            │
│              │  └───────────────────────┘  │            │
│              │                              │            │
│              │  [🔲] Next Tab Title          │            │
│              │  next-site.com                │            │
│              └─────────────────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
                     Viewport (100vw x 100vh)
```

**Positioning:** Fixed, centered in viewport  
**Z-index:** 999999 (above all content)  
**Size:** 320px width, auto-height  
**Layout:** Vertical stack with selected tab highlighted

---

### Component Hierarchy

```
TabSwitchingModal.svelte
├── Overlay (div.modal-overlay)
│   └── Container (div.tab-switching-modal)
│       ├── Previous Tab (TabPreview, faded)
│       ├── Selected Tab (TabPreview, highlighted)
│       │   ├── Favicon
│       │   ├── Title
│       │   └── URL
│       └── Next Tab (TabPreview, faded)
```

---

### Component Specs

#### TabSwitchingModal.svelte (Root)
**File:** `src/components/TabSwitchingModal.svelte`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentWindowTabs` | `Tab[]` | Yes | — | All tabs in current window |
| `activeTabId` | `number` | Yes | — | Currently active tab ID |

**State:**
| State | Type | Description |
|-------|------|-------------|
| `selectedTab` | `Tab \| null` | Currently selected tab in overlay |
| `isVisible` | `boolean` | Controls visibility for animations |

**Computed:**
| Property | Derivation |
|----------|------------|
| `sortedTabs` | Tabs sorted by index |
| `currentIndex` | Index of selectedTab in sortedTabs |
| `previousTab` | Tab at currentIndex - 1 (null if at start) |
| `nextTab` | Tab at currentIndex + 1 (null if at end) |

---

#### Container (div.tab-switching-modal)
**Purpose:** Root modal container with centered positioning

**Structure:** Conditionally rendered when visible. Full-viewport overlay wraps a centered inner container. Overlay uses `role="dialog"` and `aria-label="Tab switcher"`. Pointer-events none on overlay so clicks pass through.

**Style:** Overlay covers viewport with 30% black backdrop. Modal 320px wide, flex column with 8px gap, 16px padding. Dark background, 12px border radius, subtle border and shadow.

---

#### TabPreview Component
**Purpose:** Individual tab display (used 3 times: prev, current, next)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `tab` | `Tab` | Tab data to display |
| `isSelected` | `boolean` | Whether this is the selected tab |
| `isAdjacent` | `boolean` | Whether this is prev/next (faded) |

**Structure:** Flex row with favicon (left) and text block (title + optional URL when selected). Conditional classes for selected and adjacent states.

**Style:** 10px padding, 8px border radius. Favicon 16×16px. Title 14px weight 500, truncated. URL 11px secondary color, shown only when selected. Adjacent state: 50% opacity, 0.95 scale. Selected state: accent background and border, 1.02 scale.

---

### State Bindings

| Component | Prop/State | Store | Binding Type |
|-----------|------------|-------|--------------|
| TabSwitchingModal | `currentWindowTabs` | `tabStore.currentWindowTabs` | Readable store |
| TabSwitchingModal | `activeTabId` | `tabStore.activeTabId` | Readable store |
| TabSwitchingModal | `selectedTab` | Local (syncs with navigation) | Derived |

---

### Animation Specifications

**Overlay entry:** 150ms fade-in. Easing: ease-out.

**Tab selection change:** 100ms transition for opacity, transform, and background-color. Selected item scales and highlights smoothly.

**Modal exit:** 200ms fade-out. Easing: ease-in.

---

### Responsive Behavior

| Viewport Width | Container Width |
|----------------|-----------------|
| >= 360px | 320px (default) |
| < 360px | calc(100vw - 40px) |

---

### Empty States

| Condition | Display |
|-----------|---------|
| No tabs in window | "No tabs in this window" message |
| Single tab | Show only that tab (no prev/next) |
| At first tab | Show selected + next only (no prev) |
| At last tab | Show prev + selected only (no next) |

---

### Accessibility

- `role="dialog"` with `aria-label`
- Live region for tab changes: `aria-live="polite"`
- Focus remains on page (modal is non-blocking)
- Sufficient contrast for faded (adjacent) items

---

### Related Interfaces

- [interface_tabs_view.md](./interface_tabs_view.md) - Full tab list in Navigation Mode
- [interface_active_tab_info.md](./interface_active_tab_info.md) - Post-switch info display

---

### Code References

**Implementation:**
- `src/components/TabSwitchingModal.svelte`

**Store Integration:**
- `src/stores/tabStore.js` - `currentWindowTabs`, `activeTabId`

**Usage:**
- `src/App.svelte` - Renders modal when `isInTabSwitchingMode`
