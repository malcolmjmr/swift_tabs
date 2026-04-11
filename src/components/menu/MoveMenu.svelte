<script>
    import { createEventDispatcher, onMount, onDestroy, tick } from "svelte";
    import { chromeService } from "../../services/chromeApi";
    import {
        registerTabMenuWheelSelect,
        unregisterTabMenuWheelSelect,
    } from "../../app/gestures/tabNavigationScroll.js";
    import {
        appIdFromDomain,
        normalizeDomain,
    } from "../../services/apps/appsModel.js";
    import windowIcon from "../../icons/select-window-2.svg";
    import linkQueueIcon from "../../icons/queue.svg";
    import folderIcon from "../../icons/folder.svg";
    import collectionIcon from "../../icons/database.svg";
    import timeIcon from "../../icons/schedule.svg";
    import popupIcon from "../../icons/float-landscape.svg";
    import tabbedIcon from "../../icons/tab.svg";
    import incognitoIcon from "../../icons/domino-mask.svg";
    import readingListIcon from "../../icons/library-books.svg";
    import appIcon from "../../icons/apps.svg";
    import bookmarkIcon from "../../icons/bookmark.svg";
    import fileIcon from "../../icons/folder.svg";

    /** @type {chrome.tabs.Tab | null} */
    export let tab = null;
    export let selectedTabs = [];

    const dispatch = createEventDispatcher();

    /** Same threshold as TabMenu (settings.scrollVerticalThreshold). */
    const SCROLL_SELECT_THRESHOLD = 33;

    /** @typedef {import('../../planner/objectiveTypes.js').Timeframe} Timeframe */

    /** Labels shown in Time submenu; maps to planner timeframes (Tomorrow → week backlog). */
    const MOVE_TIME_OPTIONS = /** @type {const} */ ([
        { label: "Today", tf: /** @type {Timeframe} */ ("today") },
        { label: "Tomorrow", tf: "week" },
        { label: "This Week", tf: "week" },
        { label: "This Month", tf: "month" },
        { label: "This Year", tf: "year" },
        { label: "Other", tf: "decade" },
    ]);

    /** @type {'root' | 'window' | 'queue' | 'folder' | 'collection' | 'time'} */
    let view = "root";

    /** @type {Awaited<ReturnType<typeof chromeService.getTabGroups>>} */
    let tabGroups = [];

    let menuPanelEl = null;
    let listEl = null;
    let selectedIndex = 0;
    let scrollSelectDelta = 0;

    function close() {
        // close tab
        chromeService.closeTab(tab.id);
    }

    function goRoot() {
        view = "root";
        selectedIndex = 0;
        scrollSelectDelta = 0;
    }

    async function openView(/** @type {typeof view} */ v) {
        view = v;
        selectedIndex = 0;
        scrollSelectDelta = 0;
        if (v === "collection" && tab?.windowId != null) {
            try {
                const all = await chromeService.getTabGroups();
                tabGroups = (all || []).filter(
                    (g) => g.windowId === tab.windowId,
                );
            } catch {
                tabGroups = [];
            }
        }
        await tick();
        scrollSelectedIntoView();
    }

    function maxSelectableIndex() {
        switch (view) {
            case "root":
                return 4;
            case "window":
                return 2;
            case "queue":
                return 1;
            case "folder":
                return -1;
            case "collection":
                return tabGroups.length > 0 ? tabGroups.length - 1 : -1;
            case "time":
                return MOVE_TIME_OPTIONS.length - 1;
            default:
                return -1;
        }
    }

    $: maxIx = maxSelectableIndex();
    $: sel = maxIx < 0 ? -1 : Math.min(Math.max(0, selectedIndex), maxIx);

    function scrollSelectedIntoView() {
        if (!listEl || sel < 0) return;
        const el = listEl.querySelector(`[data-move-select="${sel}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function handleScrollSelect(deltaPx) {
        if (maxIx < 0) return;
        scrollSelectDelta += deltaPx;
        if (Math.abs(scrollSelectDelta) < SCROLL_SELECT_THRESHOLD) return;
        const step = scrollSelectDelta > 0 ? -1 : 1;
        scrollSelectDelta = 0;
        selectedIndex = Math.max(0, Math.min(maxIx, selectedIndex + step));
        scrollSelectedIntoView();
    }

    onMount(() => {
        registerTabMenuWheelSelect(handleScrollSelect);
        queueMicrotask(() => menuPanelEl?.focus());
    });

    onDestroy(() => {
        unregisterTabMenuWheelSelect();
    });

    async function onPopup() {
        if (!tab?.id) return;
        try {
            await chromeService.createWindowWithTab(tab.id, { asPopup: true });
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function onTabbed() {
        if (!tab?.id) return;
        try {
            await chromeService.createWindowWithTab(tab.id, {
                asPopup: false,
            });
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function onIncognito() {
        if (!tab?.id) return;
        try {
            await chromeService.createWindowWithTab(tab.id, {
                incognito: true,
            });
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function pickGroup(g) {
        if (!tab?.id || g?.id == null) return;
        try {
            await chromeService.addTabToGroup(tab.id, g.id);
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function linkQueueReading() {
        if (!tab?.id) return;
        const url = tab.url || "";
        const title = tab.title || "";
        try {
            await chromeService.linkQueuePush(url, title);
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function linkQueueApp() {
        if (!tab?.id || !tab.url) return;
        const url = tab.url;
        if (!/^https?:\/\//i.test(url)) return;
        let host = "";
        try {
            host = new URL(url).hostname;
        } catch {
            return;
        }
        const domain = normalizeDomain(host);
        if (!domain) return;
        const id = appIdFromDomain(domain);
        try {
            const state = await chromeService.appsGetState();
            const app = (state.apps || []).find((a) => a.id === id);
            const links = [...(app?.savedLinks || [])];
            links.push({
                id: `lnk_${Date.now().toString(36)}`,
                url,
                title: tab.title || "",
                savedAt: Date.now(),
            });
            await chromeService.appsPutApp({
                id,
                domain,
                defaultUrl: url.replace(/#.*$/, ""),
                title: app?.title || tab.title || domain,
                savedLinks: links,
            });
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function pickTime(tf) {
        if (!tab?.id) return;
        const url = tab.url || "";
        const title = tab.title || "";
        try {
            await chromeService.plannerBacklogAddLink(url, title, tf);
            dispatch("moved");
            close();
        } catch (e) {
            console.error(e);
        }
    }

    async function activateSelection() {
        if (sel < 0) return;
        switch (view) {
            case "root":
                if (sel === 0) await openView("window");
                else if (sel === 1) await openView("queue");
                else if (sel === 2) await openView("folder");
                else if (sel === 3) await openView("collection");
                else await openView("time");
                break;
            case "window":
                if (sel === 0) await onPopup();
                else if (sel === 1) await onTabbed();
                else await onIncognito();
                break;
            case "queue":
                if (sel === 0) await linkQueueReading();
                else await linkQueueApp();
                break;
            case "folder":
                break;
            case "collection": {
                const g = tabGroups[sel];
                if (g) await pickGroup(g);
                break;
            }
            case "time": {
                const opt = MOVE_TIME_OPTIONS[sel];
                if (opt) await pickTime(opt.tf);
                break;
            }
            default:
                break;
        }
    }

    function onKeydown(/** @type {KeyboardEvent} */ e) {
        if (e.key === "Escape") {
            if (view !== "root") {
                e.preventDefault();
                goRoot();
            } else close();
            return;
        }
        if (maxIx < 0) return;
        if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = Math.max(0, selectedIndex - 1);
            scrollSelectedIntoView();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = Math.min(maxIx, selectedIndex + 1);
            scrollSelectedIntoView();
            return;
        }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void activateSelection();
        }
    }

    $: viewTitle =
        view === "root"
            ? "Move tab"
            : view === "window"
              ? "Window"
              : view === "queue"
                ? "Link Queue"
                : view === "folder"
                  ? "Folder"
                  : view === "collection"
                    ? "Collection"
                    : "Time";
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="overlay" role="presentation" on:click|self={close}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        class="menu"
        bind:this={menuPanelEl}
        role="dialog"
        aria-modal="true"
        aria-label="Move tab"
        on:click|stopPropagation
        on:pointerdown|stopPropagation
        on:keydown={onKeydown}
    >
        <div class="menu-header">
            <h2>{viewTitle}</h2>
            <div class="menu-header-actions">
                {#if view !== "root"}
                    <button type="button" class="text-btn" on:click={goRoot}
                        >Back</button
                    >
                {/if}
            </div>
        </div>

        <div class="menu-list" bind:this={listEl} role="menu">
            {#if view === "root"}
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    class:menu-item--active={sel === 0}
                    data-move-select="0"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 0;
                        openView("window");
                    }}
                    on:pointerenter={() => (selectedIndex = 0)}
                >
                    <img class="menu-item-icon" src={windowIcon} alt="Window" />
                    <span class="menu-item-title"> Window </span>
                    <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    class:menu-item--active={sel === 1}
                    data-move-select="1"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 1;
                        openView("queue");
                    }}
                    on:pointerenter={() => (selectedIndex = 1)}
                >
                    <img
                        class="menu-item-icon"
                        src={linkQueueIcon}
                        alt="Link Queue"
                    /> <span class="menu-item-title"> Link Queue </span>
                    <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    class:menu-item--active={sel === 2}
                    data-move-select="2"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 2;
                        openView("folder");
                    }}
                    on:pointerenter={() => (selectedIndex = 2)}
                >
                    <img class="menu-item-icon" src={folderIcon} alt="Folder" />
                    <span class="menu-item-title"> Folder </span>
                    <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    class:menu-item--active={sel === 3}
                    data-move-select="3"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 3;
                        openView("collection");
                    }}
                    on:pointerenter={() => (selectedIndex = 3)}
                >
                    <img
                        class="menu-item-icon"
                        src={collectionIcon}
                        alt="Collection"
                    /> <span class="menu-item-title"> Collection </span>
                    <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    class:menu-item--active={sel === 4}
                    data-move-select="4"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 4;
                        openView("time");
                    }}
                    on:pointerenter={() => (selectedIndex = 4)}
                >
                    <img class="menu-item-icon" src={timeIcon} alt="Time" />
                    <span class="menu-item-title"> Time </span>
                    <span class="chev">›</span>
                </button>
            {:else if view === "window"}
                <button
                    type="button"
                    class="menu-item"
                    class:menu-item--active={sel === 0}
                    data-move-select="0"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 0;
                        onPopup();
                    }}
                    on:pointerenter={() => (selectedIndex = 0)}
                >
                    <img class="menu-item-icon" src={popupIcon} alt="Popup" />
                    <span class="menu-item-title"> Popup </span>
                </button>
                <button
                    type="button"
                    class="menu-item"
                    class:menu-item--active={sel === 1}
                    data-move-select="1"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 1;
                        onTabbed();
                    }}
                    on:pointerenter={() => (selectedIndex = 1)}
                >
                    <img class="menu-item-icon" src={tabbedIcon} alt="Tabbed" />
                    <span class="menu-item-title"> Tabbed </span>
                </button>
                <button
                    type="button"
                    class="menu-item"
                    class:menu-item--active={sel === 2}
                    data-move-select="2"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 2;
                        onIncognito();
                    }}
                    on:pointerenter={() => (selectedIndex = 2)}
                >
                    <img
                        class="menu-item-icon"
                        src={incognitoIcon}
                        alt="Incognito"
                    /> <span class="menu-item-title"> Incognito </span>
                </button>
            {:else if view === "queue"}
                <button
                    type="button"
                    class="menu-item"
                    class:menu-item--active={sel === 0}
                    data-move-select="0"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 0;
                        linkQueueReading();
                    }}
                    on:pointerenter={() => (selectedIndex = 0)}
                >
                    <img
                        class="menu-item-icon"
                        src={readingListIcon}
                        alt="Reading list"
                    /> <span class="menu-item-title"> Reading list </span>
                </button>
                <button
                    type="button"
                    class="menu-item"
                    class:menu-item--active={sel === 1}
                    data-move-select="1"
                    role="menuitem"
                    on:click={() => {
                        selectedIndex = 1;
                        linkQueueApp();
                    }}
                    on:pointerenter={() => (selectedIndex = 1)}
                >
                    <img class="menu-item-icon" src={appIcon} alt="App" />
                    <span class="menu-item-title"> App </span>
                </button>
            {:else if view === "folder"}
                <button
                    type="button"
                    class="menu-item"
                    role="menuitem"
                    disabled
                >
                    <img
                        class="menu-item-icon"
                        src={bookmarkIcon}
                        alt="Bookmarks"
                    /> <span class="menu-item-title"> Bookmarks </span>
                </button>
                <button
                    type="button"
                    class="menu-item"
                    role="menuitem"
                    disabled
                >
                    <img class="menu-item-icon" src={fileIcon} alt="Files" />
                    <span class="menu-item-title"> Files </span>
                </button>
            {:else if view === "collection"}
                {#if tabGroups.length === 0}
                    <p class="empty-hint">No tab groups in this window.</p>
                {:else}
                    {#each tabGroups as g, gi (g.id)}
                        <button
                            type="button"
                            class="menu-item"
                            class:menu-item--active={sel === gi}
                            data-move-select={gi}
                            role="menuitem"
                            on:click={() => {
                                selectedIndex = gi;
                                pickGroup(g);
                            }}
                            on:pointerenter={() => (selectedIndex = gi)}
                        >
                            {g.title || "Untitled group"}
                        </button>
                    {/each}
                {/if}
            {:else}
                {#each MOVE_TIME_OPTIONS as opt, ti (opt.label)}
                    <button
                        type="button"
                        class="menu-item"
                        class:menu-item--active={sel === ti}
                        data-move-select={ti}
                        role="menuitem"
                        on:click={() => {
                            selectedIndex = ti;
                            pickTime(opt.tf);
                        }}
                        on:pointerenter={() => (selectedIndex = ti)}
                    >
                        {opt.label}
                    </button>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
    }

    .menu {
        width: 280px;
        max-height: min(420px, 80vh);
        display: flex;
        flex-direction: column;
        min-height: 0;
        box-sizing: border-box;
        padding: 12px;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;

        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        padding-bottom: 8px;
    }

    .menu-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
    }

    .menu-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .text-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: var(--st-text-muted, #888);
    }

    .text-btn:hover {
        color: var(--st-text-primary, #fff);
    }

    .close-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 16px;
        color: var(--st-text-muted, #888);
    }

    .close-btn:hover {
        color: var(--st-text-primary, #fff);
    }

    .menu-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: auto;
        min-height: 0;
        scrollbar-width: thin;
    }

    .menu-item {
        width: 100%;
        text-align: left;
        padding: 8px 10px;
        border: none;
        border-radius: 12px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        cursor: pointer;
        font-size: 14px;
        color: var(--st-text-primary, #eee);
    }

    .menu-item:hover:not(:disabled) {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.14));
    }

    .menu-item:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .menu-item--sub {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .menu-item--active:not(:disabled) {
        background-color: #333;
    }

    .chev {
        opacity: 0.5;
        font-size: 16px;
    }

    .empty-hint {
        margin: 8px 4px;
        font-size: 13px;
        color: var(--st-text-muted, #888);
    }
</style>
