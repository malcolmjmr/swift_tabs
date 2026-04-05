<script>
    export let detailLoading = false;
    export let detailError = "";
    export let detailText = "";
</script>

<div class="news-detail-panel">
    <div class="news-detail-hint">Backspace — back to headlines</div>
    {#if detailLoading}
        <div class="empty-state">Loading details…</div>
    {:else if detailError}
        <div class="empty-state news-detail-error">{detailError}</div>
    {:else}
        <div class="news-detail-scroll">
            <div class="news-detail-text">{detailText}</div>
        </div>
    {/if}
</div>

<style>
    .news-detail-panel {
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

    .news-detail-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 14px;
    }

    .news-detail-text {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--st-text-primary, #eee);
        white-space: pre-wrap;
        word-break: break-word;
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
