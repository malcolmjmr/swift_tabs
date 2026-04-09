import { noModifiersForHelpKey, noModifiersStrict } from "../domUtils.js";

/**
 * Help, omnibox open, tab menu, Meta/Alt/Ctrl long-press → menus.
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {boolean} true if handled
 */
export function tryGlobalMenuShortcuts(event, ctx) {
    const {
        isIdleForGlobalTabActions,
        omniboxIsOpen,
        tabMenuIsOpen,
        helpMenuIsOpen,
        systemMenuIsOpen,
        settingsPageIsOpen,
        tabMenuContextTab,
        longPressThreshold,
        clearMetaLongPressTimer,
        clearAltLongPressTimer,
        clearCtrlLongPressTimer,
        setHelpMenuIsOpen,
        openOmniboxFromShortcut,
        setTabMenuIsOpen,
        setSystemMenuIsOpen,
        setSettingsPageIsOpen,
        setMetaLongPressTimer,
        setAltLongPressTimer,
        setCtrlLongPressTimer,
    } = ctx;

    if (
        ((event.key === "?" && noModifiersForHelpKey(event)) ||
            (event.key === "/" && noModifiersStrict(event))) &&
        isIdleForGlobalTabActions()
    ) {
        event.preventDefault();
        event.stopPropagation();
        setHelpMenuIsOpen(true);
        return true;
    }
    if (
        (event.key === "n" || event.key === "N") &&
        noModifiersStrict(event) &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen
    ) {
        event.preventDefault();
        event.stopPropagation();
        openOmniboxFromShortcut();
        return true;
    }
    if (
        (event.key === "a" ||
            event.key === "A" ||
            event.key === "m" ||
            event.key === "M") &&
        noModifiersStrict(event) &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        (ctx.isInNavigationMode ? ctx.getSelectedTab() : ctx.getCurrentTab())
    ) {
        event.preventDefault();
        event.stopPropagation();
        setTabMenuIsOpen(true);
        return true;
    }
    if (
        (event.key === "Meta" || event.key === "OS") &&
        !event.repeat &&
        !helpMenuIsOpen &&
        !tabMenuIsOpen &&
        !omniboxIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        tabMenuContextTab()
    ) {
        clearMetaLongPressTimer();
        setMetaLongPressTimer(
            setTimeout(() => {
                setMetaLongPressTimer(null);
                if (
                    ctx.getHelpMenuIsOpen() ||
                    ctx.getTabMenuIsOpen() ||
                    ctx.getOmniboxIsOpen() ||
                    ctx.getSystemMenuIsOpen() ||
                    ctx.getSettingsPageIsOpen()
                ) {
                    return;
                }
                if (!tabMenuContextTab()) return;
                setTabMenuIsOpen(true);
            }, longPressThreshold),
        );
        return true;
    }
    if (
        event.key === "Alt" &&
        !event.repeat &&
        !helpMenuIsOpen &&
        !tabMenuIsOpen &&
        !omniboxIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen
    ) {
        clearAltLongPressTimer();
        setAltLongPressTimer(
            setTimeout(() => {
                setAltLongPressTimer(null);
                if (
                    ctx.getHelpMenuIsOpen() ||
                    ctx.getTabMenuIsOpen() ||
                    ctx.getOmniboxIsOpen() ||
                    ctx.getSystemMenuIsOpen() ||
                    ctx.getSettingsPageIsOpen()
                ) {
                    return;
                }
                setSystemMenuIsOpen(true);
            }, longPressThreshold),
        );
        return true;
    }
    if (
        event.key === "Control" &&
        !event.repeat &&
        !helpMenuIsOpen &&
        !tabMenuIsOpen &&
        !omniboxIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen
    ) {
        clearCtrlLongPressTimer();
        setCtrlLongPressTimer(
            setTimeout(() => {
                setCtrlLongPressTimer(null);
                if (
                    ctx.getHelpMenuIsOpen() ||
                    ctx.getTabMenuIsOpen() ||
                    ctx.getOmniboxIsOpen() ||
                    ctx.getSystemMenuIsOpen() ||
                    ctx.getSettingsPageIsOpen()
                ) {
                    return;
                }
                setSettingsPageIsOpen(true);
            }, longPressThreshold),
        );
        return true;
    }
    return false;
}
