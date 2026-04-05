## Interaction: Omnibox Apps section (home, folder, library, detail)

**Addresses Need:** Efficient Tab Navigation (Need 1)  
**Supports Feature:** [Apps home, library, and detail](../features/feature_apps_home.md)

### Preconditions

- Omnibox open with **Apps** as active section.
- Data loaded via `APPS_GET_STATE` (registry + layout).

### Flow Steps

| Step | User action | System response | State change |
|------|-------------|-----------------|--------------|
| 1 | Open Apps | Load apps state; show wrapped **icon tiles** + **All apps** tile | `appsView = home` |
| 2 | **Wheel** over icon strip | Native scroll (overflow) | — |
| 2b | **Arrow keys** on icon strip | Move selection (wrap-aware rows) | `selectedResultIndex` |
| 3 | **Space** on app row | Open `defaultUrl` in new tab | May close omnibox |
| 4 | **Enter** on app row | Open app detail | `appsView = detail` |
| 5 | **Click** on app row | Same as Space (launch) | — |
| 6 | **Double-click** on app row | Same as Enter (detail) | — |
| 7 | **Enter** / **Space** / click on folder | Open folder children list | `appsView = folder`, stack push |
| 8 | Select **All apps** + Enter/Space/click | Open library list | `appsView = library` |
| 9 | **Backspace** in detail | Return to home/folder/library per `detailOpenedFrom` | Pop `appsView` |
| 10 | **Backspace** in library | Return to home | `appsView = home` |
| 11 | **Backspace** in folder | Pop folder stack or home | — |
| 12 | **Backspace** on home Apps | Close section results (picker) | — |
| 13 | **Long-press** (~480ms) app/folder tile | Enter arrange mode (`appsEditMode`) | Drag enabled |
| 14 | **Escape** while arranging | Exit arrange; keep omnibox open | `appsEditMode = false` |
| 15 | Drag in arrange | Reorder; persist layout | `APPS_PUT_LAYOUT` |
| 16 | Home: drop app on app | Create folder with both apps | `APPS_MERGE_INTO_FOLDER` |
| 17 | Detail: **Refresh** suggestions | Gemini + Google Search; cache on record | `suggestionsCache` |

### Visual States

- Home / folder / library: scrollable **apps-icon-scroll** + **flex-wrap** flow of tiles (no Edit toolbar).
- Detail: full-height panel with title, actions, queue, collapsible suggestions.

### Error Cases

- Missing Gemini API key: suggestions show error from `fetchAppSuggestions`.
- Stale layout references: missing app rows skipped when rendering.
