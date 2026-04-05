<script>
    import { chromeService } from "../../services/chromeApi";

    export let url = "";
    export let onClose = () => {};

    let blockedHint = false;

    function onIframeLoad(e) {
        try {
            const doc = e.target?.contentDocument;
            if (!doc?.body) return;
            const empty =
                doc.body.innerText?.trim().length === 0 &&
                doc.body.children.length === 0;
            if (empty) blockedHint = true;
        } catch {
            blockedHint = true;
        }
    }

    async function openInTab() {
        await chromeService.createTab({ url, active: true });
        onClose();
    }
</script>

<svelte:window
    on:keydown|capture={(e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    }}
/>

<div
    class="lpo-backdrop"
    role="presentation"
    on:click|self={() => onClose()}
>
    <div class="lpo-panel" role="dialog" aria-label="Link preview">
        <div class="lpo-header">
            <span class="lpo-title" title={url}>Preview</span>
            <div class="lpo-actions">
                <button
                    type="button"
                    class="lpo-btn"
                    on:click={() => openInTab()}
                >
                    Open in tab
                </button>
                <button
                    type="button"
                    class="lpo-btn lpo-close"
                    aria-label="Close"
                    on:click={() => onClose()}
                >
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
        </div>
        {#if blockedHint}
            <p class="lpo-blocked">
                This page may block embedding. Use “Open in tab”.
            </p>
        {/if}
        <div class="lpo-frame-wrap">
            <iframe
                class="lpo-frame"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                src={url}
                on:load={onIframeLoad}
            />
        </div>
    </div>
</div>

<style>
    .lpo-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999998;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
    }

    .lpo-panel {
        width: min(880px, 100%);
        height: min(620px, calc(100vh - 24px));
        display: flex;
        flex-direction: column;
        background: var(--st-bg-primary, rgba(22, 22, 22, 0.98));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .lpo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
        flex-shrink: 0;
    }

    .lpo-title {
        font-size: 13px;
        color: var(--st-text-muted, #aaa);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
    }

    .lpo-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .lpo-btn {
        font-size: 13px;
        color: var(--st-text-primary, #fff);
        padding: 6px 10px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
    }

    .lpo-btn:hover {
        background: rgba(255, 255, 255, 0.14);
    }

    .lpo-close {
        padding: 4px 8px;
    }

    .lpo-blocked {
        margin: 0;
        padding: 8px 12px;
        font-size: 12px;
        color: #fa0;
        background: rgba(255, 160, 0, 0.08);
        flex-shrink: 0;
    }

    .lpo-frame-wrap {
        flex: 1;
        min-height: 0;
        background: #111;
    }

    .lpo-frame {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
    }
</style>
