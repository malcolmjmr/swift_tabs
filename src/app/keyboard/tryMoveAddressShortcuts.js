import { isInTypingContext, noModifiersStrict } from "../domUtils.js";

/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {boolean}
 */
export function tryMoveAddressShortcuts(event, ctx) {
    if (isInTypingContext()) return false;
    if (!noModifiersStrict(event)) return false;
    const k = event.key;
    if (k !== "m" && k !== "M" && k !== "a" && k !== "A") return false;
    if (
        ctx.tabMenuIsOpen ||
        ctx.getMoveMenuOpen?.() ||
        ctx.getShowActiveTabAddress?.() ||
        ctx.helpMenuIsOpen ||
        ctx.systemMenuIsOpen ||
        ctx.settingsPageIsOpen ||
        ctx.omniboxIsOpen ||
        ctx.linkEsc?.isMenuOpen?.()
    ) {
        return false;
    }
    const tab =
        ctx.isInNavigationMode || ctx.getIsInTriageMode?.()
            ? ctx.getSelectedTab()
            : ctx.getCurrentTab();
    if (!tab) return false;
    event.preventDefault();
    event.stopPropagation();
    if (k === "m" || k === "M") ctx.openMoveMenuFromShortcut?.();
    else ctx.openActiveTabAddressFromShortcut?.();
    return true;
}
