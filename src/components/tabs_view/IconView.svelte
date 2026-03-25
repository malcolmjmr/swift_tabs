<script>
    export let tabs;
    export let currentTab = null;
    export let selectedTab = null;

    $: displayTabs = [...(tabs || [])].sort((a, b) => b.index - a.index);
</script>

<div class="icon-view">
    <div class="icon-view-container">
        {#each displayTabs as tab (tab.id)}
            <div
                class="icon-view-item"
                role="button"
                tabindex="-1"
                class:active={currentTab != null && tab.id === currentTab.id}
                class:selected={selectedTab != null && tab.id === selectedTab.id}
                on:mouseenter={() => (selectedTab = tab)}
                on:mouseleave={() => {}}
            >
                {#if tab.favIconUrl}
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        class="icon-view-item-icon"
                    />
                {:else}
                    <span class="icon-fallback"
                        >{(tab.title || "?").charAt(0).toUpperCase()}</span
                    >
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .icon-view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .icon-view-container {
        display: flex;
        flex-wrap: wrap-reverse;
        align-items: center;
        justify-content: flex-start;
        margin: 0;
        gap: 10px 12px;
        padding: 4px 0;
        width: 100%;
    }

    .icon-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition:
            background 0.15s,
            opacity 0.15s;
        min-height: 40px;
        min-width: 40px;
        height: 40px;
        width: 40px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        opacity: 0.75;
    }

    .icon-view-item-icon {
        height: 24px;
        width: 24px;
        object-fit: contain;
    }

    .icon-fallback {
        font-size: 14px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
    }

    .icon-view-item.active {
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.25));
        opacity: 0.95;
    }

    .icon-view-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.12));
        opacity: 1;
    }
</style>
