import { isInTypingContext } from "../domUtils.js";
import { applyLongPressTimerClearsOnKeydown } from "./longPressClear.js";
import { tryTypingContextNavSpace } from "./tryTypingContextNavSpace.js";
import { tryGlobalMenuShortcuts } from "./globalMenuShortcuts.js";
import { tryNavSfxSpaceEscape } from "./navSfxSpaceEscape.js";
import { tryGlobalIdleTabShortcuts } from "./globalIdleTabShortcuts.js";
import { tryNavModeMoreKeys } from "./navModeMoreKeys.js";
import { tryTabSwitchingArrows } from "./tabSwitchingArrows.js";
import { tryCommaDotAndTextSelection } from "./commaDotTextSelection.js";

/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 */
export async function dispatchAppKeydown(event, ctx) {
    if (tryTypingContextNavSpace(event, ctx)) return;
    if (isInTypingContext()) {
        applyLongPressTimerClearsOnKeydown(event, ctx);
        const isSpace = event.key === " " || event.code === "Space";
        if (!isSpace || !ctx.shouldStealSpaceForNavWhileTyping?.()) {
            return;
        }
    } else {
        applyLongPressTimerClearsOnKeydown(event, ctx);
    }
    if (tryGlobalMenuShortcuts(event, ctx)) return;
    if (await tryNavSfxSpaceEscape(event, ctx)) return;
    if (await tryGlobalIdleTabShortcuts(event, ctx)) return;
    if (await tryNavModeMoreKeys(event, ctx)) return;
    if (await tryTabSwitchingArrows(event, ctx)) return;
    if (await tryCommaDotAndTextSelection(event, ctx)) return;
}
