## Interface: Active Tab Information

**Associated Screen:** Overlay (appears on any web page)  
**Supports Interaction:** [Tab Information Display](../interactions/interaction_tab_info_display.md)

---

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PAGE CONTENT                         │
│                      (background)                       │
│                                                         │
│                                                         │
│                              ┌────────────────────────┐ │
│                              │ [🔲] Tab Title         │ │
│                              │ ← → example.com   🔊   │ │
│                              └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
                     Viewport (100vw x 100vh)
```

**Positioning:** Fixed, bottom-right corner  
**Z-index:** 999990 (below modals, above content)  
**Size:** Fixed 360px × 80px (uniform dimensions)  
**Margins:** 20px from right edge, 20px from bottom edge

---

### Component Hierarchy

```
ActiveTabInfo.svelte
├── Container (div.active-tab-info)
│   └── Row (favicon | column)
│       ├── Favicon (img or fallback, full height minus padding)
│       └── Column (title | row)
│           ├── Title (span, 2 lines max, line-clamp)
│           └── Row (nav icons | url hostname | audio icon)
│               ├── Back Arrow (shown when canGoBack)
│               ├── Forward Arrow (shown when canGoForward)
│               ├── URL Hostname (span, truncated)
│               └── Audio Icon (shown when audible)
```

Structure: `row(favicon, column(title, row(back, forward, url, audio)))`

---

### Component Specs

#### ActiveTabInfo.svelte (Root)
**File:** `src/components/tab/ActiveTabInfo.svelte`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tab` | `Tab` | Yes | — | Tab object with id, title, url, favIconUrl, audible, canGoBack, canGoForward |

**State:**
| State | Type | Description |
|-------|------|-------------|
| `faviconFailed` | `boolean` | Whether favicon failed to load |
| `lastTabId` | `number \| null` | Last displayed tab ID for detecting tab changes |

**Computed:**
| Property | Derivation |
|----------|------------|
| `displayTitle` | `tab.title \|\| 'Untitled'` |
| `displayHostname` | URL hostname (e.g. example.com) |
| `canGoBack` | `tab.canGoBack ?? false` |
| `canGoForward` | `tab.canGoForward ?? false` |
| `isAudible` | `tab.audible ?? false` |

---

#### Container (div.active-tab-info)
**Purpose:** Root element with positioning and styling

**Structure:** Flex column with 4px gap. Uses `role="status"` and `aria-live="polite"`.

**Style:** Fixed position bottom-right (20px from edges), z-index 999990. Min-width 280px, max-width 400px, padding 12px 16px. Dark semi-transparent background, 8px border radius, subtle border and shadow. Hidden state: opacity 0, translateY 20px; visible state: opacity 1, translateY 0.

---

#### Row (favicon | column)
**Purpose:** Main layout—favicon plus content column

**Structure:** Flex row, 10px gap. Favicon (or first-letter fallback) on left; column on right with title above URL row.

**Style:** Favicon 16×16px, flex-shrink 0.

---

#### Column (title | URL row)
**Purpose:** Title and metadata

**Structure:** Flex column, 2px gap. Title on top; bottom row has navigation arrows, URL hostname, and audio icon.

**Style:** Title 14px weight 500, primary color, truncated. URL hostname 12px secondary color, truncated, flex-grow. Nav icons 12px muted color. Audio icon 12px muted color with left margin.

---

### State Bindings

| Component | Prop/State | Store | Binding Type |
|-----------|------------|-------|--------------|
| ActiveTabInfo | `tab` | `tabStore.activeTab` | Readable store |
| Favicon | `src` | `tab.favIconUrl` | Direct prop |
| Title | `text` | `tab.title` | Computed |
| URL hostname | `text` | `tab.url` | Computed (hostname only) |
| Audio icon | `visible` | `tab.audible` | Computed |
| Back arrow | `visible` | `tab.canGoBack` | Computed |
| Forward arrow | `visible` | `tab.canGoForward` | Computed |

---

### Animation Specifications

**Entry:** 150ms slide-up from 20px below with fade-in. Easing: ease-out.

**Exit:** 200ms slide-down 20px with fade-out. Easing: ease-in.

---

### Responsive Behavior

| Viewport Width | Behavior |
|----------------|----------|
| >= 400px | Full width (max 400px), positioned bottom-right |
| < 400px | Full width minus margins, centered |
| < 320px | Smaller padding, reduced font sizes |

---

### Accessibility

- `role="status"` and `aria-live="polite"` for screen reader announcements
- Favicon has empty `alt` (decorative, title provides context)
- Full title and URL available in `title` attributes for hover
- Navigation arrows have descriptive titles ("Can go back", "Can go forward")
- Audio icon has descriptive title ("Audio playing")
- Sufficient color contrast (WCAG AA compliant)
- Does not trap focus (informational only)

---

### Related Interfaces

- [interface_tab_menu.md](./interface_tab_menu.md) - Tab menu for tab actions

**Note:** ActiveTabInfo is not shown in Navigation Mode.

---

### Code References

**Implementation:**
- `src/components/tab/ActiveTabInfo.svelte` - Main component

**Store Integration:**
- `src/stores/tabStore.js` - `activeTabId`, `currentWindowTabs`

**Styling:**
- CSS custom properties in `App.svelte` global styles or component-scoped

**Animation:**
- CSS transitions for entry/exit animations
