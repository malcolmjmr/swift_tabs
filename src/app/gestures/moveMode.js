import { targetTabsForNavBatch } from "../navWindowModel.js";
import { applyVerticalMoveForSelection } from "./moveModeVerticalBatch.js";

/**
 * Move mode: vertical delta → reorder tab; horizontal → adjacent window.
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {object} ctx
 */
export function applyMoveModeDeltas(deltaX, deltaY, ctx) {
    const {
        getSelectedTab,
        getPersistentTabSelection,
        getCurrentNavWindowTabsSorted,
        navEdgeSlideKind,
        scrollVerticalThreshold,
        scrollHorizontalThreshold,
        moveModeVerticalAccumRef,
        moveModeHorizontalAccumRef,
        setSecondaryGestureHadScroll,
        tabStore,
        moveSelectedTabAdjacentWindow,
    } = ctx;

    const selectedTab = getSelectedTab();
    if (!selectedTab || navEdgeSlideKind() !== "window") return;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
    setSecondaryGestureHadScroll(true);
    const verticalDominant = Math.abs(deltaY) >= Math.abs(deltaX);
    if (verticalDominant) {
        moveModeVerticalAccumRef.value += deltaY;
        if (
            Math.abs(moveModeVerticalAccumRef.value) >= scrollVerticalThreshold
        ) {
            const dir = moveModeVerticalAccumRef.value > 0 ? 1 : -1;
            moveModeVerticalAccumRef.value = 0;
            const tabsSorted = getCurrentNavWindowTabsSorted?.() ?? [];
            const persistent = getPersistentTabSelection?.() ?? new Set();
            const batch = targetTabsForNavBatch(
                tabsSorted,
                selectedTab,
                persistent,
            );
            void applyVerticalMoveForSelection(
                tabStore,
                tabsSorted,
                batch,
                dir,
            );
        }
    } else {
        moveModeHorizontalAccumRef.value += deltaX;
        if (
            Math.abs(moveModeHorizontalAccumRef.value) >=
            scrollHorizontalThreshold
        ) {
            const dirToWindow = moveModeHorizontalAccumRef.value > 0 ? 1 : -1;
            moveModeHorizontalAccumRef.value = 0;
            void moveSelectedTabAdjacentWindow(null, dirToWindow);
        }
    }
}

/**
 * @param {MouseEvent} event
 * @param {object} ctx
 */
export function handleMoveModeMouseMove(event, ctx) {
    const {
        tabMenuIsOpen,
        moveMenuIsOpen,
        systemMenuIsOpen,
        settingsPageIsOpen,
        isInNavigationMode,
        navEdgeSlideKind,
        getSelectedTab,
        moveModeLastClientXYRef,
        applyMoveModeDeltasFn,
    } = ctx;

    if (
        tabMenuIsOpen ||
        moveMenuIsOpen ||
        systemMenuIsOpen ||
        settingsPageIsOpen
    ) {
        return;
    }
    if (
        !isInNavigationMode ||
        !(event.buttons & 2) ||
        navEdgeSlideKind() !== "window" ||
        !getSelectedTab()
    ) {
        return;
    }
    let dx = 0;
    let dy = 0;
    const mx = event.movementX;
    const my = event.movementY;
    if (mx != null && my != null && (mx !== 0 || my !== 0)) {
        dx = mx;
        dy = my;
    } else if (
        moveModeLastClientXYRef.x != null &&
        moveModeLastClientXYRef.y != null
    ) {
        dx = event.clientX - moveModeLastClientXYRef.x;
        dy = event.clientY - moveModeLastClientXYRef.y;
    } else {
        moveModeLastClientXYRef.x = event.clientX;
        moveModeLastClientXYRef.y = event.clientY;
        return;
    }
    moveModeLastClientXYRef.x = event.clientX;
    moveModeLastClientXYRef.y = event.clientY;
    applyMoveModeDeltasFn(dx, dy);
}
