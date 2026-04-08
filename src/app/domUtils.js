export function isInTypingContext() {
    const el = document.activeElement;
    if (!el || typeof el.matches !== "function") return false;
    if (el.matches("input, textarea, select")) return true;
    return el.isContentEditable;
}

/** @param {KeyboardEvent} event */
export function noModifiersStrict(event) {
    return (
        !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey
    );
}

/** @param {KeyboardEvent} event */
export function noModifiersForHelpKey(event) {
    return !event.ctrlKey && !event.altKey && !event.metaKey;
}
