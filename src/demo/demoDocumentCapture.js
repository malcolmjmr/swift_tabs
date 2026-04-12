/**
 * Demo-only: document-level capture listeners registered before App mounts so they run
 * before App’s wheel/click handling. Depends on chromeShim setting
 * window.__swiftTabsDemoInNavMode when NAVIGATION_MODE messages are sent.
 */
import { get } from "svelte/store";
import { tabStore, tabs, activeTabId } from "../stores/tabStore.js";
import { chromeService } from "../services/chromeApi.js";

function isDemoPage() {
    return typeof document !== "undefined" &&
        document.body?.classList?.contains("swift-tabs-demo");
}

function inDemoNavMode() {
    return typeof window !== "undefined" &&
        window.__swiftTabsDemoInNavMode === true;
}

/** @param {MouseEvent} e */
function onDocumentClickCapture(e) {
    if (!isDemoPage() || e.button !== 0) return;
    if (!inDemoNavMode()) return;
    if (!document.querySelector('[data-demo="tabs-card"]')) return;

    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('[data-demo="tabs-card"]')) return;
    if (t.closest(".nav-mode-tabs-dock")) return;
    if (t.closest(".omnibox-overlay")) return;

    window.chrome?.runtime?.sendMessage?.({
        type: "TRIAGE_MODE",
        isInTriageMode: false,
    });
    window.chrome?.runtime?.sendMessage?.({
        type: "NAVIGATION_MODE",
        isInNavigationMode: false,
    });
}

let modifierScrollAccum = 0;
const MODIFIER_SCROLL_THRESHOLD = 50;

/** @param {WheelEvent} e */
function onDocumentWheelCapture(e) {
    if (!isDemoPage()) return;
    if (inDemoNavMode()) return;
    if (!(e.metaKey || e.ctrlKey)) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    const list = [...get(tabs)].sort((a, b) => a.index - b.index);
    if (list.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const activeId = get(activeTabId);
    const idx = Math.max(
        0,
        list.findIndex((t) => t.id === activeId),
    );

    modifierScrollAccum += e.deltaY;
    if (Math.abs(modifierScrollAccum) < MODIFIER_SCROLL_THRESHOLD) return;

    const direction = modifierScrollAccum > 0 ? -1 : 1;
    modifierScrollAccum = 0;

    const nextIndex = (idx + direction + list.length) % list.length;
    const targetTab = list[nextIndex];
    if (!targetTab?.id) return;

    void (async () => {
        await chromeService.activateTab(targetTab.id);
        await tabStore.refreshState();
        window.chrome?.runtime?.sendMessage?.({ type: "TAB_SWITCHING_MODE" });
    })();
}

/**
 * Call from main.js before mountSwiftTabs() so capture runs before App’s listeners.
 */
export function installDemoDocumentCapture() {
    if (typeof document === "undefined") return () => {};
    document.addEventListener("click", onDocumentClickCapture, true);
    document.addEventListener("wheel", onDocumentWheelCapture, {
        capture: true,
        passive: false,
    });
    return () => {
        document.removeEventListener("click", onDocumentClickCapture, true);
        document.removeEventListener("wheel", onDocumentWheelCapture, true);
    };
}
