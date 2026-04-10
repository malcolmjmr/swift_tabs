<script>
    import {
        getResultFaviconSrc,
        getResultIcon,
        getResultSubtitle,
        isSwiftAppsRow,
    } from "../omniboxShared.js";

    /** @type {object[]} */
    export let visibleResults = [];
    export let selectedResultIndex = 0;
    export let appsEditMode = false;

    /** @type {Record<string, boolean>} */
    export let faviconFailedByKey = {};

    /** @param {object} item */
    export let onFaviconError = () => {};

    /** @param {number} i @param {object} item */
    export let onRowClick = () => {};

    /** @param {number} i @param {object} item */
    export let onRowDblClick = () => {};

    /** @param {number} i @param {object} item @param {DragEvent} e */
    export let onAppsDragStart = () => {};

    /** @param {number} i @param {DragEvent} e */
    export let onAppsDragOver = () => {};

    /** @param {number} i @param {object} item @param {DragEvent} e */
    export let onAppsDrop = () => {};
</script>

{#each visibleResults as item, i}
    {@const faviconUrl = getResultFaviconSrc(item, faviconFailedByKey)}
    {@const swift = isSwiftAppsRow(item)}
    <button
        type="button"
        role="option"
        class="result-item"
        class:selected={selectedResultIndex === i}
        class:bookmark-bar-item-list={item.isBookmarkBar}
        class:result-item--draggable={swift &&
            appsEditMode &&
            item.type !== "stAllApps"}
        aria-selected={selectedResultIndex === i}
        draggable={swift && appsEditMode && item.type !== "stAllApps"}
        on:dragstart={(e) => onAppsDragStart(i, item, e)}
        on:dragover={(e) => onAppsDragOver(i, e)}
        on:drop={(e) => onAppsDrop(i, item, e)}
        on:click={() => onRowClick(i, item)}
        on:dblclick|preventDefault={() => onRowDblClick(i, item)}
    >
        {#if faviconUrl}
            <img
                class="result-favicon"
                src={faviconUrl}
                alt=""
                on:error={() => onFaviconError(item)}
            />
        {:else}
            <span class="material-symbols-rounded result-icon">
                {getResultIcon(item)}
            </span>
        {/if}
        <div class="result-content">
            <div class="result-title">{item.title || "(Untitled)"}</div>
            <div class="result-subtitle">{getResultSubtitle(item)}</div>
        </div>
    </button>
{/each}

<style>
    .result-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 16px 16px;
        cursor: pointer;
        transition: background 0.1s;
        color: var(--st-text-primary, #fff);
        background-color: #222;
        border: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
        font-size: inherit;
        opacity: 0.7;
        /* border-radius: 6px; */
    }

    .result-item:first-child {
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    }

    .result-item:last-child {
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
    }

    .result-item:hover,
    .result-item.selected {
        opacity: 1;
    }

    .result-icon {
        font-size: 20px;
        color: var(--st-text-muted, #aaa);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
        flex-shrink: 0;
    }

    .result-favicon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        object-fit: contain;
        border-radius: 2px;
    }

    .result-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        gap: 3px;
    }

    .result-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--st-text-primary, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .result-subtitle {
        font-size: 12px;
        color: var(--st-text-muted, #888);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .result-item--draggable {
        cursor: grab;
    }

    .bookmark-bar-item-list {
        opacity: 0.8;
    }
</style>
