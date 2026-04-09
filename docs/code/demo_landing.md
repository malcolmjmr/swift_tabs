# Landing page interactive demo

Static **mock-Chrome** build of Swift Tabs for marketing sites. It uses the same `App.svelte` as the extension, with:

- [`src/demo/chromeShim.js`](../../src/demo/chromeShim.js) — `chrome.runtime.sendMessage` loopback + `chrome.storage.local`
- [`src/demo/chromeApiMock.js`](../../src/demo/chromeApiMock.js) — in-memory windows/tabs (Rollup aliases replace [`src/services/chromeApi.js`](../../src/services/chromeApi.js))
- [`src/demo/tabStoreDemo.js`](../../src/demo/tabStoreDemo.js) — same as [`src/stores/tabStore.js`](../../src/stores/tabStore.js) without `TAB_UPDATED` listeners (aliases replace the store module in the demo bundle only)

## Build

```bash
npm run build:demo
```

Outputs under **`dist/demo/`**:

| File       | Role                          |
|-----------|--------------------------------|
| `demo.html` | Entry page (copied from `src/demo/demo-shell.html`) |
| `demo.js`   | IIFE bundle                    |
| `demo.css`  | Extracted styles               |

The script removes a stale nested `dist/demo/dist/` folder if Rollup ever recreated it.

## Testing locally

Open `demo.html` in a browser **without** the Swift Tabs extension loaded on that page (e.g. **Guest window**, **Incognito** with the extension disabled for incognito, or another browser profile). If the real extension is active on the same tab, you get two `chrome` runtimes, duplicate listeners, and navigation/keyboard handling that no longer match the mock-only demo.

## Deploying in another repo

1. Run `npm run build:demo` in this repository.
2. Copy the entire **`dist/demo/`** directory into the other project (e.g. `public/swift-tabs-demo/`).
3. No Node runtime is required on the host—only static file serving.

## Embedding

Use an **iframe** so wheel capture and layout stay isolated from the parent page:

```html
<iframe
  src="/swift-tabs-demo/demo.html"
  title="Swift Tabs interactive demo"
  width="100%"
  height="640"
  style="border:0;border-radius:12px;max-width:960px"
></iframe>
```

Adjust `src` to match your static path. The page loads Google Fonts (Material Symbols) from the network unless you vendor that stylesheet for a stricter CSP.

## In-page controls

- **Tour** — prompts advance on each action (see `DemoTour.svelte`): open tabs, vertical scroll to change highlight, Space to navigate, reopen strip, Shift multi-select (next step after two+ rows selected), Enter, Delete, right-click+scroll. No overlay outline on the tab card. **Reset demo** restores fixtures and closes navigation; **Reload page** refreshes.
- **Space** — toggles navigation mode (same as the extension).

## Extension vs demo

- The **demo** only updates in-memory windows (no real `chrome.windows` aside from the shim).
- In the **real extension**, after **Enter** / **move to new window**, `background.js` calls `restoreChromeWindowFocus` so the OS window you were using stays focused; the new window exists but is not brought to the front until you activate a tab as usual.

## Source layout

- [`src/demo/main.js`](../../src/demo/main.js) — shim, mount `App`, mount `DemoTour` (navigation starts **closed**; user presses **Space**)
- [`src/demo/fixtures/sampleWindows.js`](../../src/demo/fixtures/sampleWindows.js) — initial windows/tabs
- [`src/demo/DemoTour.svelte`](../../src/demo/DemoTour.svelte) — guided copy (no third-party tour library)

Rollup config: fourth bundle in [`rollup.config.js`](../../rollup.config.js) with the `swiftTabsDemoAliases` plugin.
