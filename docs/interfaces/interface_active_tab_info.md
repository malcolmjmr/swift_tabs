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
│                              │ example.com  Hold ⌘   │ │
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
│           └── Row (url hostname | meta key hint)
│               ├── URL Hostname (span, truncated)
│               └── Meta Key Hint (span)
```

Structure: `row(favicon, column(title, row(url hostname, meta key hint)))`

---

### Component Specs

#### ActiveTabInfo.svelte (Root)
**File:** `src/components/tab/ActiveTabInfo.svelte`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tab` | `Tab` | Yes | — | Tab object with id, title, url, favIconUrl |
| `mode` | `'auto' \| 'navigation'` | No | `'auto'` | Display mode affects hints and persistence |
| `visible` | `boolean` | No | `true` | Controls visibility (for animation) |

**State:**
| State | Type | Description |
|-------|------|-------------|
| `isVisible` | `boolean` | Internal visibility for animations |
| `dismissTimeout` | `number \| null` | Auto-dismiss timer ID |

**Events:**
| Event | Detail | When Fired |
|-------|--------|------------|
| `dismiss` | — | User dismisses info (scroll, click, etc.) |
| `menuRequest` | — | User presses Meta key (hint shown) |

**Computed:**
| Property | Derivation |
|----------|------------|
| `displayTitle` | `tab.title \|\| 'Untitled'` |
| `displayHostname` | URL hostname (e.g. example.com) |
| `metaKeySymbol` | `'⌘'` on Mac, `'⊞'` on Windows/Linux |
| `hintText` | Mode-dependent: `'Hold ⌘ for menu'` or `'Space: Activate, ⌘: Menu'` |

---

#### Container (div.active-tab-info)
**Purpose:** Root element with positioning and styling

**Structure:** Flex column with 4px gap. Conditional visibility and mode classes for state-driven styling. Uses `role="status"` and `aria-live="polite"`.

**Style:** Fixed position bottom-right (20px from edges), z-index 999990. Min-width 280px, max-width 400px, padding 12px 16px. Dark semi-transparent background, 8px border radius, subtle border and shadow. Hidden state: opacity 0, translateY 20px; visible state: opacity 1, translateY 0.

---

#### Row (favicon | column)
**Purpose:** Main layout—favicon plus content column

**Structure:** Flex row, 10px gap. Favicon (or first-letter fallback) on left; column on right with title above url+hint row.

**Style:** Favicon 16×16px, flex-shrink 0.

---

#### Column (title | url-hint row)
**Purpose:** Title and metadata

**Structure:** Flex column, 2px gap. Title on top; bottom row has url hostname and meta key hint side by side.

**Style:** Title 14px weight 500, primary color, truncated. URL hostname 12px secondary color, truncated, flex-grow. Hint 11px muted, uppercase, flex-shrink 0.

---

### State Bindings

| Component | Prop/State | Store | Binding Type |
|-----------|------------|-------|--------------|
| ActiveTabInfo | `tab` | `tabStore.activeTab` | Readable store |
| ActiveTabInfo | `visible` | Local state | Not shown in navigation mode |
| Favicon | `src` | `tab.favIconUrl` | Direct prop |
| Title | `text` | `tab.title` | Computed |
| URL hostname | `text` | `tab.url` | Computed (hostname only) |

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

### Platform Adaptations

| Platform | Meta Key | Meta Key Display |
|----------|----------|------------------|
| macOS | Command (⌘) | `'⌘'` |
| Windows | Windows (⊞) | `'⊞'` |
| Linux | Super (⊞) | `'⊞'` |

**Detection:** Use `navigator.platform` to distinguish Mac (⌘) from Windows/Linux (⊞).

---

### Accessibility

- `role="status"` and `aria-live="polite"` for screen reader announcements
- Favicon has empty `alt` (decorative, title provides context)
- Full title and URL available in `title` attributes for hover
- Sufficient color contrast (WCAG AA compliant)
- Does not trap focus (informational only)

---

### Related Interfaces

- [interface_tab_menu.md](./interface_tab_menu.md) - Triggered by Meta key from this interface

**Note:** ActiveTabInfo is not shown in Navigation Mode.

---

### Code References

**Implementation:**
- `src/components/tab/ActiveTabInfo.svelte` - Main component
- `src/components/tab/ActiveTabView.svelte` - Alternative view (if exists)

**Store Integration:**
- `src/stores/tabStore.js` - `activeTabId`, `currentWindowTabs`

**Styling:**
- CSS custom properties in `App.svelte` global styles or component-scoped

**Animation:**
- Svelte transitions or CSS animations
