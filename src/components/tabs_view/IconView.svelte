<script>
    import { createEventDispatcher } from "svelte";
    import TabItemBadges from "./TabItemBadges.svelte";
    import { lastActiveTabId } from "./tabIndicators.js";

    export let tabs;
    /** Kept for parent bind:compat */
    export let currentTab = null;
    export let selectedTab = null;
    export let multiSelectedIds = [];

    const dispatch = createEventDispatcher();

    $: displayTabs = [...(tabs || [])].sort((a, b) => b.index - a.index);
    $: lastActiveId = lastActiveTabId(tabs);

    function pickTab(tab) {
        selectedTab = tab;
        dispatch("pick");
    }

    function activateTab(tab) {
        pickTab(tab);
        dispatch("activatetab", { tab });
    }
</script>

<div class="icon-view">
    <div class="icon-view-container">
        {#each displayTabs as tab (tab.id)}
            <div
                class="icon-view-item"
                role="button"
                tabindex="-1"
                class:active={tab.active === true}
                class:last-active={lastActiveId != null &&
                    tab.id === lastActiveId}
                class:selected={selectedTab != null &&
                    tab.id === selectedTab.id}
                class:multi-selected={multiSelectedIds.includes(tab.id)}
                data-st-extension-current-tab={currentTab != null &&
                tab.id === currentTab.id
                    ? "true"
                    : undefined}
                on:mouseenter={() => pickTab(tab)}
                on:click={() => activateTab(tab)}
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        activateTab(tab);
                    }
                }}
            >
                <div class="icon-slot">
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
                    <TabItemBadges {tab} variant="overlay" />
                    {#if selectedTab?.id === tab.id || multiSelectedIds.includes(tab.id)}
                        <span class="icon-cmd-hint" title="Command menu"
                            >⌘</span
                        >
                    {/if}
                </div>
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
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px transparent;
        transition:
            background 0.15s,
            opacity 0.15s,
            box-shadow 0.15s;
        min-height: 40px;
        min-width: 40px;
        height: 40px;
        width: 40px;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        opacity: 0.75;
    }

    .icon-slot {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        min-height: 24px;
    }

    .icon-view-item-icon {
        height: 24px;
        width: 24px;
        object-fit: contain;
    }

    .icon-fallback {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
    }

    .icon-view-item.last-active {
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        opacity: 0.8;
    }

    .icon-view-item.active {
        box-shadow: inset 0 0 0 2px var(--st-accent, #7cb8ff);
        opacity: 0.95;
    }

    .icon-view-item.active.last-active {
        box-shadow: inset 0 0 0 2px var(--st-accent, #7cb8ff);
    }

    .icon-view-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.12));
        opacity: 1;
    }

    .icon-view-item.multi-selected {
        box-shadow:
            inset 0 0 0 2px rgba(120, 200, 255, 0.55),
            inset 0 0 0 1px transparent;
        opacity: 1;
    }

    .icon-cmd-hint {
        position: absolute;
        right: -4px;
        bottom: -4px;
        font-size: 13px;
        line-height: 1;
        font-weight: 600;
        color: var(--st-text-muted, #aaa);
        opacity: 0.95;
        user-select: none;
        pointer-events: none;
    }
</style>
