import { isInTypingContext } from "../domUtils.js";

/**
 * Cmd/Ctrl + Space in a text field enters navigation mode (page is otherwise idle for shortcuts).
 * @param {KeyboardEvent} event
 * @param {{ getIsInNavigationMode?: () => boolean; enterNavigationModeFromTyping?: () => void }} ctx
 * @returns {boolean}
 */
export function tryTypingContextNavSpace(event, ctx) {
    if (!isInTypingContext()) return false;
    if (event.key !== " " && event.code !== "Space") return false;
    if (!event.ctrlKey && !event.metaKey) return false;
    if (event.altKey || event.shiftKey) return false;
    if (event.repeat) return false;
    if (ctx.getIsInNavigationMode?.()) return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    ctx.enterNavigationModeFromTyping?.();
    return true;
}
