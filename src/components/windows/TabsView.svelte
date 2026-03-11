<script>
    import { onMount } from "svelte";
    export let window;
    let tabsAbove = [];
    let tabsBelow = [];
    let activeTab;
    let selectedTab;

    $: tabsAbove = selectedTab
        ? window.tabs.filter((t) => t.index < selectedTab.index)
        : [];
    $: tabsBelow = selectedTab
        ? window.tabs.filter((t) => t.index > selectedTab.index)
        : [];

    onMount(() => {
        activeTab = window.tabs.find((t) => t.active);
        selectedTab = activeTab;
    });

    function handleTabClick(tab) {
        selectedTab = tab;
    }
    function handleTabHover(tab) {}
</script>

<div class="tabs-view">
    <div class="tabs-above">
        {#each tabsAbove as tab (tab.id)}
            <div class="tab-icon-wrapper">
                <img src={tab.favIconUrl} alt={tab.title} class="tab-icon" />
            </div>
        {/each}
    </div>
    {#if selectedTab}
        <div class="selected-tab">
            <img
                src={selectedTab.favIconUrl}
                alt={selectedTab.title}
                class="tab-icon"
            />

            <div class="selected-tab-title">
                {selectedTab.title}
            </div>
        </div>
    {/if}
    <div class="tabs-below">
        {#each tabsBelow as tab (tab.id)}
            <div class="tab-icon-wrapper">
                <img src={tab.favIconUrl} alt={tab.title} class="tab-icon" />
            </div>
        {/each}
    </div>
</div>

<style>
    .tabs-view {
        min-width: 100%;
        height: 100%;
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
    }
    .tabs-above {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
    }
    .tabs-below {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
    }
    .selected-tab {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 4px;
        margin: 2px;
        background-color: #333;
    }

    .tab-icon-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px;
        margin: 2px;
        border-radius: 8px;
        transition: background-color 0.2s;

        background-color: #333;
    }
    .tab-icon-wrapper:hover {
        background-color: #555;
    }
    .tab-icon {
        width: 24px;
        height: 24px;
        padding: 0px;
        margin: 0px;
        border-radius: 2px;
    }
    .selected-tab-title {
        font-size: 12px;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-style: normal;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }
</style>
