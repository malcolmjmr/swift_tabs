## Feature: Find in Page

**Status:** Planned
**Priority:** Medium
**Addresses Need:** Find in Page (Need 6)

---

### Description

Quickly search for text within the current webpage using a dedicated keyboard shortcut from navigation mode. Provides a lightweight, non-intrusive find interface that stays within the Swift Tabs gesture flow.

---

### Motivation

Standard browser find (Cmd+F) requires:
1. Leaving the gesture/keyboard flow
2. Reaching for a different key combination
3. Dealing with browser's find bar UI

Users want to stay in the Swift Tabs navigation mindset while finding content.

---

### Trigger

**From Navigation Mode:**
- Press `/` (like Vim, less, man pages)
- Alternative: Press `f` (for "find")

**Opens:** Find bar overlay at top of page

---

### Find Interface

```
┌─────────────────────────────────────────┐
│  🔍 [search term...          ]  2/8  ✕   │
│      │                                  │
│      │ match highlight in page         │
│      │                                  │
└─────────────────────────────────────────┘
```

**Components:**
- Search input field (auto-focused)
- Match counter (e.g., "2/8")
- Previous/Next buttons (or use Enter/Shift+Enter)
- Close button (or use Escape)

---

### Behavior

**Opening:**
1. User presses `/` in navigation mode
2. Find bar appears at top of screen
3. Input field is focused, ready for typing
4. Navigation mode stays active (or pauses)

**Searching:**
1. User types search term
2. Matches are highlighted on page in real-time
3. First match is focused/scrolled into view
4. Match counter updates

**Navigation:**
- `Enter`: Go to next match
- `Shift+Enter`: Go to previous match
- `↑/↓` arrows: Next/previous match
- `Escape`: Close find bar

**Closing:**
- `Escape`: Close find bar, return to navigation mode
- Clicking outside: Close find bar
- `Enter` when at last match: Close and stay on match

---

### Technical Approaches

#### Option A: Chrome Extension API (Preferred if available)

Chrome extensions have access to `chrome.tabs.find()` API:

```javascript
// In background script or content script with permissions
chrome.tabs.find(query, {
    caseSensitive: false,
    includeRange: true
}, (results) => {
    // results contains match positions
});
```

**Limitations:**
- Not available in all contexts
- May require additional permissions

#### Option B: JavaScript Implementation

Inject JavaScript to perform find and highlight:

```javascript
function findInPage(query) {
    // Use window.find() - native browser method
    const found = window.find(query, false, false, true, false, true, false);
    // Wrap found text in highlight spans
    // Scroll into view
}
```

**Challenges:**
- `window.find()` is deprecated and inconsistent
- Need to handle highlights manually
- Must not break page functionality

#### Option C: Content Script Integration

Create a content script that:
1. Receives search query from Swift Tabs overlay
2. Performs search using DOM traversal
3. Highlights matches with CSS classes
4. Communicates results back to overlay

**Implementation:**

```javascript
// content_script.js
let highlights = [];
let currentIndex = 0;

function findAndHighlight(query) {
    // Remove previous highlights
    clearHighlights();
    
    if (!query) return { count: 0 };
    
    // Walk DOM text nodes
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.toLowerCase().includes(query.toLowerCase())) {
            textNodes.push(node);
        }
    }
    
    // Wrap matches in highlight spans
    textNodes.forEach(node => {
        const parent = node.parentElement;
        const text = node.nodeValue;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        const html = text.replace(regex, '<span class="swift-find-highlight">$1</span>');
        
        const wrapper = document.createElement('span');
        wrapper.innerHTML = html;
        parent.replaceChild(wrapper, node);
        
        // Collect highlight elements
        const newHighlights = wrapper.querySelectorAll('.swift-find-highlight');
        highlights.push(...newHighlights);
    });
    
    return { count: highlights.length };
}

function navigateToMatch(index) {
    if (highlights.length === 0) return;
    
    // Remove current highlight
    highlights.forEach((el, i) => {
        el.classList.toggle('swift-find-current', i === index);
    });
    
    // Scroll to match
    highlights[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Listen for messages from Swift Tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FIND_IN_PAGE') {
        const result = findAndHighlight(request.query);
        sendResponse(result);
    } else if (request.type === 'FIND_NEXT') {
        currentIndex = (currentIndex + 1) % highlights.length;
        navigateToMatch(currentIndex);
        sendResponse({ current: currentIndex + 1, total: highlights.length });
    } else if (request.type === 'FIND_PREV') {
        currentIndex = (currentIndex - 1 + highlights.length) % highlights.length;
        navigateToMatch(currentIndex);
        sendResponse({ current: currentIndex + 1, total: highlights.length });
    } else if (request.type === 'FIND_CLOSE') {
        clearHighlights();
    }
});
```

**CSS for highlighting:**
```css
.swift-find-highlight {
    background-color: yellow;
    color: black;
}

.swift-find-current {
    background-color: orange;
    color: black;
}
```

---

### UI Component

**FindBar.svelte:**

```svelte
<script>
    import { createEventDispatcher, onMount } from 'svelte';
    
    export let query = '';
    export let matchCount = 0;
    export let currentMatch = 0;
    
    let inputEl;
    const dispatch = createEventDispatcher();
    
    onMount(() => {
        inputEl?.focus();
    });
    
    function handleInput() {
        dispatch('search', { query });
    }
    
    function handleKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
                dispatch('previous');
            } else {
                dispatch('next');
            }
        } else if (event.key === 'Escape') {
            dispatch('close');
        }
    }
    
    function next() {
        dispatch('next');
    }
    
    function previous() {
        dispatch('previous');
    }
    
    function close() {
        dispatch('close');
    }
</script>

<div class="find-bar">
    <span class="icon">🔍</span>
    <input
        bind:this={inputEl}
        type="text"
        bind:value={query}
        on:input={handleInput}
        on:keydown={handleKeydown}
        placeholder="Find in page..."
    />
    {#if matchCount > 0}
        <span class="counter">{currentMatch}/{matchCount}</span>
    {/if}
    <button class="nav-btn" on:click={previous} disabled={matchCount === 0}>↑</button>
    <button class="nav-btn" on:click={next} disabled={matchCount === 0}>↓</button>
    <button class="close-btn" on:click={close}>✕</button>
</div>
```

---

### Integration with App.svelte

**Add to handleKeydown:**

```javascript
} else if (event.key === '/' && isInNavigationMode) {
    event.preventDefault();
    event.stopPropagation();
    findInPageOpen = true;
    findQuery = '';
} else if (event.key === 'f' && isInNavigationMode) {
    // Alternative trigger
    event.preventDefault();
    event.stopPropagation();
    findInPageOpen = true;
    findQuery = '';
}
```

**Template integration:**

```svelte
{#if findInPageOpen}
    <FindBar
        bind:query={findQuery}
        matchCount={findMatchCount}
        currentMatch={findCurrentMatch}
        on:search={handleFindSearch}
        on:next={handleFindNext}
        on:previous={handleFindPrevious}
        on:close={() => findInPageOpen = false}
    />
{/if}
```

---

### State Management

**New State:**
```javascript
let findInPageOpen = false;
let findQuery = '';
let findMatchCount = 0;
let findCurrentMatch = 0;
```

**Message Handling:**
```javascript
async function handleFindSearch(event) {
    const result = await chromeService.findInPage(event.detail.query);
    findMatchCount = result.count;
    findCurrentMatch = result.count > 0 ? 1 : 0;
}

async function handleFindNext() {
    const result = await chromeService.findNext();
    findCurrentMatch = result.current;
}

async function handleFindPrevious() {
    const result = await chromeService.findPrevious();
    findCurrentMatch = result.current;
}
```

---

### Chrome Service Methods

```javascript
// src/services/chromeApi.js

async findInPage(query) {
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, {
            type: 'FIND_IN_PAGE',
            query
        }, resolve);
    });
}

async findNext() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { type: 'FIND_NEXT' }, resolve);
    });
}

async findPrevious() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { type: 'FIND_PREV' }, resolve);
    });
}

async closeFind() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'FIND_CLOSE' });
}
```

---

### Permissions

Add to `manifest.json`:
```json
{
    "permissions": [
        "activeTab",
        "scripting"
    ],
    "host_permissions": [
        "<all_urls>"
    ]
}
```

---

### Code References

- **Content Script:** Needs creation in `src/content_script.js` or similar
- **Chrome Service:** `src/services/chromeApi.js` - needs find methods
- **App Integration:** `src/App.svelte` - key handler and UI state
- **Component:** `src/components/FindBar.svelte` - new component

---

### Implementation Checklist

- [ ] Create content script for page search
- [ ] Add highlight CSS to content script
- [ ] Implement find/highlight/navigation functions
- [ ] Create FindBar.svelte component
- [ ] Add chromeService methods for find operations
- [ ] Add `/` and `f` key handlers in App.svelte
- [ ] Manage find bar state (open/close/query/count)
- [ ] Handle Escape to close
- [ ] Handle Enter/Shift+Enter for navigation
- [ ] Add match counter display
- [ ] Test on various page types
- [ ] Handle edge cases (iframes, dynamic content)
