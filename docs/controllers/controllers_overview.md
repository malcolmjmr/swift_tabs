# Controllers Overview

## Swift Tabs Chrome Extension

This document catalogs the system logic controllers that manage state and operations. Since Swift Tabs follows a component-first architecture where logic primarily lives in Svelte components, controllers here represent the shared state stores and service modules that components interact with.

---

## Controller Architecture

### Design Philosophy

Swift Tabs uses a **component-first state management** approach:

- **Local component state**: Handles UI state, interaction logic, and component-specific data
- **Global stores (read-only)**: Provide shared data (tabs, windows) that many components need
- **Service modules**: Encapsulate Chrome API operations and external integrations

Controllers documented here map to:
1. **Svelte Stores** - Reactive global state
2. **Service Modules** - API wrappers and business logic

---

## Controller Catalog

| Controller | Type | Purpose | Status |
|------------|------|---------|--------|
| `tabStore` | Store | Manages tab/window data from Chrome API | Implemented |
| `chromeService` | Service | Wraps Chrome extension APIs | Implemented |
| `llmService` | Service | LLM integration for session titles | Planned |

---

## Store Controllers

### tabStore

**File:** `src/stores/tabStore.js`  
**Type:** Svelte Writable Store  
**Scope:** Global (read-only for components)

**Purpose:**
Synchronizes with Chrome API to provide reactive tab and window data to all components. Acts as the single source of truth for browser state.

**State Variables:**
```javascript
{
  tabs: [],           // Flat array of all tabs across all windows
  windows: [],        // Array of window objects with embedded tabs
  activeTabId: null,  // Currently active tab ID
  activeWindowId: null, // Currently focused window ID
  initialized: false   // Whether initial load complete
}
```

**Derived Stores:**
- `tabs`: Flattened tab array
- `windows`: Window objects
- `activeTabId`, `activeWindowId`: IDs
- `currentWindowTabs`: Tabs in the active window only

**Methods:**
- `init()`: Load initial state from Chrome API
- `refreshState()`: Re-fetch all windows and tabs
- `activateTab(tabId)`: Switch browser to specified tab
- `closeTab(tabId)`: Close tab with state refresh
- `moveTab(tabId, windowId)`: Move tab between windows
- `reloadTab(tabId)`: Reload specified tab
- `pinTab(tabId)`: Toggle pinned state
- `duplicateTab(tabId)`: Create copy of tab
- `createTab(options)`: Open new tab

**Usage Pattern:**
```svelte
<script>
  import { currentWindowTabs, activeTabId } from '../stores/tabStore';
  // Read-only access in components
  $: tabs = $currentWindowTabs;
</script>
```

---

## Service Controllers

### chromeService

**File:** `src/services/chromeApi.js` (implied)  
**Type:** Service Module  
**Scope:** Internal (used by tabStore and components)

**Purpose:**
Wraps Chrome Extension APIs to provide promise-based, error-handled access to browser functionality.

**Methods:**
- `getWindows()`: Fetch all windows with tabs
- `getCurrentTab()`: Get active tab in current window
- `activateTab(tabId)`: Make tab active
- `closeTab(tabId)`: Remove tab
- `moveTab(tabId, windowId)`: Change tab's window
- `reloadTab(tabId)`: Reload tab
- `createTab(options)`: Create new tab
- `createWindow(options)`: Create new window
- `getBookmarks()`: Access bookmark tree
- `createBookmark(options)`: Add bookmark

**Error Handling:**
- All methods return Promises
- Errors logged and re-thrown for component handling
- Graceful degradation for missing permissions

---

### llmService (Planned)

**File:** `src/services/llmService.js` (future)  
**Type:** Service Module  
**Scope:** Internal (used by save session feature)

**Purpose:**
Integrate with LLM API to generate meaningful session names based on tab content.

**Planned Methods:**
- `generateSessionTitle(tabs)`: Send tab data, receive suggested title
- `summarizeTabs(tabs)`: Generate description of tab collection

**Configuration:**
- API key management (extension storage)
- Model selection (configurable)
- Fallback strategies if LLM unavailable

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                          │
│  (Tabs, Windows, Bookmarks, Events)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    chromeService                               │
│  (API wrapper, promise conversion, error handling)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    tabStore (Svelte Store)                     │
│  (Reactive state, derived stores, update methods)             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Toolbar    │ │ TabSwitching │ │   Windows    │
    │   Component  │ │    Modal     │ │    View      │
    │              │ │              │ │              │
    │ Local state: │ │ Local state: │ │ Local state: │
    │ • selectedTab│ │ • isVisible  │ │ • selectedWin│
    │ • viewType   │ │ • scrollPos  │ │ • isExpanded │
    │ • showMenu   │ │              │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Component State vs. Store Data

| Aspect | Component State | Store Data |
|--------|-----------------|------------|
| **What** | UI state, selections, visibility | Browser tabs, windows, bookmarks |
| **Scope** | Single component | Application-wide |
| **Persistence** | Ephemeral (in memory) | Syncs with Chrome API |
| **Writes** | Component owns its state | Store methods only |
| **Reads** | Local `$:` reactive | `$store` derived subscriptions |

---

## Code-to-Documentation Mapping

| Controller Doc | Source File | Components Using It |
|----------------|-------------|---------------------|
| `tabStore` | `src/stores/tabStore.js` | Toolbar, TabSwitchingModal, WindowsView, App |
| `chromeService` | `src/services/chromeApi.js` | tabStore, App (direct for special cases) |
| `llmService` | Planned | Window save dialog |

---

## Future Controllers

As features expand, consider adding:

1. **sessionStore**: Manage saved sessions metadata beyond bookmarks
2. **historyStore**: Track recently closed tabs for undo/restore
3. **settingsStore**: User preferences and configuration
4. **syncService**: Cross-device synchronization

---

## Notes

- Controllers are documented here but detailed specs are minimal since logic lives in components
- For component-specific logic, see interaction and interface documentation
- Store methods that modify browser state always call `refreshState()` after to keep UI in sync
