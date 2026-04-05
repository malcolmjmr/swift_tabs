<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import {
        getResultFaviconSrc,
        getResultIcon,
        isSwiftAppsRow,
    } from "../omniboxShared.js";

    const dispatch = createEventDispatcher();

    /** @type {'detail' | 'icons'} */
    export let mode = "icons";

    /** --- detail mode --- */
    /** @type {string | null} */
    export let detailAppId = null;
    /** @type {Record<string, object>} */
    export let appsRegistryById = {};
    export let detailTitleEdit = "";
    export let newQueueUrl = "";
    export let appsSuggestionsOpen = false;
    export let appsSuggestionsLoading = false;
    export let appsSuggestionsError = "";
    export let appsDetailSuggestionsText = "";
    /** @param {string} id */
    export let appIdOnHomeLayout = () => false;
    export let onPersistDetailTitle = () => {};
    export let onAddQueueLink = () => {};
    /** @param {string} linkId */
    export let onRemoveQueueLink = () => {};
    export let onRefreshAppSuggestions = () => {};
    export let onAddDetailAppToHome = () => {};
    export let onRemoveDetailAppFromHome = () => {};
    export let onDeleteDetailApp = () => {};
    /** @param {object} app */
    export let onLaunchSwiftApp = () => {};

    /** --- icons mode --- */
    /** @type {object[]} */
    export let visibleResults = [];
    export let selectedResultIndex = 0;
    export let appsEditMode = false;
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
    /** @param {number} i @param {object} item */
    export let onResultRowClick = () => {};
    /** @param {number} i @param {object} item */
    export let onResultRowDblClick = () => {};

    function appsIconShortLabel(item) {
        if (!item) return "";
        if (item.type === "stFolder") {
            return item.folder?.title || "Folder";
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

{#if mode === "detail"}
    <div class="apps-detail-panel">
        <div class="news-detail-hint">
            Backspace — back · Space — open site
        </div>
        <div class="apps-detail-scroll">
            {#if appsRegistryById[detailAppId]}
                {@const dapp = appsRegistryById[detailAppId]}
                <div class="apps-detail-field">
                    <label class="apps-detail-label" for="app-title-edit"
                        >Title</label
                    >
                    <input
                        id="app-title-edit"
                        class="apps-detail-input"
                        bind:value={detailTitleEdit}
                        on:blur={() => onPersistDetailTitle()}
                    />
                </div>
                <div class="apps-detail-actions">
                    <button
                        type="button"
                        class="apps-detail-btn"
                        on:click={() =>
                            void onLaunchSwiftApp(dapp).then(() => {
                                dispatch("submit");
                                dispatch("close");
                            })}
                    >
                        Open site
                    </button>
                    {#if !appIdOnHomeLayout(detailAppId)}
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => onAddDetailAppToHome()}
                        >
                            Add to home
                        </button>
                    {:else}
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => onRemoveDetailAppFromHome()}
                        >
                            Remove from home
                        </button>
                    {/if}
                    <button
                        type="button"
                        class="apps-detail-btn apps-detail-btn--danger"
                        on:click={() => onDeleteDetailApp()}
                    >
                        Delete app
                    </button>
                </div>
                <div class="apps-detail-section-title">Saved links</div>
                <div class="apps-queue-add">
                    <input
                        class="apps-detail-input"
                        placeholder="https://…"
                        bind:value={newQueueUrl}
                    />
                    <button
                        type="button"
                        class="apps-detail-btn"
                        on:click={() => onAddQueueLink()}
                    >
                        Add link
                    </button>
                </div>
                <ul class="apps-queue-list">
                    {#each dapp.savedLinks || [] as link (link.id)}
                        <li class="apps-queue-row">
                            <button
                                type="button"
                                class="apps-queue-link"
                                on:click={() =>
                                    void chromeService
                                        .createTab({
                                            url: link.url,
                                            active: true,
                                        })
                                        .then(() => {
                                            dispatch("submit");
                                            dispatch("close");
                                        })}
                            >
                                {link.url}
                            </button>
                            <button
                                type="button"
                                class="apps-queue-remove"
                                aria-label="Remove link"
                                on:click={() => onRemoveQueueLink(link.id)}
                            >
                                ×
                            </button>
                        </li>
                    {/each}
                </ul>
                <div class="apps-detail-section-title">Suggestions</div>
                <button
                    type="button"
                    class="apps-detail-btn"
                    on:click={() => {
                        appsSuggestionsOpen = !appsSuggestionsOpen;
                    }}
                >
                    {appsSuggestionsOpen ? "Hide" : "Show"} suggestions (search-backed)
                </button>
                {#if appsSuggestionsOpen}
                    <button
                        type="button"
                        class="apps-detail-btn"
                        disabled={appsSuggestionsLoading}
                        on:click={() => onRefreshAppSuggestions()}
                    >
                        {appsSuggestionsLoading ? "Loading…" : "Refresh"}
                    </button>
                    {#if appsSuggestionsError}
                        <div class="news-detail-error">{appsSuggestionsError}</div>
                    {/if}
                    {#if appsDetailSuggestionsText}
                        <pre class="apps-suggestions-text"
                            >{appsDetailSuggestionsText}</pre
                        >
                    {/if}
                {/if}
            {:else}
                <div class="empty-state">App not found</div>
            {/if}
        </div>
    </div>
{:else}
    <div class="apps-icon-scroll">
        <div class="apps-icon-flow" bind:this={appsIconFlowEl}>
            {#each visibleResults as item, i}
                {@const faviconUrl = getResultFaviconSrc(item, faviconFailedByKey)}
                {@const swift = isSwiftAppsRow(item)}
                <button
                    type="button"
                    role="option"
                    class="apps-icon-tile"
                    class:selected={selectedResultIndex === i}
                    class:apps-icon-tile--draggable={swift &&
                        appsEditMode &&
                        item.type !== "stAllApps"}
                    aria-selected={selectedResultIndex === i}
                    draggable={swift &&
                        appsEditMode &&
                        item.type !== "stAllApps"}
                    on:pointerdown={(e) => onAppsIconPointerDown(i, item, e)}
                    on:pointerup={onAppsIconPointerUpCancel}
                    on:pointerleave={onAppsIconPointerUpCancel}
                    on:pointercancel={onAppsIconPointerUpCancel}
                    on:dragstart={(e) => onAppsDragStart(i, item, e)}
                    on:dragover={(e) => onAppsDragOver(i, e)}
                    on:drop={(e) => onAppsDrop(i, item, e)}
                    on:click={() => onResultRowClick(i, item)}
                    on:dblclick|preventDefault={() =>
                        onResultRowDblClick(i, item)}
                >
                    {#if item.type === "stFolder"}
                        <span class="material-symbols-rounded apps-icon-flow-glyph"
                            >folder</span
                        >
                    {:else if faviconUrl}
                        <img
                            class="apps-icon-flow-img"
                            src={faviconUrl}
                            alt=""
                            on:error={() => onFaviconError(item)}
                        />
                    {:else}
                        <span class="material-symbols-rounded apps-icon-flow-glyph">
                            {getResultIcon(item)}
                        </span>
                    {/if}
                    <span class="apps-icon-flow-label"
                        >{appsIconShortLabel(item)}</span
                    >
                </button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .apps-icon-scroll {
        flex: 1;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 4px 10px 10px;
        -webkit-overflow-scrolling: touch;
    }

    .apps-icon-flow {
        display: flex;
        flex-flow: row wrap;
        align-content: flex-start;
        justify-content: flex-start;
        gap: 12px 8px;
    }

    .apps-icon-tile {
        box-sizing: border-box;
        width: 76px;
        flex: 0 0 76px;
        max-width: 76px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 6px 2px 8px;
        border: none;
        background: transparent;
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

    .apps-icon-flow-img {
        width: 48px;
        height: 48px;
        border-radius: 11px;
        object-fit: contain;
        flex-shrink: 0;
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
    }

    .apps-icon-flow-label {
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

    .apps-detail-panel {
        display: flex;
        flex-direction: column;
        min-height: 120px;
        max-height: 320px;
    }

    .news-detail-hint {
        flex-shrink: 0;
        padding: 8px 12px;
        font-size: 11px;
        color: var(--st-text-muted, #888);
        border-bottom: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .apps-detail-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 14px;
    }

    .apps-detail-field {
        margin-bottom: 12px;
    }

    .apps-detail-label {
        display: block;
        font-size: 11px;
        color: var(--st-text-muted, #888);
        margin-bottom: 4px;
    }

    .apps-detail-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-primary, #fff);
        font-size: 13px;
        font-family: inherit;
    }

    .apps-detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
    }

    .apps-detail-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        color: var(--st-text-primary, #fff);
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
    }

    .apps-detail-btn:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .apps-detail-btn--danger {
        border-color: rgba(200, 80, 80, 0.4);
    }

    .apps-detail-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888);
        margin: 12px 0 8px;
    }

    .apps-queue-add {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
        align-items: center;
    }

    .apps-queue-list {
        list-style: none;
        margin: 0 0 12px;
        padding: 0;
    }

    .apps-queue-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .apps-queue-link {
        flex: 1;
        min-width: 0;
        text-align: left;
        background: none;
        border: none;
        color: var(--st-text-primary, #8ab4f8);
        cursor: pointer;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: inherit;
        padding: 0;
    }

    .apps-queue-remove {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 4px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        color: var(--st-text-primary, #fff);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
    }

    .apps-suggestions-text {
        white-space: pre-wrap;
        font-size: 12px;
        line-height: 1.45;
        margin-top: 8px;
        color: var(--st-text-primary, #eee);
        font-family: inherit;
    }

    .news-detail-error {
        color: var(--st-text-primary, #f0a0a0);
    }

    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }
</style>
