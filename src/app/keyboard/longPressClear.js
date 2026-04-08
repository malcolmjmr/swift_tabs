/**
 * @param {KeyboardEvent} event
 * @param {{
 *   getSpaceLongPressTimer(): * | null;
 *   clearSpaceLongPressTimer(): void;
 *   getMetaLongPressTimer(): * | null;
 *   clearMetaLongPressTimer(): void;
 *   getAltLongPressTimer(): * | null;
 *   clearAltLongPressTimer(): void;
 *   getCtrlLongPressTimer(): * | null;
 *   clearCtrlLongPressTimer(): void;
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
        ctx.getMetaLongPressTimer() &&
        event.metaKey &&
        event.key !== "Meta" &&
        event.key !== "OS"
    ) {
        ctx.clearMetaLongPressTimer();
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
}
