# Controllers Overview

## Swift Tabs Chrome Extension

This document defines the state management architecture for Swift Tabs. Controllers in this context are Svelte stores that manage application state and provide actions for modifying that state.

**Related Documentation:**
- [Needs Overview](../needs/needs_overview.md) - User needs requiring state management
- [Features Overview](../features/features_overview.md) - Features using these controllers
- [Interactions Overview](../interactions/interactions_overview.md) - User flows that modify state

---

## Store Architecture

### Core Stores

| Store | File | Purpose | Persistence |
|-------|------|---------|-------------|
| `tabStore` | `tabStore.js` | Tab/window data from Chrome API | No (live from Chrome) |
| `uiStore` | `uiStore.js` | UI state (modes, visibility) | No (session only) |
| `recentActionsStore` | `recentActionsStore.js` | Recently used tab actions | Yes (chrome.storage.local) |
| `settingsStore` | `settingsStore.js` | User preferences | Yes (chrome.storage.local) |

---

## tabStore.js

**File:** `src/stores/tabStore.js`

**Purpose:** Central source of truth for all tab and window data from the Chrome API.

### Writable State

```javascript
// Core data (from Chrome API)
export const windows = writable([]);           // All Chrome windows with tabs
export const activeTabId = writable(null);     // Currently active tab ID
export const activeWindowId = writable(null);  // Currently active window ID

// Derived stores (computed from core)
export const currentWindowTabs = derived(
  [windows, activeWindowId],
  ([$windows, $activeWindowId]) => {
    const window = $windows.find(w => w.id === $activeWindowId);
    return window?.tabs || [];
  }
);

export const allTabs = derived(
  windows,
  $windows => $windows.flatMap(w => w.tabs || [])
);
```

### Actions

```javascript
export const tabStore = {
  // Initialize store from Chrome API
  async init() {
    await this.refreshState();
  },

  // Refresh all state from Chrome
  async refreshState() {
    const [windowsData, activeTab] = await Promise.all([
      chromeService.getAllWindows(),
      chromeService.getCurrentTab()
    ]);
    
    windows.set(windowsData);
    activeTabId.set(activeTab?.id || null);
    activeWindowId.set(activeTab?.windowId || null);
  },

  // Tab actions
  async activateTab(tabId) {
    await chromeService.activateTab(tabId);
    await this.refreshState();
  },

  async closeTab(tabId) {
    await chromeService.closeTab(tabId);
    await this.refreshState();
  },

  async moveTab(tabId, windowId, index) {
    await chromeService.moveTab(tabId, windowId, index);
    await this.refreshState();
  },

  // Window actions
  async focusWindow(windowId) {
    await chromeService.focusWindow(windowId);
    await this.refreshState();
  },

  async createWindow(options) {
    const window = await chromeService.createWindow(options);
    await this.refreshState();
    return window;
  }
};
```

---

## uiStore.js

**File:** `src/stores/uiStore.js`

**Purpose:** Manage UI state for modes, visibility, and selections.

### State

```javascript
// Navigation modes
export const isInNavigationMode = writable(false);
export const isInTabSwitchingMode = writable(false);
export const selectedTab = writable(null);  // Currently selected tab in UI

// Overlay visibility
export const activeTabInfoVisible = writable(false);
export const tabMenuOpen = writable(false);
export const omniboxOpen = writable(false);
export const windowsOverviewOpen = writable(false);

// Timers (not exported, internal use)
let dismissTimeout = null;
```

### Actions

```javascript
export const uiStore = {
  // Navigation mode
  enterNavigationMode() {
    isInNavigationMode.set(true);
    this.clearAllTimeouts();
  },

  exitNavigationMode() {
    isInNavigationMode.set(false);
    selectedTab.set(null);
    this.closeAllOverlays();
  },

  // Tab switching mode
  enterTabSwitchingMode(tab) {
    isInTabSwitchingMode.set(true);
    selectedTab.set(tab);
    this.setDismissTimeout();
  },

  resetTabSwitchingTimeout() {
    this.setDismissTimeout();
  },

  // Selection
  selectTab(tab) {
    selectedTab.set(tab);
  },

  // Overlay management
  showActiveTabInfo() {
    activeTabInfoVisible.set(true);
    this.setDismissTimeout(3000);
  },

  hideActiveTabInfo() {
    activeTabInfoVisible.set(false);
    this.clearDismissTimeout();
  },

  openTabMenu() {
    tabMenuOpen.set(true);
    this.clearDismissTimeout();
  },

  closeTabMenu() {
    tabMenuOpen.set(false);
  },

  openOmnibox(query = '') {
    omniboxOpen.set(true);
    omniboxQuery.set(query);
  },

  // Private helpers
  setDismissTimeout(ms = 1500) {
    if (dismissTimeout) clearTimeout(dismissTimeout);
    dismissTimeout = setTimeout(() => {
      isInTabSwitchingMode.set(false);
      activeTabInfoVisible.set(false);
    }, ms);
  },

  clearDismissTimeout() {
    if (dismissTimeout) {
      clearTimeout(dismissTimeout);
      dismissTimeout = null;
    }
  },

  closeAllOverlays() {
    activeTabInfoVisible.set(false);
    tabMenuOpen.set(false);
    omniboxOpen.set(false);
    windowsOverviewOpen.set(false);
  }
};
```

---

## recentActionsStore.js

**File:** `src/stores/recentActionsStore.js`

**Purpose:** Persist recently used tab actions for quick repeat access.

### Data Structure

```javascript
// Recent action entry
{
  id: 'save-to-task-project-alpha',
  category: 'save',           // 'save', 'move', 'basic', 'close'
  action: 'save_to',          // Action identifier
  targetType: 'task',         // 'task', 'bookmark', 'window', etc.
  targetName: 'Project Alpha', // Display name
  targetId: 123,              // Optional ID reference
  timestamp: 1699123456789,   // Last used
  useCount: 5                 // Usage count for ranking
}
```

### State

```javascript
export const recentActions = writable([]);
const MAX_RECENT_ACTIONS = 8;
const STORAGE_KEY = 'swift_tabs_recent_actions';
```

### Actions

```javascript
export const recentActionsStore = {
  // Load from persistence
  async init() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    recentActions.set(data[STORAGE_KEY] || []);
  },

  // Add new action to recent
  async addAction(action) {
    const current = get(recentActions);
    
    // Remove duplicates (same action + same target)
    const filtered = current.filter(a => 
      !(a.action === action.action && 
        a.targetId === action.targetId &&
        a.targetType === action.targetType)
    );
    
    // Add new action at beginning
    const updated = [action, ...filtered].slice(0, MAX_RECENT_ACTIONS);
    
    recentActions.set(updated);
    await this.save();
  },

  // Get top N recent actions
  getTopActions(count = 5) {
    const actions = get(recentActions);
    return actions.slice(0, count);
  },

  // Clear all recent actions
  async clear() {
    recentActions.set([]);
    await this.save();
  },

  // Save to Chrome storage
  async save() {
    const data = get(recentActions);
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  }
};
```

---

## settingsStore.js

**File:** `src/stores/settingsStore.js`

**Purpose:** User preferences and configuration.

### Default Settings

```javascript
const DEFAULT_SETTINGS = {
  // Toolbar behavior
  toolbarInPopup: false,
  openToolbarWithMetaKey: false,
  
  // Gesture settings
  queueLinkWithMetaKey: false,
  copyImageWithMetaKey: false,
  
  // View preferences
  defaultView: 'windows',  // 'windows', 'tabs', 'history', 'bookmarks'
  
  // Appearance
  theme: 'system',  // 'light', 'dark', 'system'
  
  // Timing
  tabInfoDismissDelay: 3000,
  tabSwitchingDismissDelay: 1500
};
```

### State

```javascript
export const settings = writable(DEFAULT_SETTINGS);
const STORAGE_KEY = 'swift_tabs_settings';
```

### Actions

```javascript
export const settingsStore = {
  // Load from persistence
  async init() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const saved = data[STORAGE_KEY] || {};
    settings.set({ ...DEFAULT_SETTINGS, ...saved });
  },

  // Update single setting
  async update(key, value) {
    settings.update(s => ({ ...s, [key]: value }));
    await this.save();
  },

  // Update multiple settings
  async updateMany(updates) {
    settings.update(s => ({ ...s, ...updates }));
    await this.save();
  },

  // Reset to defaults
  async reset() {
    settings.set(DEFAULT_SETTINGS);
    await this.save();
  },

  // Save to Chrome storage
  async save() {
    const data = get(settings);
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  }
};
```

---

## Store Integration Patterns

### Pattern 1: Read from Multiple Stores

```svelte
<script>
  import { windows, activeTabId, isInNavigationMode } from '../stores/tabStore';
  import { selectedTab } from '../stores/uiStore';
  
  // Reactive computation from multiple stores
  $: currentWindow = $windows.find(w => w.id === $activeWindowId);
  $: tabs = currentWindow?.tabs || [];
  $: displayTab = $isInNavigationMode ? $selectedTab : currentTab;
</script>
```

### Pattern 2: Action with Store Updates

```svelte
<script>
  import { tabStore } from '../stores/tabStore';
  import { uiStore, recentActionsStore } from '../stores/uiStore';
  
  async function closeTab(tab) {
    // Close the tab
    await tabStore.closeTab(tab.id);
    
    // Update UI
    uiStore.hideActiveTabInfo();
    
    // Track action
    await recentActionsStore.addAction({
      category: 'basic',
      action: 'close',
      timestamp: Date.now()
    });
  }
</script>
```

### Pattern 3: Derived Store with Custom Logic

```javascript
// Derived store for filtered/searchable tabs
export const searchableTabs = derived(
  [allTabs, omniboxQuery],
  ([$allTabs, $query]) => {
    if (!$query) return $allTabs;
    
    const lowerQuery = $query.toLowerCase();
    return $allTabs.filter(tab => 
      tab.title?.toLowerCase().includes(lowerQuery) ||
      tab.url?.toLowerCase().includes(lowerQuery)
    );
  }
);
```

---

## Chrome API Integration

All stores interact with Chrome APIs through the `chromeService`:

```javascript
// src/services/chromeApi.js
export const chromeService = {
  async getAllWindows() {
    return chrome.windows.getAll({ populate: true });
  },

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  },

  async activateTab(tabId) {
    await chrome.tabs.update(tabId, { active: true });
  },

  async closeTab(tabId) {
    await chrome.tabs.remove(tabId);
  },

  async moveTab(tabId, windowId, index) {
    await chrome.tabs.move(tabId, { windowId, index });
  },

  async focusWindow(windowId) {
    await chrome.windows.update(windowId, { focused: true });
  },

  async createWindow(options) {
    return chrome.windows.create(options);
  }
};
```

---

## Notes

- Stores follow Svelte's reactive model - components auto-update when store values change
- Chrome API calls are async and always followed by `refreshState()` to sync
- Persistent stores (recent actions, settings) use `chrome.storage.local`
- UI state is ephemeral and resets on page reload
- All derived stores recalculate automatically when dependencies change
