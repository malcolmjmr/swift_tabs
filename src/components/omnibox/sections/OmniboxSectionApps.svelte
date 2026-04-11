<script>
    import { getResultFaviconSrc, isSwiftAppsRow } from "../omniboxShared.js";
    import OmniboxAppsIconTileApp from "./OmniboxAppsIconTileApp.svelte";
    import OmniboxAppsIconTileFolder from "./OmniboxAppsIconTileFolder.svelte";

    /** @type {object[]} */
    export let visibleResults = [];
    export let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    export let faviconFailedByKey = {};
    /** @type {HTMLElement | undefined} */
    export let appsIconFlowEl = undefined;

    /** @param {object} item */
    export let onFaviconError = () => {};

    /** @param {number} i @param {object} item @param {PointerEvent} e */
    export let onAppsIconPointerDown = () => {};
    export let onAppsIconPointerUpCancel = () => {};

    /** @param {number} i @param {object} item @param {DragEvent} e */
    export let onAppsDragStart = () => {};
    /** @param {number} i @param {DragEvent} e */
    export let onAppsDragOver = () => {};
    /** @param {number} i @param {object} item @param {DragEvent} e */
    export let onAppsDrop = () => {};
    export let onAppsDragEnd = () => {};
    /** @param {number} i @param {object} item */
    export let onResultRowClick = () => {};
    /** @param {number} i @param {object} item */
    export let onResultRowDblClick = () => {};

    export let showDropToHomeRail = false;
    /** @param {DragEvent} e */
    export let onAppsDragOverHomeRail = () => {};
    /** @param {DragEvent} e */
    export let onAppsDropHomeRail = () => {};

    function appsIconShortLabel(item) {
        if (!item) return "";
        if (item.type === "stFolder") {
            return item.folder?.title || "";
        }
        if (item.type === "stAllApps") return "All apps";
        const app = item.app;
        if (!app) return "";
        const t = (app.displayTitle || app.title || "").trim();
        if (t) return t;
        const d = (app.domain || "").replace(/^www\./, "");
        return d || "App";
    }
</script>

<div class="apps-icon-scroll">
    {#if showDropToHomeRail}
        <div
            class="apps-drop-home-rail"
            role="region"
            aria-label="Drop to move app to home"
            on:dragover={(e) => onAppsDragOverHomeRail(e)}
            on:drop={(e) => onAppsDropHomeRail(e)}
        >
            Drop here to move to home
        </div>
    {/if}
    <div class="apps-icon-flow" bind:this={appsIconFlowEl}>
        {#each visibleResults as item, i}
            {@const faviconUrl = getResultFaviconSrc(item, faviconFailedByKey)}
            {@const swift = isSwiftAppsRow(item)}
            {@const tileUid =
                item.type === "stFolder"
                    ? `omnibox-apps-f-${item.folder?.id ?? i}`
                    : item.type === "stAllApps"
                      ? "omnibox-apps-all"
                      : `omnibox-apps-a-${item.app?.id ?? i}`}
            {@const tileTitle = appsIconShortLabel(item)}
            {#if item.type === "stFolder" || item.type === "stAllApps"}
                <OmniboxAppsIconTileFolder
                    {i}
                    {item}
                    {tileUid}
                    {tileTitle}
                    previewApps={item.folderPreviewApps || []}
                    selected={selectedResultIndex === i}
                    {swift}
                    {faviconFailedByKey}
                    {onAppsIconPointerDown}
                    {onAppsIconPointerUpCancel}
                    {onAppsDragStart}
                    {onAppsDragOver}
                    {onAppsDrop}
                    {onAppsDragEnd}
                    {onResultRowClick}
                    {onResultRowDblClick}
                    {onFaviconError}
                />
            {:else}
                <OmniboxAppsIconTileApp
                    {i}
                    {item}
                    {tileUid}
                    {tileTitle}
                    selected={selectedResultIndex === i}
                    {swift}
                    {faviconUrl}
                    {onAppsIconPointerDown}
                    {onAppsIconPointerUpCancel}
                    {onAppsDragStart}
                    {onAppsDragOver}
                    {onAppsDrop}
                    {onAppsDragEnd}
                    {onResultRowClick}
                    {onResultRowDblClick}
                    {onFaviconError}
                />
            {/if}
        {/each}
    </div>
</div>

<style>
    .apps-icon-scroll {
        flex: 1;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 4px 10px 10px;
        -webkit-overflow-scrolling: touch;
    }

    .apps-drop-home-rail {
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px dashed var(--st-border-color, rgba(255, 255, 255, 0.2));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.05));
        font-size: 12px;
        text-align: center;
        color: var(--st-text-muted, #aaa);
    }

    .apps-icon-flow {
        display: flex;
        flex-flow: row wrap;
        align-content: flex-start;
        justify-content: flex-start;
        gap: 20px 20px;
    }
</style>
