<script>
    import LinkContextMenu from "../link/LinkContextMenu.svelte";
    import LinkPreviewOverlay from "../link/LinkPreviewOverlay.svelte";
    import LinkDescriptionModal from "../link/LinkDescriptionModal.svelte";
    import { chromeService } from "../../services/chromeApi";
    import { summarizeLink } from "../../services/geminiClient.js";
    import { isHttpLinkFromEventTarget } from "../../app/linkDom.js";
    import { LINK_CONTEXT_TAB_DEFER_MS } from "../../app/constants.js";

    /** @type {number} */
    export let longPressThreshold = 500;
    export let copyImageWithMetaKey = false;
    export let tabMenuIsOpen = false;
    export let helpMenuIsOpen = false;
    export let systemMenuIsOpen = false;
    export let settingsPageIsOpen = false;

    let linkMenuOpen = false;
    let linkMenuX = 0;
    let linkMenuY = 0;
    let linkMenuUrl = "";
    let linkMenuText = "";
    /** @type {string | null} */
    let linkPreviewUrl = null;
    let linkDescriptionOpen = false;
    let linkDescriptionBody = "";
    let linkDescriptionLoading = false;
    let linkDescriptionError = "";
    let linkSuppressNextLinkContext = false;
    /** @type {{ url: string, linkText: string, startX: number, startY: number } | null} */
    let linkRightPressPending = null;

    let rightClickTimer;

    /** @returns {boolean} true if parent should not run further mousedown handling */
    export function consumeSecondaryDownForLink(event) {
        if (event.button !== 2) return false;
        const a = isHttpLinkFromEventTarget(event.target);
        if (
            !a ||
            tabMenuIsOpen ||
            helpMenuIsOpen ||
            linkMenuOpen ||
            linkPreviewUrl ||
            linkDescriptionOpen ||
            systemMenuIsOpen ||
            settingsPageIsOpen
        ) {
            return false;
        }
        clearTimeout(rightClickTimer);
        rightClickTimer = null;
        linkRightPressPending = {
            url: a.href,
            linkText: (a.textContent || "").trim().slice(0, 500),
            startX: event.clientX,
            startY: event.clientY,
        };
        rightClickTimer = setTimeout(() => {
            rightClickTimer = null;
            if (!linkRightPressPending) return;
            linkSuppressNextLinkContext = true;
            linkMenuX = linkRightPressPending.startX;
            linkMenuY = linkRightPressPending.startY;
            linkMenuUrl = linkRightPressPending.url;
            linkMenuText = linkRightPressPending.linkText;
            linkRightPressPending = null;
            linkMenuOpen = true;
        }, longPressThreshold);
        return true;
    }

    export function onMouseMoveForLink(event) {
        if (linkRightPressPending && event.buttons & 2) {
            const dx = event.clientX - linkRightPressPending.startX;
            const dy = event.clientY - linkRightPressPending.startY;
            if (dx * dx + dy * dy > 14 * 14) {
                clearTimeout(rightClickTimer);
                rightClickTimer = null;
                linkRightPressPending = null;
            }
        }
    }

    export function onMouseUpForLink(event) {
        if (event.button === 2) {
            clearTimeout(rightClickTimer);
            rightClickTimer = null;
            if (!linkMenuOpen) linkRightPressPending = null;
        }
    }

    export function blocksContextCapture() {
        return !!(linkMenuOpen || linkPreviewUrl || linkDescriptionOpen);
    }

    export function dismissAll() {
        linkMenuOpen = false;
        linkPreviewUrl = null;
        linkDescriptionOpen = false;
        linkDescriptionError = "";
        linkDescriptionBody = "";
    }

    export function isDescriptionOpen() {
        return linkDescriptionOpen;
    }
    export function isPreviewOpen() {
        return linkPreviewUrl != null;
    }
    export function isMenuOpen() {
        return linkMenuOpen;
    }
    export function anyLinkOverlayOpen() {
        return linkMenuOpen || linkPreviewUrl != null || linkDescriptionOpen;
    }
    export function closeDescriptionForEscape() {
        linkDescriptionOpen = false;
        linkDescriptionError = "";
        linkDescriptionBody = "";
    }
    export function closePreviewForEscape() {
        linkPreviewUrl = null;
    }
    export function closeMenuForEscape() {
        linkMenuOpen = false;
    }

    export function handleRightClick(event) {
        const textIsSelected = window.getSelection().toString().length > 0;
        const isMetaKeyPressed = event.metaKey;

        if (textIsSelected) {
            if (isMetaKeyPressed) {
                console.log("queue search");
                event.preventDefault();
            }
            return;
        }

        const link = event.target.closest("a");
        if (link?.href) {
            const url = link.href;
            if (url.startsWith("http://") || url.startsWith("https://")) {
                if (linkMenuOpen || linkSuppressNextLinkContext) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (linkSuppressNextLinkContext) {
                        linkSuppressNextLinkContext = false;
                    }
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                const tabUrl = url;
                setTimeout(() => {
                    if (linkMenuOpen || linkSuppressNextLinkContext) return;
                    void chromeService.createTab({
                        url: tabUrl,
                        active: false,
                    });
                }, LINK_CONTEXT_TAB_DEFER_MS);
            }
            return;
        }

        const imageClicked = event.target.tagName === "IMG";
        if (imageClicked) {
            if (copyImageWithMetaKey == isMetaKeyPressed) {
                console.log("copy image");
                event.preventDefault();
            }
            return;
        }
    }

    async function onLinkMenuDescription() {
        linkMenuOpen = false;
        linkDescriptionOpen = true;
        linkDescriptionLoading = true;
        linkDescriptionError = "";
        linkDescriptionBody = "";
        try {
            linkDescriptionBody = await summarizeLink({
                url: linkMenuUrl,
                linkText: linkMenuText,
            });
        } catch (e) {
            linkDescriptionError = e?.message || String(e);
        } finally {
            linkDescriptionLoading = false;
        }
    }

    function onLinkMenuPreview() {
        linkPreviewUrl = linkMenuUrl;
        linkMenuOpen = false;
    }

    async function onLinkMenuOpenTab() {
        await chromeService.createTab({ url: linkMenuUrl, active: true });
        linkMenuOpen = false;
    }

    async function onLinkMenuOpenWindow() {
        await chromeService.createWindowWithUrl(linkMenuUrl, {
            focused: true,
        });
        linkMenuOpen = false;
    }

    async function onLinkMenuSaveQueue() {
        try {
            await chromeService.linkQueuePush(linkMenuUrl, linkMenuText);
        } catch (e) {
            console.error("linkQueuePush", e);
        }
        linkMenuOpen = false;
    }

    async function onLinkMenuSaveApp(/** @type {CustomEvent} */ e) {
        const { appId, url, linkText } = e.detail || {};
        if (!appId || !url) {
            linkMenuOpen = false;
            return;
        }
        try {
            const state = await chromeService.appsGetState();
            const app = (state.apps || []).find((a) => a.id === appId);
            if (!app) {
                linkMenuOpen = false;
                return;
            }
            const links = [...(app.savedLinks || [])];
            links.push({
                id: `lnk_${Date.now().toString(36)}`,
                url,
                title: linkText || "",
                savedAt: Date.now(),
            });
            await chromeService.appsPutApp({ id: appId, savedLinks: links });
        } catch (err) {
            console.error("onLinkMenuSaveApp", err);
        }
        linkMenuOpen = false;
    }

    async function onLinkMenuPlannerTime(/** @type {CustomEvent} */ e) {
        const { url, linkText, timeframe } = e.detail || {};
        if (!url || !timeframe) {
            linkMenuOpen = false;
            return;
        }
        try {
            await chromeService.plannerBacklogAddLink(
                url,
                linkText || "",
                timeframe,
            );
        } catch (err) {
            console.error("onLinkMenuPlannerTime", err);
        }
        linkMenuOpen = false;
    }
</script>

{#if linkMenuOpen}
    <LinkContextMenu
        x={linkMenuX}
        y={linkMenuY}
        url={linkMenuUrl}
        linkText={linkMenuText}
        pageHostname={typeof location !== "undefined" ? location.hostname : ""}
        onClose={() => {
            linkMenuOpen = false;
        }}
        on:description={onLinkMenuDescription}
        on:preview={onLinkMenuPreview}
        on:tab={onLinkMenuOpenTab}
        on:window={onLinkMenuOpenWindow}
        on:queue={onLinkMenuSaveQueue}
        on:saveApp={onLinkMenuSaveApp}
        on:plannerTime={onLinkMenuPlannerTime}
    />
{/if}
{#if linkPreviewUrl}
    <LinkPreviewOverlay
        url={linkPreviewUrl}
        onClose={() => {
            linkPreviewUrl = null;
        }}
    />
{/if}
{#if linkDescriptionOpen}
    <LinkDescriptionModal
        text={linkDescriptionBody}
        loading={linkDescriptionLoading}
        errorMessage={linkDescriptionError}
        onClose={() => {
            linkDescriptionOpen = false;
            linkDescriptionError = "";
            linkDescriptionBody = "";
        }}
    />
{/if}
