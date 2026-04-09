import { installDemoChromeShim } from "./chromeShim.js";

installDemoChromeShim();

import { mountSwiftTabs } from "../swiftTabsMount.js";
import DemoTour from "./DemoTour.svelte";

mountSwiftTabs();

const tourRoot = document.createElement("div");
tourRoot.id = "swift-tabs-demo-tour";
document.body.appendChild(tourRoot);

new DemoTour({
    target: tourRoot,
});
