<script>
    import { createEventDispatcher } from "svelte";

    export let tabs;
    export let currentTab = null;
    export let selectedTab = null;

    const dispatch = createEventDispatcher();

    function hostname(url) {
        if (!url) return "";
        try {
            return new URL(url).hostname;
        } catch {
            return "";
        }
    }

    function onTileClick(tab) {
        selectedTab = tab;
        dispatch("activatetab", { tab });
    }
</script>

<div class="gallery-view">
    <div class="gallery-view-container">
        {#each tabs as tab (tab.id)}
            <div
                class="gallery-view-item"
                role="button"
                tabindex="0"
                class:selected={selectedTab != null && tab.id === selectedTab.id}
                class:active={currentTab != null && tab.id === currentTab.id}
                on:click={() => onTileClick(tab)}
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onTileClick(tab);
                    }
                }}
            >
                {#if tab.favIconUrl}
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        class="gallery-view-item-icon"
                    />
                {:else}
                    <span class="gallery-fallback"
                        >{(tab.title || "?").charAt(0).toUpperCase()}</span
                    >
                {/if}
                <div class="gallery-view-item-title">{tab.title}</div>
                <div class="gallery-view-item-url">{hostname(tab.url)}</div>
            </div>
        {/each}
    </div>
</div>

<style>
    .gallery-view {
        display: flex;
        flex-grow: 1;
        width: 100%;
    }

    .gallery-view-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-start;
        align-items: flex-start;
        width: 100%;
        padding: 4px 0;
    }

    .gallery-view-item {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 8px;
        padding: 10px;
        border-radius: 8px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        transition: background 0.1s;
        cursor: pointer;
        width: calc(50% - 6px);
        min-width: 120px;
        max-width: 100%;
        box-sizing: border-box;
        overflow: hidden;
        border: 1px solid transparent;
    }

    .gallery-view-item.selected,
    .gallery-view-item.active {
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.12));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .gallery-view-item-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: contain;
    }

    .gallery-fallback {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        border-radius: 4px;
    }

    .gallery-view-item-title,
    .gallery-view-item-url {
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        text-align: left;
        color: #ffffff;
    }

    .gallery-view-item-url {
        font-size: 12px;
        color: var(--st-text-muted, #808080);
    }
</style>
