<script>
    export let tab = null;

    let faviconFailed = false;
    let lastTabId = null;
    $: if (tab?.id !== lastTabId) {
        lastTabId = tab?.id;
        faviconFailed = false;
    }

    $: displayTitle = tab?.title || "Untitled";
    $: displayHostname = tab?.url
        ? (() => {
              try {
                  return new URL(tab.url).hostname;
              } catch {
                  return tab.url;
              }
          })()
        : "";
    $: canGoBack = tab?.canGoBack ?? false;
    $: canGoForward = tab?.canGoForward ?? false;
    $: isAudible = tab?.audible ?? false;
</script>

{#if tab}
    <div class="active-tab-info" role="status" aria-live="polite">
        <!-- row(favicon, column(title, row(url hostname, meta key hint))) -->
        <div class="row">
            <div class="favicon-slot">
                {#if tab.favIconUrl && !faviconFailed}
                    <img
                        class="favicon"
                        src={tab.favIconUrl}
                        alt=""
                        on:error={() => (faviconFailed = true)}
                    />
                {:else}
                    <span class="favicon-fallback" title={tab.title}>
                        {displayTitle
                            ? displayTitle.charAt(0).toUpperCase()
                            : "?"}
                    </span>
                {/if}
            </div>
            <div class="column">
                <span class="title" title={tab.title}>{displayTitle}</span>
                <div class="row url-hint-row">
                    {#if canGoBack}<span class="nav-icon" title="Can go back"
                            >←</span
                        >{/if}
                    {#if canGoForward}<span
                            class="nav-icon"
                            title="Can go forward">→</span
                        >{/if}
                    <span class="url" title={tab.url}>{displayHostname}</span>
                    {#if isAudible}<span
                            class="audio-icon"
                            title="Audio playing">🔊</span
                        >{/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .active-tab-info {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999990;
        width: 360px;
        height: 80px;
        padding: 10px 16px;
        box-sizing: border-box;
        display: flex;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border-radius: 8px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        font-family: system-ui;
    }

    .row {
        display: flex;
        align-items: stretch;
        gap: 12px;

        min-height: 0;
    }

    .column {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-grow: 1;

        min-width: 0;
        justify-content: center;
    }

    .favicon-slot {
        display: flex;
        align-items: center;
        justify-content: center;

        align-self: stretch;
        padding: 4px 0;
        box-sizing: border-box;
    }

    .favicon {
        height: 100%;
        width: auto;
        max-width: 24px;
        object-fit: contain;
    }

    .favicon-fallback {
        height: 100%;
        min-height: 32px;
        width: 24px;
        min-width: 24px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-secondary, #b0b0b0);
        background: var(--st-bg-secondary, rgba(50, 50, 50, 0.9));
        border-radius: 4px;
    }

    .title {
        font-size: 15px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--st-text-primary, #ffffff);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: clip;
    }

    .url-hint-row {
        gap: 8px;
        margin-top: 2px;
    }

    .url-hint-row.row {
        align-items: center;
    }

    .url {
        font-size: 12px;
        color: var(--st-text-secondary, #b0b0b0);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
    }

    .nav-icon {
        font-size: 12px;
        color: var(--st-text-muted, #808080);
        flex-shrink: 0;
        user-select: none;
    }

    .audio-icon {
        font-size: 12px;
        color: var(--st-text-muted, #808080);
        flex-shrink: 0;
        margin-left: 8px;
        user-select: none;
    }
</style>
