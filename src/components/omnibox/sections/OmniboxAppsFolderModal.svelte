<script>
    import { getResultFaviconSrc, getResultIcon } from "../omniboxShared.js";

    export let open = false;
    /** @type {object | null} */
    export let rootFolder = null;
    /** @type {Record<string, object>} */
    export let appsRegistryById = {};
    /** @type {Record<string, boolean>} */
    export let faviconFailedByKey = {};

    /** @param {object} app @returns {void | Promise<void>} */
    export let onLaunchApp = () => {};
    export let onClose = () => {};
    /** @param {string} folderId */
    export let onFolderSettings = null;
    /** @param {object} item */
    export let onFaviconError = () => {};

    /** @type {{ id: string, title: string, items: object[] }[]} */
    let stack = [];
    let wasOpen = false;

    $: if (open && rootFolder) {
        if (!wasOpen) {
            stack = [
                {
                    id: rootFolder.id,
                    title: rootFolder.title || "",
                    items: JSON.parse(JSON.stringify(rootFolder.items || [])),
                },
            ];
        }
        wasOpen = true;
    } else {
        wasOpen = false;
        stack = [];
    }

    $: top = stack.length > 0 ? stack[stack.length - 1] : null;

    /** @param {object} layoutFolder */
    function pushFolder(layoutFolder) {
        stack = [
            ...stack,
            {
                id: layoutFolder.id,
                title: layoutFolder.title || "",
                items: JSON.parse(JSON.stringify(layoutFolder.items || [])),
            },
        ];
    }

    function popFolder() {
        if (stack.length <= 1) {
            onClose();
            return;
        }
        stack = stack.slice(0, -1);
    }

    function onBackdropPointerDown(e) {
        if (e.target === e.currentTarget) onClose();
    }

    /** @param {KeyboardEvent} e */
    function onDialogKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            popFolder();
        }
    }

    /** @param {object} app */
    function stubAppRow(app) {
        return { type: "stApp", app };
    }
</script>

{#if open && top}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="folder-modal-backdrop"
        role="presentation"
        on:pointerdown={onBackdropPointerDown}
    >
        <div
            class="folder-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="folder-modal-title"
            on:pointerdown|stopPropagation
            on:keydown={onDialogKeydown}
        >
            <header class="folder-modal-header">
                {#if stack.length > 1}
                    <button
                        type="button"
                        class="folder-modal-icon-btn"
                        aria-label="Back"
                        on:click={popFolder}
                    >
                        <span class="material-symbols-rounded">arrow_back</span>
                    </button>
                {:else}
                    <span class="folder-modal-header-spacer" />
                {/if}
                <h2 id="folder-modal-title" class="folder-modal-title">
                    {top.title}
                </h2>
                {#if onFolderSettings}
                    <button
                        type="button"
                        class="folder-modal-icon-btn"
                        aria-label="Folder access and routines"
                        on:click={() => onFolderSettings(top.id)}
                    >
                        <span class="material-symbols-rounded">settings</span>
                    </button>
                {/if}
                <button
                    type="button"
                    class="folder-modal-icon-btn"
                    aria-label="Close"
                    on:click={() => onClose()}
                >
                    <span class="material-symbols-rounded">close</span>
                </button>
            </header>
            <div class="folder-modal-body">
                <div class="folder-modal-flow">
                    {#each top.items || [] as node (node.kind === "app" ? `a-${node.appId}` : `f-${node.id}`)}
                        {#if node.kind === "app"}
                            {@const app = appsRegistryById[node.appId]}
                            {#if app}
                                {@const faviconUrl = getResultFaviconSrc(
                                    stubAppRow(app),
                                    faviconFailedByKey,
                                )}
                                <button
                                    type="button"
                                    class="folder-modal-tile"
                                    on:click={() =>
                                        void Promise.resolve(onLaunchApp(app))}
                                >
                                    {#if faviconUrl}
                                        <img
                                            class="folder-modal-tile-img"
                                            src={faviconUrl}
                                            alt=""
                                            on:error={() =>
                                                onFaviconError(stubAppRow(app))}
                                        />
                                    {:else}
                                        <span
                                            class="material-symbols-rounded folder-modal-tile-glyph"
                                        >
                                            {getResultIcon(stubAppRow(app))}
                                        </span>
                                    {/if}
                                    <span class="folder-modal-tile-label"
                                        >{app.displayTitle ||
                                            app.title ||
                                            app.domain}</span
                                    >
                                </button>
                            {/if}
                        {:else if node.kind === "folder"}
                            <button
                                type="button"
                                class="folder-modal-tile folder-modal-tile--subfolder"
                                on:click={() => pushFolder(node)}
                            >
                                <span
                                    class="material-symbols-rounded folder-modal-tile-glyph"
                                    >folder</span
                                >
                                <span class="folder-modal-tile-label"
                                    >{node.title || ""}</span
                                >
                            </button>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .folder-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
    }

    .folder-modal-dialog {
        display: flex;
        flex-direction: column;
        width: min(360px, 100%);
        max-height: min(72vh, 520px);
        border-radius: 16px;
        background: var(--st-bg-primary, #1a1a1a);
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .folder-modal-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        padding: 10px 10px 10px 6px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .folder-modal-header-spacer {
        width: 40px;
        flex-shrink: 0;
    }

    .folder-modal-title {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .folder-modal-icon-btn {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--st-text-primary, #fff);
        cursor: pointer;
        font-family: inherit;
    }

    .folder-modal-icon-btn:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .folder-modal-icon-btn .material-symbols-rounded {
        font-size: 22px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
    }

    .folder-modal-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 14px 12px 16px;
        -webkit-overflow-scrolling: touch;
    }

    .folder-modal-flow {
        display: flex;
        flex-flow: row wrap;
        align-content: flex-start;
        justify-content: flex-start;
        gap: 16px 14px;
    }

    .folder-modal-tile {
        box-sizing: border-box;
        width: 76px;
        min-height: 88px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 6px;
        padding: 10px 4px 8px;
        border: none;
        border-radius: 14px;
        background: #222;
        cursor: pointer;
        color: var(--st-text-primary, #fff);
        font-family: inherit;
        transition: background 0.12s;
    }

    .folder-modal-tile:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .folder-modal-tile-img {
        width: 30px;
        height: 30px;
        border-radius: 5px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .folder-modal-tile-glyph {
        font-size: 32px;
        line-height: 1;
        color: var(--st-text-muted, #aaa);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 40;
    }

    .folder-modal-tile-label {
        font-size: 10px;
        line-height: 1.25;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        word-break: break-word;
        color: var(--st-text-primary, #eee);
    }
</style>
