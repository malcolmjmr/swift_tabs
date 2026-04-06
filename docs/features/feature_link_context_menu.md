## Feature: Link Context Menu (http(s) links)

**Feature ID:** 9c  
**Status:** Implemented  
**Priority:** High  
**Addresses Need:** Information Summarization (Need 11), Tab Management (Need 3), Task Management (Need 12), URL manipulation (Need — clean links)

---

### Description

In the content script overlay, **http(s) anchor links** get custom handling: a **short** secondary-button press opens the link in a **new background tab** without the native context menu. A **long press** (same threshold as other long-press affordances, from settings `longPressDelayMs`, default ~500 ms) opens a **floating panel** (`LinkContextMenu.svelte`) for copy, open variants, queue, save-to-app, planner timeframes, LLM description, and iframe preview.

---

### Trigger

| Gesture | Result |
|--------|--------|
| **Right-button down + release** before long-press threshold | `contextmenu` fires; extension opens **background tab** (no native menu on the page for this path). |
| **Right-button hold** past threshold | Custom **Link Context Menu** at press origin; `contextmenu` is suppressed so it does not also open a tab. |
| Moving the pointer beyond a small radius while holding | Cancels the long-press timer (no menu on release). |

---

### Flow

1. **Mouse down** on an `http://` or `https://` link starts a timer and records URL, link text, and position (unless blocked by another overlay: tab menu, help, system menu, settings, existing link menu/preview/description).
2. **Timer fires:** set suppress flag, open menu at stored coordinates, clear pending state.
3. **`contextmenu` (capture):** If link menu, preview, or description is open, **preventDefault** + **stopImmediatePropagation** so the bubble handler does not run.
4. **Bubble `contextmenu` on link:** If menu open or suppress flag, only prevent/stop; if short press, **defer** background tab creation (~24 ms) then skip if the long-press path opened the menu in the meantime (avoids same-turn race with the timer).

---

### Menu UI

- **Header:** Link hostname for display (leading `www.` stripped; scheme is not shown in the label). **Favicon** beside the domain (Google `s2/favicons` by hostname); hidden if the image errors (e.g. strict page CSP).
- **No** bottom border on the header (structural styling only).
- **Sections:** Copy (full / clean URL), Open (Description, Preview, Tab, Window), Save to (Queue, optional domain app chip if the current tab’s domain has a registered app, **Time…**), then timeframe chips from planner display order.
- **Chips:** Compact padding; **selected** chip is indicated primarily by **opacity** (not a heavy border/fill).
- **Queue** chip can show a **badge** with session queue length.
- **Time…** opens a **sub-panel** (back + planner timeframes). Panel switch is **deferred** one macrotask and combined with a short **backdrop-ignore** window (~650 ms) so a stray window `click` does not immediately dismiss the menu after the DOM updates.

---

### Keyboard and wheel (menu focused)

- **Escape:** Sub-panel → main panel; on main → close menu.
- **Arrow up/down:** Move selection among chips on the active panel.
- **Space / Enter** (when pointer is **outside** the menu panel): Activate the selected chip (same as click).
- **Wheel** while pointer is **outside** the menu: Steps selection (non-passive listener on `document`, capture; delta **accumulation** threshold so small wheel ticks still move selection). Wheel over the menu does not hijack page scroll for selection.

---

### State and integrations

- **Link queue:** Session storage via `chromeService.linkQueuePush` / `linkQueueGet` (badge count).
- **Open tab / window / preview / description:** Events dispatched to `App.svelte`, which closes the menu and runs Chrome or UI flows.
- **Save to app (domain):** Requires `pageHostname` and a matching app in the apps registry (`appIdFromDomain`).
- **Planner backlog by timeframe:** Dispatches timeframe + URL; background handles `PLANNER_BACKLOG_ADD_LINK` (objectives with optional `url`).

---

### Code References

| Area | Location |
|------|----------|
| Long-press timer, deferred background tab, suppress flag, menu open/close wiring | `src/App.svelte` — `LINK_CONTEXT_TAB_DEFER_MS`, `handleRightClick`, `handleMouseDown` / `handleMouseUp` (link branch), `handleContextMenuCapture`, `LinkContextMenu` usage |
| Menu layout, chips, wheel/keyboard, sub-panel, favicon, backdrop ignore | `src/components/link/LinkContextMenu.svelte` |
| URL cleaning for “Clean link” | `src/utils/cleanUrl.js` |
| Timeframe labels / display order | `src/planner/plannerUiLabels.js` |

---

### Related Features

- [feature_link_preview.md](./feature_link_preview.md) — Original overlay vision; in-product preview is opened **from this menu** (iframe overlay), not standalone right-click-as-spec.
- [feature_apps_home.md](./feature_apps_home.md) — App registry used for “save to current domain” chip.
- Feature **101** (Link Preview Overlay) catalog entry remains the high-level enhancement idea; **9c** is the concrete Swift Tabs implementation path.

---

### Edge cases / notes

- **Same-turn race:** Native `contextmenu` and the long-press timeout can align; deferred tab open prevents opening a tab when the menu opens the same frame.
- **Strict CSP** on some sites may block favicon images; the menu degrades to text-only header.
- **Text selected** on the page: existing `contextmenu` behavior for links may not apply (handler returns early for text selection).
