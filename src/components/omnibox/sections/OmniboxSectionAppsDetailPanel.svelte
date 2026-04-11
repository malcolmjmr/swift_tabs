<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import {
        APP_SUGGESTIONS_TTL_MS,
        fetchAppSuggestions,
    } from "../../../services/geminiClient";
    import { getUrlFaviconSrc } from "../omniboxShared.js";
    import { onMount } from "svelte";
    import deleteIcon from "../../../icons/delete.svg";

    const dispatch = createEventDispatcher();

    /** @type {string | null} */
    export let detailAppId = null;
    /** @type {Record<string, object>} */
    export let appsRegistryById = {};
    /** @param {string} id */
    export let appIdOnHomeLayout = () => false;
    /** @param {object} app */
    export let onLaunchSwiftApp = () => {};
    export let onReloadApps = async () => {};
    export let onLeaveDetail = () => {};

    let app = appsRegistryById[detailAppId];

    let detailTitleEdit = "";
    let newQueueUrl = "";
    let appsSuggestionsOpen = false;
    let appsSuggestionsLoading = false;
    let appsSuggestionsError = "";
    let appsDetailSuggestionsText = "";

    /** @type {string | null} */
    let lastDetailAppId = null;

    $: if (detailAppId == null) {
        lastDetailAppId = null;
    } else if (detailAppId !== lastDetailAppId) {
        lastDetailAppId = detailAppId;
        appsSuggestionsOpen = false;
        appsSuggestionsLoading = false;
        appsSuggestionsError = "";
        appsDetailSuggestionsText = "";
        newQueueUrl = "";
        detailTitleEdit = app?.displayTitle || app?.title || "";
        if (
            app?.suggestionsCache?.text &&
            Date.now() - (app.suggestionsCache.fetchedAt || 0) <
                APP_SUGGESTIONS_TTL_MS
        ) {
            appsDetailSuggestionsText = app.suggestionsCache.text;
        }
    }
    let faviconSrc = getUrlFaviconSrc(app.defaultUrl);

    onMount(() => {
        console.log("app", app);
    });

    async function persistDetailTitle() {
        if (!detailAppId) return;
        const t = detailTitleEdit.trim();
        await chromeService.appsPutApp({
            id: detailAppId,
            displayTitle: t || undefined,
        });
        await onReloadApps();
    }

    async function removeQueueLink(linkId) {
        if (!detailAppId) return;
        const app = appsRegistryById[detailAppId];
        const links = (app?.savedLinks || []).filter((l) => l.id !== linkId);
        await chromeService.appsPutApp({ id: detailAppId, savedLinks: links });
        await onReloadApps();
    }

    async function refreshAppSuggestions() {
        if (!detailAppId) return;
        const app = appsRegistryById[detailAppId];
        if (!app) return;
        appsSuggestionsLoading = true;
        appsSuggestionsError = "";
        try {
            const { text } = await fetchAppSuggestions({
                domain: app.domain,
                title: app.displayTitle || app.title,
            });
            appsDetailSuggestionsText = text;
            await chromeService.appsPutApp({
                id: detailAppId,
                suggestionsCache: { text, fetchedAt: Date.now() },
            });
            await onReloadApps();
        } catch (e) {
            appsSuggestionsError =
                e instanceof Error ? e.message : "Suggestions failed";
        } finally {
            appsSuggestionsLoading = false;
        }
    }

    async function addDetailAppToHome() {
        if (!detailAppId) return;
        await chromeService.appsAddToHome(detailAppId);
        await onReloadApps();
    }

    async function removeDetailAppFromHome() {
        if (!detailAppId) return;
        await chromeService.appsRemoveFromHome(detailAppId);
        await onReloadApps();
        onLeaveDetail();
    }

    async function deleteDetailApp() {
        if (!detailAppId) return;
        await chromeService.appsDeleteApp(detailAppId);
        await onReloadApps();
        onLeaveDetail();
    }
</script>

<div class="apps-detail-panel">
    <div class="apps-detail-scroll">
        {#if app}
            <div class="apps-detail-header">
                {#if faviconSrc}
                    <div class="app-detail-icon">
                        <img src={faviconSrc} alt={app.title} />
                    </div>
                {/if}

                <input
                    id="app-title-edit"
                    class="apps-detail-input"
                    bind:value={detailTitleEdit}
                    on:blur={() => void persistDetailTitle()}
                />

                <div class="apps-detail-actions">
                    {#if !appIdOnHomeLayout(app.id)}
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => void addDetailAppToHome()}
                        >
                            Add to home
                        </button>
                    {:else}
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => void removeDetailAppFromHome()}
                        >
                            Remove from home
                        </button>
                    {/if}
                    <button
                        type="button"
                        class="apps-detail-btn apps-detail-btn--danger"
                        on:click={() => void deleteDetailApp()}
                    >
                        <img src={deleteIcon} alt="Delete app" />
                    </button>
                </div>
            </div>
            {#if app.savedLinks.length > 0}
                <div class="apps-detail-section-title">Queue</div>
                <ul class="apps-queue-list">
                    {#each app.savedLinks || [] as link (link.id)}
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
                                {link.title ||
                                    link.url.replace(/^https?:\/\//i, "")}
                            </button>
                            <button
                                type="button"
                                class="apps-queue-remove"
                                aria-label="Remove link"
                                on:click={() => void removeQueueLink(link.id)}
                            >
                                ×
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
            {#if app.suggestionsCache?.text}
                <div class="apps-detail-section-title">Updates</div>
                <button
                    type="button"
                    class="apps-detail-btn"
                    on:click={() => {
                        appsSuggestionsOpen = !appsSuggestionsOpen;
                    }}
                >
                    {appsSuggestionsOpen ? "Hide" : "Show"} suggestions (search-backed)
                </button>
            {/if}
            {#if appsSuggestionsOpen}
                <button
                    type="button"
                    class="apps-detail-btn"
                    disabled={appsSuggestionsLoading}
                    on:click={() => void refreshAppSuggestions()}
                >
                    {appsSuggestionsLoading ? "Loading…" : "Refresh"}
                </button>
                {#if appsSuggestionsError}
                    <div class="news-detail-error">
                        {appsSuggestionsError}
                    </div>
                {/if}
                {#if appsDetailSuggestionsText}
                    <pre
                        class="apps-suggestions-text">{appsDetailSuggestionsText}</pre>
                {/if}
            {/if}
        {:else}
            <div class="empty-state">App not found</div>
        {/if}
    </div>
</div>

<style>
    .apps-detail-panel {
        display: flex;
        flex-direction: column;
        min-height: 120px;
        max-height: 320px;
    }

    .apps-detail-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 14px;
    }
    .apps-detail-header {
        display: flex;
        flex-direction: row;
        gap: 12px;
    }

    .app-detail-icon {
        padding: 8px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 5px;
        display: flex;
        align-items: center;
    }

    .app-detail-icon img {
        width: 24px;
        height: 24px;
        object-fit: contain;
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
        flex-direction: row;
        gap: 8px;
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
