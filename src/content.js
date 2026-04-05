import { mountSwiftTabs, cleanupSwiftTabs } from "./swiftTabsMount.js";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSwiftTabs);
} else {
    mountSwiftTabs();
}

window.addEventListener("unload", cleanupSwiftTabs);
