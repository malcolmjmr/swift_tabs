<script>
    export let text = "";
    export let loading = false;
    export let errorMessage = "";
    export let onClose = () => {};
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
    class="ldm-backdrop"
    role="presentation"
    on:click|self={() => onClose()}
>
    <div class="ldm-panel" role="dialog" aria-label="Link description">
        <div class="ldm-header">
            <span class="ldm-title">Description</span>
            <button
                type="button"
                class="ldm-close"
                aria-label="Close"
                on:click={() => onClose()}
            >
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        <div class="ldm-body">
            {#if loading}
                <p class="ldm-muted">Generating summary…</p>
            {:else if errorMessage}
                <p class="ldm-error">{errorMessage}</p>
            {:else}
                <pre class="ldm-text">{text}</pre>
            {/if}
        </div>
    </div>
</div>

<style>
    .ldm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
    }

    .ldm-panel {
        width: min(520px, 100%);
        max-height: min(70vh, 480px);
        display: flex;
        flex-direction: column;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.98));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    }

    .ldm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .ldm-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
    }

    .ldm-close {
        display: flex;
        color: var(--st-text-muted, #aaa);
        padding: 4px;
        border-radius: 4px;
    }

    .ldm-close:hover {
        color: var(--st-text-primary, #fff);
        background: rgba(255, 255, 255, 0.06);
    }

    .ldm-body {
        padding: 14px 16px;
        overflow: auto;
        flex: 1;
    }

    .ldm-muted {
        margin: 0;
        color: var(--st-text-muted, #999);
        font-size: 14px;
    }

    .ldm-error {
        margin: 0;
        color: #f66;
        font-size: 14px;
        white-space: pre-wrap;
    }

    .ldm-text {
        margin: 0;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--st-text-primary, #eee);
    }
</style>
