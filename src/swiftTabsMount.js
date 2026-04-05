import App from "./App.svelte";

let app = null;

export function createMountPoint() {
    const existingRoot = document.getElementById("swift-tabs-root");
    if (existingRoot) {
        return existingRoot;
    }

    const root = document.createElement("div");
    root.id = "swift-tabs-root";
    document.body.appendChild(root);
    return root;
}

export function addHeaderLinks() {
    if (document.querySelector("link[data-swift-tabs-fonts]")) return;
    const materialSymbolsLink = document.createElement("link");
    materialSymbolsLink.rel = "stylesheet";
    materialSymbolsLink.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
    materialSymbolsLink.setAttribute("data-swift-tabs-fonts", "");
    document.head.appendChild(materialSymbolsLink);
}

export function mountSwiftTabs() {
    cleanupSwiftTabs();
    const mountPoint = createMountPoint();
    addHeaderLinks();
    app = new App({
        target: mountPoint,
    });
}

export function cleanupSwiftTabs() {
    if (app) {
        app.$destroy();
        app = null;
    }
}
