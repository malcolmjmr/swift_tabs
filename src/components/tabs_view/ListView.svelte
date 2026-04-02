<script>
    import { createEventDispatcher } from "svelte";
    import TabItemBadges from "./TabItemBadges.svelte";
    import { lastActiveTabId } from "./tabIndicators.js";

    export let tabs;
    /** Kept for parent bind:compat; window-active styling uses tab.active */
    export let currentTab = null;
    export let selectedTab = null;

    const dispatch = createEventDispatcher();

    $: lastActiveId = lastActiveTabId(tabs);

    function onRowClick(tab) {
        selectedTab = tab;
        dispatch("activatetab", { tab });
    }
</script>

<div class="list-view">
    <div class="list-view-container">
        <div class="list-view-padding"></div>
        {#each tabs as tab (tab.id)}
            <div
                class="list-view-item"
                role="button"
                tabindex="0"
                class:active={tab.active === true}
                class:last-active={lastActiveId != null &&
                    tab.id === lastActiveId}
                class:selected={selectedTab != null &&
                    tab.id === selectedTab.id}
                data-st-extension-current-tab={currentTab != null &&
                tab.id === currentTab.id
                    ? "true"
                    : undefined}
                on:click={() => onRowClick(tab)}
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(tab);
                    }
                }}
            >
                {#if tab.favIconUrl}
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        class="list-view-item-icon"
                    />
                {:else}
                    <span
                        class="list-view-item-icon-fallback"
                        aria-hidden="true"
                        >{(tab.title || "?").charAt(0).toUpperCase()}</span
                    >
                {/if}
                <div class="list-view-item-title">{tab.title}</div>
                <TabItemBadges {tab} variant="inline" />
            </div>
        {/each}
        <div class="list-view-padding"></div>
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
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
    }

    .list-view-container {
        display: flex;
        flex-direction: column;
        padding: 0px 7px;
        gap: 5px;
    }

    .list-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px transparent;

        transition:
            background 0.1s,
            box-shadow 0.1s;
        width: 100%;

        cursor: pointer;
        color: #ffffff;
    }

    .list-view-item:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .list-view-item.active {
        background: transparent;
        box-shadow: inset 0 0 0 1px var(--st-accent, #999999);
    }

    .list-view-item.last-active {
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .list-view-item.active.last-active {
        box-shadow: inset 0 0 0 1px var(--st-accent, #999999);
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
        color: #ffffff;
    }

    .list-view-padding {
        height: 3px;
    }
</style>
