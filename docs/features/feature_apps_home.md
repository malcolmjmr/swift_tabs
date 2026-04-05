## Feature: Apps home, library, and detail (Omnibox)

**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Efficient Tab Navigation (Need 1), Omnibox / Suggestions (Need 13)

### Description

Persisted **app registry** (per domain/site) in domain storage collection `apps`, plus a separate **home layout** JSON in `chrome.storage.local`. The Omnibox **Apps** section shows **home**, **folder**, and **library** as a **flex-wrapped strip of icon tiles** (large favicon or folder glyph, short label—no URL row), with a scrollable container for overflow. **All apps** is a tile at the end of the home flow. **Folder** and **library** use the same strip. **Detail** remains a separate panel (title, link queue, Gemini suggestions). **Arrange:** **long-press** (~480ms) on an app or folder tile enables drag-reorder and drop-on-app (home only) to merge into a folder; **Escape** exits arrange without closing the omnibox.

### Trigger

User opens Omnibox, selects **Apps** section (or equivalent flow).

### Flow

- First-time empty registry + empty layout: background seeds from history-derived favorites (`GET_FAVORITE_DOMAINS` logic), one-time flag `st:v1:apps_seeded_v1`.
- **Home / folder / library:** tiles in wrap order; **All apps** opens library. **Space** launches; **Enter** opens detail or folder; **click** launches; **double-click** opens detail/folder. **Arrow keys** move selection using measured wrap rows; wheel scrolls the strip natively (no wheel hijack).
- **Detail:** edit title, queue links, suggestions panel, add/remove home, delete app.
- **Arrange:** long-press tile, then drag to reorder (home or open folder); on **home** only, drop app onto app runs `APPS_MERGE_INTO_FOLDER`.

### State Management

- **Registry:** `getDomainStorage()` / collection `apps` — see [`src/services/apps/appsBackground.js`](../../src/services/apps/appsBackground.js).
- **Layout:** key `st:v1:app_home_layout` — `{ version, items }` with `kind: 'app' | 'folder'`.
- **UI:** [`src/components/Omnibox.svelte`](../../src/components/Omnibox.svelte) — `appsView`, `appsFolderStack`, `detailAppId`, `appsEditMode`.

### Code References

- [`src/services/apps/appsModel.js`](../../src/services/apps/appsModel.js) — layout key, ids, helpers  
- [`src/services/apps/appsBackground.js`](../../src/services/apps/appsBackground.js) — CRUD, seed, merge, remove from home  
- [`background.js`](../../background.js) — `APPS_*` message handlers  
- [`src/services/chromeApi.js`](../../src/services/chromeApi.js) — `chromeService.apps*`  
- [`src/services/geminiClient.js`](../../src/services/geminiClient.js) — `fetchAppSuggestions`, `APP_SUGGESTIONS_TTL_MS`  
- [`src/components/Omnibox.svelte`](../../src/components/Omnibox.svelte) — UI and keyboard/wheel behavior  
