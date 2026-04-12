import "./demoLayout.css";
import { installDemoChromeShim } from "./chromeShim.js";
import { installDemoDocumentCapture } from "./demoDocumentCapture.js";
import { mountSwiftTabs } from "../swiftTabsMount.js";
import DemoTour from "./DemoTour.svelte";
import DemoTabViewport from "./DemoTabViewport.svelte";

installDemoChromeShim();
installDemoDocumentCapture();

document.body.classList.add("swift-tabs-demo");

const page = document.createElement("div");
page.className = "demo-page";

const title = document.createElement("h1");
title.className = "demo-page__title";
title.textContent = "A Chromeless Browser With Power Steering";

const browser = document.createElement("div");
browser.className = "demo-browser";

const viewportHost = document.createElement("div");
viewportHost.className = "demo-browser-viewport";
browser.appendChild(viewportHost);

const swiftRoot = document.createElement("div");
swiftRoot.id = "swift-tabs-root";
browser.appendChild(swiftRoot);

const tourRoot = document.createElement("div");
tourRoot.id = "swift-tabs-demo-tour";
tourRoot.className = "demo-page__instructions";

page.appendChild(title);
page.appendChild(browser);
page.appendChild(tourRoot);
document.body.appendChild(page);

mountSwiftTabs();

new DemoTabViewport({
    target: viewportHost,
});

new DemoTour({
    target: tourRoot,
});
