<script>
    import { createEventDispatcher } from "svelte";
    import TabItemBadges from "./TabItemBadges.svelte";
    import { lastActiveTabId } from "./tabIndicators.js";

    export let tabs;
    /** Kept for parent bind:compat */
    export let currentTab = null;
    export let selectedTab = null;

    const dispatch = createEventDispatcher();

    $: lastActiveId = lastActiveTabId(tabs);

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
                class:active={tab.active === true}
                class:last-active={lastActiveId != null &&
                    tab.id === lastActiveId}
                data-st-extension-current-tab={currentTab != null &&
                tab.id === currentTab.id
                    ? "true"
                    : undefined}
                on:click={() => onTileClick(tab)}
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onTileClick(tab);
                    }
                }}
            >
                <div class="gallery-icon-slot">
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
                    <TabItemBadges {tab} variant="overlay" />
                </div>
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
        transition:
            background 0.1s,
            box-shadow 0.1s;
        cursor: pointer;
        width: calc(50% - 6px);
        min-width: 120px;
        max-width: 100%;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px transparent;
    }

    .gallery-view-item.last-active {
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .gallery-view-item.active {
        box-shadow: inset 0 0 0 2px var(--st-accent, #7cb8ff);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .gallery-view-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .gallery-view-item.active.last-active {
        box-shadow: inset 0 0 0 2px var(--st-accent, #7cb8ff);
    }

    .gallery-icon-slot {
        position: relative;
        display: flex;
        align-items: flex-start;
        flex-shrink: 0;
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
