## Feature: New Window Creation

**Status:** Implemented  
**Priority:** Medium  
**Addresses Need:** Window and Group Management

---

### Description

Provide quick access to create new browser windows directly from the overview widget. Supports normal windows, incognito windows, and empty saved sessions.

---

### Trigger

**From Windows Overview Footer:**
- Click **[+] Create** button (left side of footer)
- Opens creation menu with options
- Footer structure: `[+] [⚙] [←]` — Create, Actions, Close

**From Saved Session Browser:**
- Available as "Create new window" option
- Also "Create new saved session" (empty session)

**Keyboard Shortcut (Future):**
- Consider **"n"** key for "new window" direct shortcut

---

### Creation Options

```
User clicks [+] Create button
              │
              ▼
    ┌─────────────────────────┐
    │     Create New...       │
    ├─────────────────────────┤
    │                         │
    │  🪟 New Window          │
    │     Normal browsing     │
    │                         │
    │  🕵️ New Incognito       │
    │     Private browsing    │
    │                         │
    │  📁 New Saved Session   │
    │     Empty session for   │
    │     later organization  │
    │                         │
    └─────────────────────────┘
```

---

### Option Details

#### 1. New Window (Normal)

**Behavior:**
- Opens new Chrome window
- Single empty tab (Chrome default)
- Standard browser window

**Technical:**
- API: `chrome.windows.create({ url: 'about:blank' })`
- Focus: Automatically focuses new window

**Use Case:**
- Starting new task or context
- Separating work from current window

---

#### 2. New Incognito Window

**Behavior:**
- Opens new incognito/private window
- Single empty tab
- Privacy mode enabled

**Technical:**
- API: `chrome.windows.create({ incognito: true })`
- Permissions: Requires "incognito" permission in manifest

**Use Case:**
- Private browsing session
- Testing without affecting history
- Shopping/research without tracking

**Limitations:**
- Extensions often limited in incognito (configurable in settings)
- Cannot access regular window tabs from incognito

---

#### 3. New Saved Session (Empty)

**Behavior:**
- Creates new empty bookmark folder
- Names it "New Session" or user-provided name
- No tabs added initially
- Available in session browser for later use

**Technical:**
- API: `chrome.bookmarks.create({ title: name, parentId: sessionsFolderId })`
- Creates structure immediately, ready for tabs to be added later

**Use Case:**
- Plan ahead for upcoming project
- Create session template
- Organize before tabs are open

---

### UI Flow

```
Windows Overview
┌─────────────────────────────────────────────────────────────────┐
│  Swift Tabs                    12 tabs  |  3 containers           │  ← Header
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           [Container List Scrolls Here]                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [+]         [⚙]              [←]                               │  ← Footer
│  create   actions menu    close/back                            │
└─────────────────────────────────────────────────────────────────┘
   │
   │ Click [+]
   ▼
Create Menu appears (as shown below)
   │
   ├──────────────┬──────────────┐
   │              │              │
   ▼              ▼              ▼
New Window    Incognito    New Session
   │              │              │
   ▼              ▼              ▼
Window opens  Window opens   Dialog:
                           "Name this session"
                           [New Session] [Create]
```

**Create Menu:**
```
┌─────────────────────────┐
│     Create New...       │
├─────────────────────────┤
│                         │
│  🪟 New Window          │
│     Normal browsing     │
│                         │
│  🕵️ New Incognito       │
│     Private browsing    │
│                         │
│  📁 New Saved Session   │
│     Empty session for   │
│     later organization  │
│                         │
└─────────────────────────┘
```

---

### State Management

**No persistent state needed** for this feature—delegates entirely to Chrome APIs.

**Event Handling:**
- Menu visibility: Local component state
- Creation call: Direct Chrome API
- Window tracking: Automatic via `tabStore` listeners

---

### Code References

- Create button: `WindowsFooter.svelte` (left button)
- Menu: Could be inline or separate component
- Chrome service: `chromeService.createWindow(options)`

---

### Implementation Notes

**Current Status:**
- Basic new window creation implemented
- Menu interface may be simple button or dropdown

**Manifest Requirements:**
```json
{
  "permissions": [
    "windows",
    "tabs"
  ],
  "incognito": "split"  // or "spanning"
}
```

---

### Related Features

- [Windows Overview](./feature_windows_overview.md) - Container for this feature
- [Window Save & Session Management](./feature_window_save_sessions.md) - Creates saved sessions

---

### Future Enhancements

- **Custom URL:** Option to create window with specific start page
- **Duplicate window:** Create new window with same tabs as current
- **Session template:** Create window pre-populated with common tabs
- **Keyboard shortcut:** Quick new window without opening widget
