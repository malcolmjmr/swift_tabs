<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../services/chromeApi";
    import {
        TIMEFRAME_LABEL,
        TIMEFRAMES_DISPLAY,
    } from "../../planner/plannerUiLabels.js";

    /** @type {chrome.tabs.Tab | null} */
    export let tab = null;
    /** @type {chrome.windows.Window[]} */
    export let windows = [];

    const dispatch = createEventDispatcher();

    /** @type {'root' | 'window' | 'space' | 'reading' | 'folder' | 'time'} */
    let view = "root";

    /** @type {Awaited<ReturnType<typeof chromeService.getTabGroups>>} */
    let tabGroups = [];

    function close() {
        dispatch("close");
    }

    function goRoot() {
        view = "root";
    }

    async function openView(v) {
        view = v;
        if (v === "space" && tab?.windowId != null) {
            try {
                const all = await chromeService.getTabGroups();
                tabGroups = (all || []).filter(
                    (g) => g.windowId === tab.windowId,
                );
            } catch {
                tabGroups = [];
            }
        }
    }

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

    function pickWindow(windowId) {
        dispatch("moveToWindow", { windowId });
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

    async function readingLater() {
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

    function pickFolderPlaceholder() {
        /* Bookmarks UI not wired — reserved for save-to-folder flow */
    }
</script>

<div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Move tab"
    on:click|self={close}
    on:keydown={(e) => {
        if (e.key === "Escape") {
            if (view !== "root") goRoot();
            else close();
        }
    }}
>
    <div class="menu">
        <div class="menu-header">
            <h3>
                {#if view === "root"}
                    Move tab
                {:else if view === "window"}
                    Window
                {:else if view === "space"}
                    Space
                {:else if view === "reading"}
                    Reading list
                {:else if view === "folder"}
                    Folder
                {:else}
                    Time
                {/if}
            </h3>
            <div class="menu-header-actions">
                {#if view !== "root"}
                    <button
                        type="button"
                        class="text-btn"
                        on:click={goRoot}>Back</button
                    >
                {/if}
                <button type="button" class="close-btn" on:click={close}
                    >✕</button
                >
            </div>
        </div>

        {#if view === "root"}
            <div class="menu-list">
                <button type="button" class="menu-item" on:click={onPopup}>
                    Popup
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    on:click={() => openView("window")}
                >
                    Window <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    on:click={() => openView("space")}
                >
                    Space <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    on:click={() => openView("reading")}
                >
                    Reading list <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    on:click={() => openView("folder")}
                >
                    Folder <span class="chev">›</span>
                </button>
                <button
                    type="button"
                    class="menu-item menu-item--sub"
                    on:click={() => openView("time")}
                >
                    Time <span class="chev">›</span>
                </button>
            </div>
        {:else if view === "window"}
            <div class="menu-list">
                {#each windows as w (w.id)}
                    {#if w.id !== tab?.windowId}
                        <button
                            type="button"
                            class="menu-item"
                            on:click={() => pickWindow(w.id)}
                        >
                            {w.title || `Window ${w.id}`}
                        </button>
                    {/if}
                {/each}
            </div>
        {:else if view === "space"}
            <div class="menu-list">
                {#if tabGroups.length === 0}
                    <p class="empty-hint">No tab groups in this window.</p>
                {:else}
                    {#each tabGroups as g (g.id)}
                        <button
                            type="button"
                            class="menu-item"
                            on:click={() => pickGroup(g)}
                        >
                            {g.title || "Untitled group"}
                        </button>
                    {/each}
                {/if}
            </div>
        {:else if view === "reading"}
            <div class="menu-list">
                <button type="button" class="menu-item" on:click={readingLater}>
                    Add to link queue
                </button>
            </div>
        {:else if view === "folder"}
            <div class="menu-list">
                <button
                    type="button"
                    class="menu-item"
                    disabled
                    on:click={pickFolderPlaceholder}
                >
                    Save to bookmarks (soon)
                </button>
            </div>
        {:else}
            <div class="menu-list">
                {#each TIMEFRAMES_DISPLAY as tf (tf)}
                    <button
                        type="button"
                        class="menu-item"
                        on:click={() => pickTime(tf)}
                    >
                        {TIMEFRAME_LABEL[tf]}
                    </button>
                {/each}
            </div>
        {/if}
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
        background: var(--st-bg-primary, #fff);
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 12px;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        gap: 8px;
        flex-shrink: 0;
    }

    .menu-header h3 {
        margin: 0;
        font-size: 14px;
        color: var(--st-text-primary, #111);
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
        color: #666;
    }

    .close-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 16px;
        color: #666;
    }

    .menu-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: auto;
        min-height: 0;
    }

    .menu-item {
        width: 100%;
        text-align: left;
        padding: 8px 10px;
        border: none;
        border-radius: 6px;
        background: #f2f2f2;
        cursor: pointer;
        font-size: 14px;
        color: #111;
    }

    .menu-item:hover:not(:disabled) {
        background: #e6e6e6;
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

    .chev {
        opacity: 0.5;
        font-size: 16px;
    }

    .empty-hint {
        margin: 8px 4px;
        font-size: 13px;
        color: #666;
    }
</style>
