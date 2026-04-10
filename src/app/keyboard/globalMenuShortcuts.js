import {
    isInTypingContext,
    noModifiersForHelpKey,
    noModifiersStrict,
} from "../domUtils.js";

/**
 * Help, omnibox open; Alt/Ctrl long-press → system/settings. Tab menu opens only in navigation mode (Meta release in App).
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {boolean} true if handled
 */
export function tryGlobalMenuShortcuts(event, ctx) {
    if (isInTypingContext()) return false;
    const {
        isIdleForGlobalTabActions,
        omniboxIsOpen,
        tabMenuIsOpen,
        helpMenuIsOpen,
        systemMenuIsOpen,
        settingsPageIsOpen,
        longPressThreshold,
        clearAltLongPressTimer,
        clearCtrlLongPressTimer,
        setHelpMenuIsOpen,
        setSystemMenuIsOpen,
        setSettingsPageIsOpen,
        setAltLongPressTimer,
        setCtrlLongPressTimer,
        getMoveMenuOpen,
        getShowActiveTabAddress,
        clearNLongPressTimer,
        setNLongPressTimer,
        setNLongPressFired,
        setNArm,
        chromeService,
        tabStore,
        fetchTabInfo,
    } = ctx;

    const blockingOverlay =
        getMoveMenuOpen?.() ||
        getShowActiveTabAddress?.();

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
        !event.repeat &&
        !omniboxIsOpen &&
        !tabMenuIsOpen &&
        !helpMenuIsOpen &&
        !systemMenuIsOpen &&
        !settingsPageIsOpen &&
        !blockingOverlay
    ) {
        event.preventDefault();
        event.stopPropagation();
        clearNLongPressTimer();
        setNLongPressFired(false);
        setNArm(true);
        setNLongPressTimer(
            setTimeout(() => {
                setNLongPressTimer(null);
                setNLongPressFired(true);
                void (async () => {
                    await chromeService.createTab({
                        url: "chrome://newtab/",
                        active: true,
                    });
                    await tabStore.refreshState();
                    await fetchTabInfo();
                })();
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
        !settingsPageIsOpen &&
        !blockingOverlay
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
        !settingsPageIsOpen &&
        !blockingOverlay
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
