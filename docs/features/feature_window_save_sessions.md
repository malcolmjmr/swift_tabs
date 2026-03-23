## Feature: Window Save & Session Management

**Status:** Planned  
**Priority:** Medium  
**Addresses Need:** Window/Session Organization

---

### Description

Allow users to save an entire browser window (all its tabs) as a named session. Sessions persist as bookmark folders with metadata, enabling users to restore their workspace later or add tabs to existing sessions.

---

### Save Flow

**From Overview Widget:**

```
User clicks ★ Save button in overview header
              │
              ▼
    ┌─────────────────────┐
    │ Window not saved?   │
    └─────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
    ┌───────┐  ┌──────────┐
    │  Yes  │  │    No    │
    └───────┘  └──────────┘
        │           │
        ▼           ▼
┌───────────────┐ ┌───────────────┐
│ • Gather tab  │ │ • Show edit   │
│   URLs/titles │ │   interface   │
│ • Send to LLM │ │ • Allow rename│
│ • Get title   │ │   or move     │
│ • Create      │ │               │
│   bookmark    │ │               │
│   folder      │ │               │
└───────────────┘ └───────────────┘
              │           │
              └─────┬─────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Show confirmation   │
         │ "Saved as [Name]"   │
         └─────────────────────┘
```

---

### LLM Title Generation

**Input:**
- Array of tab objects: `{ url, title, favicon }`
- Window metadata: active tab, number of tabs, timestamps

**LLM Prompt (Conceptual):**
```
Given these tabs in a browser window, generate a concise, descriptive name 
(2-5 words) that captures the common theme or purpose:

Tabs:
- "React Hooks documentation - React"
- "Svelte tutorial - Svelte.dev"
- "CSS Grid guide - MDN"
- "JavaScript array methods - MDN"

Suggested title: "Frontend Development Resources"
```

**User Control:**
- Suggested title shown in editable field
- User can accept, edit, or completely replace
- Cancel option aborts save

---

### Data Storage

**Bookmark Folder Structure:**
```
📁 Swift Tabs Sessions/          (root folder)
  📁 Project Research/             (session folder)
    🔖 React Docs                  (bookmark)
    🔖 API Reference
    🔖 Design Mockups
  📁 Shopping List/
    🔖 Amazon - Shoes
    🔖 eBay - Watch
```

**Metadata Storage:**
Since bookmarks don't support custom metadata, we have options:

1. **Bookmark Description Field:**
   - Store JSON metadata in description
   - `{"lastAccess": "2026-03-23T10:00:00Z", "created": "2026-03-20T08:30:00Z", "favicons": [...]}`

2. **Extension Storage:**
   - Use `chrome.storage.local` for metadata
   - Link to bookmark folder via folder ID

3. **Hybrid Approach:**
   - Basic info in bookmark structure
   - Extended metadata in extension storage

---

### Session Data Model

```javascript
interface SavedSession {
  id: string;                    // Bookmark folder ID
  name: string;                  // Display title
  created: Date;
  lastAccessed: Date;
  tabs: {
    url: string;
    title: string;
    favicon: string;
    added: Date;
  }[];
  color?: string;               // For window dot color
}
```

---

### User Interface

**Save Dialog:**
```
┌─────────────────────────────────────────┐
│  💾 Save Window as Session              │
├─────────────────────────────────────────┤
│                                         │
│  Suggested Title:                       │
│  ┌─────────────────────────────────┐    │
│  │ Project Research Resources      │    │  ← Editable
│  └─────────────────────────────────┘    │
│                                         │
│  Tabs in this session (8):              │
│  ├─ React Docs                          │
│  ├─ API Reference                       │
│  ├─ Design Mockups                      │
│  └─ ... and 5 more                      │
│                                         │
│       [Cancel]        [💾 Save]         │
└─────────────────────────────────────────┘
```

**Confirmation Toast:**
```
┌─────────────────┐
│ ✅ Saved as     │
│ "Project        │
│  Research"      │
│        [↶ Undo]│
└─────────────────┘
```

---

### Restore Flow

**From Saved Session Browser:**
1. User sees list of saved sessions
2. Clicking session shows details (tab list)
3. Options:
   - "Open all tabs" - Creates new window, opens all tabs
   - "Open in current window" - Adds tabs to current window
   - "Add specific tab" - Selective restoration

**From Bookmark Bar:**
- Right-click folder → "Open all in new window"
- Direct Chrome bookmark functionality

---

### Integration Points

- **Overview Widget:** Save button in header
- **Saved Session Browser:** List and restore interface
- **Bookmark API:** Storage and retrieval
- **LLM Service:** Title generation endpoint

---

### Code References (Planned)

- Save dialog: New component or `Toolbar` extension
- LLM service: New service file `llmService.js`
- Bookmark operations: `chromeService.js` extension
- Session management: New store methods in `tabStore`

---

### Dependencies

- Chrome Bookmarks API (create, update, remove)
- LLM API integration (OpenAI, Anthropic, or local)
- Extension storage for metadata

---

### Future Enhancements

- **Auto-save:** Option to auto-save windows on close
- **Sync:** Sync sessions across devices via Chrome bookmarks
- **Tags:** Categorize sessions with custom tags
- **Search:** Search within saved session names and tab titles
- **Duplicate detection:** Warn if saving duplicate of existing session
