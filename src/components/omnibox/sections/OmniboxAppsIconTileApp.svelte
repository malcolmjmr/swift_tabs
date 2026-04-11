<script>
    import { getResultIcon } from "../omniboxShared.js";

    /** @type {number} */
    export let i;
    /** @type {object} */
    export let item;
    /** @type {string} */
    export let tileUid = "";
    /** @type {string} */
    export let tileTitle = "";
    export let selected = false;
    export let swift = false;
    /** @type {string | null} */
    export let faviconUrl = null;

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

    /** Saved links / queue length for this app */
    export let queueCount = 0;

    $: draggable =
        swift && item.type !== "stAllApps" && item.type !== "stLibApp";

    let domain = item.app?.domain || "";
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
        class="apps-icon-tile"
        class:selected
        class:apps-icon-tile--draggable={draggable}
        aria-selected={selected}
        {draggable}
        on:dragstart={(e) => onAppsDragStart(i, item, e)}
        on:dragend={() => onAppsDragEnd()}
        on:click={() => onResultRowClick(i, item)}
        on:dblclick|preventDefault={() => onResultRowDblClick(i, item)}
    >
        {#if queueCount > 0}
            <span
                class="apps-icon-queue-badge"
                aria-label={`${queueCount} queued links`}
                >{queueCount > 99 ? "99+" : queueCount}</span
            >
        {/if}
        {#if faviconUrl}
            <img
                class="apps-icon-flow-img"
                src={faviconUrl}
                alt=""
                draggable={false}
                on:error={() => onFaviconError(item)}
            />
        {:else}
            <span class="material-symbols-rounded apps-icon-flow-glyph">
                {getResultIcon(item)}
            </span>
        {/if}
    </button>
    <label class="apps-icon-slot-title" for={tileUid}
        >{@html domain.replace(".com", "").split(".").join("<br />.")}</label
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
        position: relative;
        box-sizing: border-box;
        width: 76px;
        height: 76px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        max-width: 76px;
        gap: 6px;
        padding: 6px 2px 8px;
        border: none;
        background-color: #222;
        border-radius: 14px;
        cursor: pointer;
        color: var(--st-text-primary, #fff);
        font-family: inherit;
        transition: background 0.12s;
    }

    .apps-icon-queue-badge {
        position: absolute;
        bottom: 12px;
        right: 12px;
        min-width: 18px;
        height: 18px;
        padding: 0px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        background: rgba(200, 80, 80, 0.95);
        color: #fff;
        box-shadow: 0 0 0 2px #222;
        pointer-events: none;
    }

    .apps-icon-tile:hover,
    .apps-icon-tile.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .apps-icon-flow-img {
        width: 30px;
        height: 30px;
        border-radius: 5px;
        object-fit: contain;
        flex-shrink: 0;
        -webkit-user-drag: none;
        user-select: none;
    }

    .apps-icon-flow-glyph {
        font-size: 44px;
        line-height: 1;
        color: var(--st-text-muted, #aaa);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 48;
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

        font-family: inherit;
    }
</style>
