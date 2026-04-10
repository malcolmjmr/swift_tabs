/**
 * @param {KeyboardEvent} event
 * @param {{
 *   getSpaceLongPressTimer(): * | null;
 *   clearSpaceLongPressTimer(): void;
 *   getAltLongPressTimer(): * | null;
 *   clearAltLongPressTimer(): void;
 *   getCtrlLongPressTimer(): * | null;
 *   clearCtrlLongPressTimer(): void;
 *   getNLongPressTimer(): * | null;
 *   clearNLongPressTimer(): void;
 * }} ctx
 */
export function applyLongPressTimerClearsOnKeydown(event, ctx) {
    if (
        ctx.getSpaceLongPressTimer() &&
        !(event.key === " " && event.repeat) &&
        event.key !== " "
    ) {
        ctx.clearSpaceLongPressTimer();
    }
    if (
        ctx.getAltLongPressTimer() &&
        event.altKey &&
        event.key !== "Alt"
    ) {
        ctx.clearAltLongPressTimer();
    }
    if (
        ctx.getCtrlLongPressTimer() &&
        event.ctrlKey &&
        event.key !== "Control"
    ) {
        ctx.clearCtrlLongPressTimer();
    }
    if (
        ctx.getNLongPressTimer() &&
        !((event.key === "n" || event.key === "N") && event.repeat) &&
        event.key !== "n" &&
        event.key !== "N"
    ) {
        ctx.clearNLongPressTimer();
    }
}
