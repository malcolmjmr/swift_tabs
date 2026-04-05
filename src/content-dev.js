/**
 * Dev harness: same App mount as the content script, opened as chrome-extension://…/content-dev.html
 * so you can run `npm run dev` and reload this tab only (no extension reload, no tab churn).
 */
import { mountSwiftTabs, cleanupSwiftTabs } from "./swiftTabsMount.js";

document.documentElement.setAttribute("data-swift-tabs-content-dev", "");

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSwiftTabs);
} else {
    mountSwiftTabs();
}

window.addEventListener("unload", cleanupSwiftTabs);
