<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { fly } from "svelte/transition";
    import { cleanUrl } from "../../utils/cleanUrl.js";
    import { chromeService } from "../../services/chromeApi.js";
    import { appIdFromDomain } from "../../services/apps/appsModel.js";
    import {
        TIMEFRAME_LABEL,
        TIMEFRAMES_DISPLAY,
    } from "../../planner/plannerUiLabels.js";

    export let x = 0;
    export let y = 0;
    export let url = "";
    export let linkText = "";
    /** Current page hostname (content script tab), for save-to-app chip label */
    export let pageHostname = "";
    export let onClose = () => {};

    const dispatch = createEventDispatcher();

    /** @type {import('../../services/apps/appsModel.js').AppRecord[]} */
    let apps = [];
    let queueCount = 0;
    let panel = "main";
    let pointerInsideMenu = false;
    let selectedIndex = 0;

    /** @type {string | null} */
    let pageAppId = null;

    /** Ignore window click right after panel swap (mouseup lands outside menu). */
    let ignoreBackdropUntil = 0;

    function bumpBackdropIgnore() {
        ignoreBackdropUntil = Date.now() + 650;
    }

    /** Strip www. for display (hostname has no scheme). */
    function formatDisplayHost(host) {
        if (!host) return "—";
        const h = host.replace(/^www\./i, "");
        return h || host;
    }

    $: linkHostRaw = (() => {
        try {
            return new URL(url).hostname || "";
        } catch {
            return "";
        }
    })();

    $: linkDomain = formatDisplayHost(linkHostRaw) || url || "—";

    let faviconBroken = false;
    let wheelAccum = 0;
    const WHEEL_SELECT_THRESHOLD = 22;

    $: if (url) faviconBroken = false;

    $: faviconSrc =
        linkHostRaw && /^https?:\/\//i.test(url)
            ? `https://www.google.com/s2/favicons?sz=24&domain=${encodeURIComponent(
                  linkHostRaw.replace(/^www\./i, ""),
              )}`
            : "";

    $: showFavicon = Boolean(faviconSrc) && !faviconBroken;

    $: mainIds = (() => {
        const a = [
            "copyFull",
            "copyClean",
            "description",
            "preview",
            "tab",
            "window",
            "queue",
        ];
        if (pageAppId) a.push("saveDomain");
        a.push("pickTime");
        return a;
    })();

    $: pickTimeIds = ["back", ...TIMEFRAMES_DISPLAY.map((t) => `tf:${t}`)];

    $: activeOrder = panel === "main" ? mainIds : pickTimeIds;

    $: {
        const max = Math.max(0, activeOrder.length - 1);
        if (selectedIndex > max) selectedIndex = max;
        if (selectedIndex < 0) selectedIndex = 0;
    }

    function idxInMain(id) {
        return mainIds.indexOf(id);
    }

    function idxInPick(id) {
        return pickTimeIds.indexOf(id);
    }

    function isSelectedMain(id) {
        return panel === "main" && selectedIndex === idxInMain(id);
    }

    function isSelectedPick(id) {
        return panel === "pickTime" && selectedIndex === idxInPick(id);
    }

    function typingTarget(el) {
        if (!el || typeof el.matches !== "function") return false;
        if (el.matches("input, textarea, select")) return true;
        return !!el.isContentEditable;
    }

    function handleWheel(event) {
        if (pointerInsideMenu) return;
        if (event.target.closest(".link-ctx-menu")) return;
        event.preventDefault();
        event.stopPropagation();
        wheelAccum += event.deltaY;
        if (Math.abs(wheelAccum) < WHEEL_SELECT_THRESHOLD) return;
        const step = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;
        const max = activeOrder.length - 1;
        if (max < 0) return;
        selectedIndex = Math.max(0, Math.min(max, selectedIndex + step));
    }

    function handleKeydownCapture(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (panel !== "main") {
                panel = "main";
                selectedIndex = 0;
            } else {
                onClose();
            }
            return;
        }
        if (typingTarget(event.target)) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            const max = activeOrder.length - 1;
            if (max >= 0) selectedIndex = Math.min(max, selectedIndex + 1);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            selectedIndex = Math.max(0, selectedIndex - 1);
            return;
        }
        if (event.key === " " || event.key === "Enter") {
            if (pointerInsideMenu) return;
            event.preventDefault();
            event.stopPropagation();
            runActionId(activeOrder[selectedIndex]);
        }
    }

    async function copyFull() {
        try {
            await navigator.clipboard.writeText(url);
        } catch (e) {
            console.error(e);
        }
        onClose();
    }

    async function copyClean() {
        try {
            await navigator.clipboard.writeText(cleanUrl(url));
        } catch (e) {
            console.error(e);
        }
        onClose();
    }

    function runActionId(id) {
        if (!id) return;
        switch (id) {
            case "copyFull":
                void copyFull();
                break;
            case "copyClean":
                void copyClean();
                break;
            case "description":
                dispatch("description", { url, linkText });
                break;
            case "preview":
                dispatch("preview", { url });
                break;
            case "tab":
                dispatch("tab", { url });
                break;
            case "window":
                dispatch("window", { url });
                break;
            case "queue":
                dispatch("queue", { url, linkText });
                break;
            case "saveDomain":
                if (pageAppId) {
                    dispatch("saveApp", {
                        appId: pageAppId,
                        url,
                        linkText,
                    });
                }
                break;
            case "pickTime":
                bumpBackdropIgnore();
                setTimeout(() => {
                    panel = "pickTime";
                    selectedIndex = 0;
                }, 0);
                break;
            case "back":
                bumpBackdropIgnore();
                setTimeout(() => {
                    panel = "main";
                    selectedIndex = 0;
                }, 0);
                break;
            default:
                if (id.startsWith("tf:")) {
                    const tf = id.slice(3);
                    dispatch("plannerTime", { url, linkText, timeframe: tf });
                }
                break;
        }
    }

    async function refreshQueueCount() {
        try {
            const res = await chromeService.linkQueueGet();
            queueCount = Array.isArray(res?.urls) ? res.urls.length : 0;
        } catch {
            queueCount = 0;
        }
    }

    onMount(async () => {
        try {
            const state = await chromeService.appsGetState();
            apps = state.apps || [];
            const id = pageHostname ? appIdFromDomain(pageHostname) : null;
            pageAppId = id && apps.some((a) => a.id === id) ? id : null;
        } catch {
            apps = [];
            pageAppId = null;
        }
        await refreshQueueCount();
        document.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });
    });

    onDestroy(() => {
        document.removeEventListener("wheel", handleWheel, { capture: true });
        wheelAccum = 0;
    });

    function handleBackdropClick(e) {
        if (Date.now() < ignoreBackdropUntil) return;
        if (!e.target.closest(".link-ctx-menu")) onClose();
    }
</script>

<svelte:window
    on:keydown|capture={handleKeydownCapture}
    on:click={handleBackdropClick}
/>

<div
    class="link-ctx-menu"
    aria-label="Link actions"
    on:click|stopPropagation
    style={(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = 320;
        const maxH = Math.min(480, vh - 16);
        let left = Math.min(x, vw - w - 8);
        let top = Math.min(y, vh - maxH - 8);
        left = Math.max(8, left);
        top = Math.max(8, top);
        return `left:${left}px;top:${top}px;width:${w}px;max-height:${maxH}px`;
    })()}
    transition:fly={{ y: 8, duration: 140 }}
    on:mousedown|stopPropagation
    on:mouseenter={() => {
        pointerInsideMenu = true;
    }}
    on:mouseleave={() => {
        pointerInsideMenu = false;
    }}
>
    <div class="menu-header" title={url}>
        {#if showFavicon}
            <img
                class="menu-favicon"
                src={faviconSrc}
                alt=""
                width="18"
                height="18"
                loading="lazy"
                referrerpolicy="no-referrer"
                on:error={() => {
                    faviconBroken = true;
                }}
            />
        {/if}
        <span class="menu-header-domain">{linkDomain}</span>
    </div>

    {#if panel === "main"}
        <div class="section-head">
            <span class="section-title">Copy</span>
            <span class="section-rule" aria-hidden="true"></span>
        </div>
        <div class="chip-row">
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("copyFull")}
                data-chip-id="copyFull"
                on:click={() => {
                    selectedIndex = idxInMain("copyFull");
                    runActionId("copyFull");
                }}
            >
                Full link
            </button>
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("copyClean")}
                on:click={() => {
                    selectedIndex = idxInMain("copyClean");
                    runActionId("copyClean");
                }}
            >
                Clean link
            </button>
        </div>

        <div class="section-head">
            <span class="section-title">Open</span>
            <span class="section-rule" aria-hidden="true"></span>
        </div>
        <div class="chip-row">
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("description")}
                on:click={() => {
                    selectedIndex = idxInMain("description");
                    runActionId("description");
                }}
            >
                Description
            </button>
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("preview")}
                on:click={() => {
                    selectedIndex = idxInMain("preview");
                    runActionId("preview");
                }}
            >
                Preview
            </button>
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("tab")}
                on:click={() => {
                    selectedIndex = idxInMain("tab");
                    runActionId("tab");
                }}
            >
                Tab
            </button>
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("window")}
                on:click={() => {
                    selectedIndex = idxInMain("window");
                    runActionId("window");
                }}
            >
                Window
            </button>
        </div>

        <div class="section-head">
            <span class="section-title">Save to</span>
            <span class="section-rule" aria-hidden="true"></span>
        </div>
        <div class="chip-row">
            <button
                type="button"
                class="chip chip--queue"
                class:chip--selected={isSelectedMain("queue")}
                on:click={() => {
                    selectedIndex = idxInMain("queue");
                    runActionId("queue");
                }}
            >
                Queue
                {#if queueCount > 0}
                    <span class="queue-badge">{queueCount}</span>
                {/if}
            </button>
            {#if pageHostname}
                <button
                    type="button"
                    class="chip"
                    class:chip--selected={isSelectedMain("saveDomain")}
                    disabled={!pageAppId}
                    title={!pageAppId
                        ? "Open this site in Omnibox to create its app first"
                        : `Save to ${pageHostname}`}
                    on:click={() => {
                        if (!pageAppId) return;
                        selectedIndex = idxInMain("saveDomain");
                        runActionId("saveDomain");
                    }}
                >
                    {formatDisplayHost(pageHostname)}
                </button>
            {/if}
            <button
                type="button"
                class="chip"
                class:chip--selected={isSelectedMain("pickTime")}
                on:click={() => {
                    selectedIndex = idxInMain("pickTime");
                    runActionId("pickTime");
                }}
            >
                Time <span
                    class="material-symbols-rounded"
                    style="font-size: 14px;">arrow_forward_ios</span
                >
            </button>
        </div>
    {:else}
        <div class="section-head">
            <span class="section-title">Save for later</span>
            <span class="section-rule" aria-hidden="true"></span>
        </div>
        <div class="chip-row">
            {#each TIMEFRAMES_DISPLAY as tf (tf)}
                <button
                    type="button"
                    class="chip"
                    class:chip--selected={isSelectedPick(`tf:${tf}`)}
                    on:click={() => {
                        selectedIndex = idxInPick(`tf:${tf}`);
                        runActionId(`tf:${tf}`);
                    }}
                >
                    {TIMEFRAME_LABEL[tf]}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .link-ctx-menu {
        position: fixed;
        z-index: 999997;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 12px 14px;
        overflow-y: auto;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.97));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    }

    .menu-header {
        display: flex;
        align-items: center;
        gap: 0px;
        font-size: 13px;
        font-weight: 600;
        color: var(--st-text-primary, #f0f0f0);
        padding-bottom: 4px;
        word-break: break-all;
    }

    .menu-favicon {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.06);
    }

    .menu-header-domain {
        min-width: 0;
        flex: 1;
    }

    .section-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
    }

    .section-head:first-of-type {
        margin-top: 0;
    }

    .section-title {
        flex: 0 0 auto;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--st-text-muted, #888);
    }

    .section-rule {
        flex: 1 1 auto;
        min-width: 12px;
        height: 1px;
        background-color: #333333;
    }

    .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 4px;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0px 10px;
        height: 26px;
        font-size: 12px;
        color: var(--st-text-primary, #eee);
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        border: none;
        max-width: 100%;
        opacity: 0.72;
    }

    .chip:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        opacity: 0.92;
    }

    .chip:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .chip--selected {
        opacity: 1;
    }

    .chip--queue {
        position: relative;
    }

    .queue-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.1rem;
        height: 1.1rem;
        padding: 0 4px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 999px;
        background: rgba(255, 120, 80, 0.35);
        color: #fff;
    }
</style>
