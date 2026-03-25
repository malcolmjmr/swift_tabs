<script>
    export let tabs;
    export let currentTab = null;
    export let selectedTab = null;
</script>

<div class="list-view">
    <div class="list-view-container">
        {#each tabs as tab (tab.id)}
            <div
                class="list-view-item"
                class:active={currentTab != null && tab.id === currentTab.id}
                class:selected={selectedTab != null && tab.id === selectedTab.id}
            >
                {#if tab.favIconUrl}
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        class="list-view-item-icon"
                    />
                {:else}
                    <span class="list-view-item-icon-fallback" aria-hidden="true"
                        >{(tab.title || "?").charAt(0).toUpperCase()}</span
                    >
                {/if}
                <div class="list-view-item-title">{tab.title}</div>
            </div>
        {/each}
    </div>
</div>

<style>
    .list-view {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        border-radius: 6px;
        background: transparent;
        font-size: 14px;
        font-family: system-ui, -apple-system, sans-serif;
    }

    .list-view-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .list-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        margin: 0;
        transition: background 0.1s;
        width: 100%;
        box-sizing: border-box;
        cursor: default;
        color: var(--st-text-primary, #ffffff);
    }

    .list-view-item:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .list-view-item.active {
        background: transparent;
    }

    .list-view-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .list-view-item-icon,
    .list-view-item-icon-fallback {
        max-width: 24px;
        max-height: 24px;
        min-width: 24px;
        min-height: 24px;
        border-radius: 4px;
        margin: 0;
        flex-shrink: 0;
        object-fit: contain;
    }

    .list-view-item-icon-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .list-view-item-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        flex: 1;
        text-align: left;
    }
</style>
