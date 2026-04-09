import {
    TRIAGE_HORIZONTAL_COMMIT_PX,
    TRIAGE_HORIZONTAL_AUTO_PX,
    TRIAGE_WHEEL_DELTA_X_SCALE,
    TRIAGE_WHEEL_IDLE_COMMIT_MS,
} from "../constants.js";

/** @type {ReturnType<typeof setTimeout> | null} */
let triageWheelIdleTimerId = null;

export function clearTriageWheelIdleTimer() {
    if (triageWheelIdleTimerId != null) {
        clearTimeout(triageWheelIdleTimerId);
        triageWheelIdleTimerId = null;
    }
}

/**
 * @param {object} ctx
 * @param {() => number} ctx.getTriageHorizontalPx
 * @param {(n: number) => void} ctx.setTriageHorizontalPx
 * @param {(side: "left" | "right") => void | Promise<void>} ctx.runTriageHorizontalAction
 */
function scheduleTriageWheelIdleCommit(ctx) {
    clearTriageWheelIdleTimer();
    triageWheelIdleTimerId = setTimeout(() => {
        triageWheelIdleTimerId = null;
        const px = ctx.getTriageHorizontalPx();
        const abs = Math.abs(px);
        if (abs >= TRIAGE_HORIZONTAL_AUTO_PX) return;
        if (abs >= TRIAGE_HORIZONTAL_COMMIT_PX) {
            void ctx.runTriageHorizontalAction(px > 0 ? "right" : "left");
        } else {
            ctx.setTriageHorizontalPx(0);
        }
    }, TRIAGE_WHEEL_IDLE_COMMIT_MS);
}

/**
 * @param {WheelEvent} event
 * @param {object} ctx
 * @param {() => boolean} ctx.getIsInTriageMode
 * @param {() => number} ctx.getTriageHorizontalPx
 * @param {(n: number) => void} ctx.setTriageHorizontalPx
 * @param {(side: "left" | "right") => void | Promise<void>} ctx.runTriageHorizontalAction
 * @param {(direction: number) => void | Promise<void>} ctx.onTriageVerticalStep
 * @param {number} ctx.scrollVerticalThreshold
 * @param {{ value: number }} ctx.scrollSelectDeltaRef
 * @returns {boolean} true if handled (caller should preventDefault)
 */
export function tryHandleTriageModeWheel(event, ctx) {
    if (!ctx.getIsInTriageMode()) return false;

    const isVertical = Math.abs(event.deltaX) < Math.abs(event.deltaY);
    if (isVertical) {
        clearTriageWheelIdleTimer();
        ctx.scrollSelectDeltaRef.value += event.deltaY;
        if (
            Math.abs(ctx.scrollSelectDeltaRef.value) >=
            ctx.scrollVerticalThreshold
        ) {
            const direction = ctx.scrollSelectDeltaRef.value > 0 ? -1 : 1;
            ctx.scrollSelectDeltaRef.value = 0;
            ctx.setTriageHorizontalPx(0);
            void ctx.onTriageVerticalStep(direction);
        }
        return true;
    }

    const delta = event.deltaX * TRIAGE_WHEEL_DELTA_X_SCALE;
    let px =
        ctx.getTriageHorizontalPx() +
        (Number.isFinite(delta) ? delta : 0);
    const max = TRIAGE_HORIZONTAL_AUTO_PX;
    px = Math.max(-max, Math.min(max, px));
    ctx.setTriageHorizontalPx(px);

    const abs = Math.abs(px);
    if (abs >= TRIAGE_HORIZONTAL_AUTO_PX) {
        void ctx.runTriageHorizontalAction(px > 0 ? "right" : "left");
        ctx.setTriageHorizontalPx(0);
        clearTriageWheelIdleTimer();
        return true;
    }

    scheduleTriageWheelIdleCommit(ctx);
    return true;
}
