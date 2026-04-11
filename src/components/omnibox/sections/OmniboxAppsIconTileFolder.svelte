<script>
    import { getResultFaviconSrc } from "../omniboxShared.js";

    /** @type {number} */
    export let i;
    /** @type {object} */
    export let item;
    /** @type {string} */
    export let tileUid = "";
    /** @type {string} */
    export let tileTitle = "";
    /** @type {object[]} */
    export let previewApps = [];
    export let selected = false;
    export let swift = false;
    /** @type {Record<string, boolean>} */
    export let faviconFailedByKey = {};

    /** @param {number} idx @param {object} it @param {PointerEvent} e */
    export let onAppsIconPointerDown = () => {};
    export let onAppsIconPointerUpCancel = () => {};
    /** @param {number} idx @param {object} it @param {DragEvent} e */
    export let onAppsDragStart = () => {};
    /** @param {number} idx @param {DragEvent} e */
    export let onAppsDragOver = () => {};
    /** @param {number} idx @param {object} it @param {DragEvent} e */
    export let onAppsDrop = () => {};
    export let onAppsDragEnd = () => {};
    /** @param {number} idx @param {object} it */
    export let onResultRowClick = () => {};
    /** @param {number} idx @param {object} it */
    export let onResultRowDblClick = () => {};
    /** @param {object} it */
    export let onFaviconError = () => {};

    $: draggable = swift && item.type !== "stAllApps";

    /** @param {object} app */
    function stubRow(app) {
        return { type: "stApp", app };
    }
</script>

<div
    class="apps-icon-slot"
    role="group"
    aria-label={tileTitle}
    class:apps-icon-slot--selected={selected}
    on:pointerdown={(e) => onAppsIconPointerDown(i, item, e)}
    on:pointerup={onAppsIconPointerUpCancel}
    on:pointerleave={onAppsIconPointerUpCancel}
    on:pointercancel={onAppsIconPointerUpCancel}
    on:dragover={(e) => onAppsDragOver(i, e)}
    on:drop={(e) => onAppsDrop(i, item, e)}
>
    <button
        type="button"
        role="option"
        id={tileUid}
        class="apps-icon-tile apps-icon-tile--folder"
        class:selected
        class:apps-icon-tile--draggable={draggable}
        aria-selected={selected}
        aria-label={tileTitle || "Folder"}
        {draggable}
        on:dragstart={(e) => onAppsDragStart(i, item, e)}
        on:dragend={() => onAppsDragEnd()}
        on:click={() => onResultRowClick(i, item)}
        on:dblclick|preventDefault={() => onResultRowDblClick(i, item)}
    >
        <div class="apps-folder-preview-grid" aria-hidden="true">
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as slot (slot)}
                {@const app = previewApps[slot]}
                {#if app}
                    {@const url = getResultFaviconSrc(
                        stubRow(app),
                        faviconFailedByKey,
                    )}
                    {#if url}
                        <span class="apps-folder-preview-cell">
                            <img
                                class="apps-folder-preview-img"
                                src={url}
                                alt=""
                                draggable={false}
                                on:error={() => onFaviconError(stubRow(app))}
                            />
                        </span>
                    {:else}
                        <span class="apps-folder-preview-cell">
                            <span
                                class="material-symbols-rounded apps-folder-preview-glyph"
                                >apps</span
                            >
                        </span>
                    {/if}
                {:else}
                    <span
                        class="apps-folder-preview-cell apps-folder-preview-cell--empty"
                    />
                {/if}
            {/each}
        </div>
    </button>
    <label class="apps-icon-slot-title" for={tileUid}
        >{tileTitle != "Folder" ? tileTitle : ""}</label
    >
</div>

<style>
    .apps-icon-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        width: 76px;
        max-width: 76px;
    }

    .apps-icon-slot--selected .apps-icon-slot-title {
        color: var(--st-text-primary, #fff);
    }

    .apps-icon-tile {
        box-sizing: border-box;
        width: 76px;
        height: 76px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        max-width: 76px;
        gap: 6px;
        padding: 8px 6px;
        border: none;
        background-color: #222;
        border-radius: 14px;
        cursor: pointer;
        color: var(--st-text-primary, #fff);
        font-family: inherit;
        transition: background 0.12s;
    }

    .apps-icon-tile:hover,
    .apps-icon-tile.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .apps-folder-preview-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 3px;
        width: 100%;
        height: 100%;
        flex-shrink: 0;
    }

    .apps-folder-preview-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 0;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.2);
    }

    .apps-folder-preview-cell--empty {
        background: rgba(255, 255, 255, 0.04);
    }

    .apps-folder-preview-img {
        width: 17px;
        height: 17px;
        border-radius: 3px;
        object-fit: contain;
        -webkit-user-drag: none;
        user-select: none;
    }

    .apps-folder-preview-glyph {
        font-size: 14px;
        line-height: 1;
        color: var(--st-text-muted, #888);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
        user-select: none;
    }

    .apps-icon-slot-title {
        width: 100%;
        margin: 0;
        padding: 0 2px;
        font-size: 10px;
        line-height: 1.25;
        text-align: center;
        color: var(--st-text-muted, #aaa);
        cursor: pointer;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        word-break: break-word;
        font-family: inherit;
    }
</style>
