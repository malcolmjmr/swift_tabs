<script>
    import { onMount } from "svelte";
    export let tabs;
    export let currentTab;
    export let selectedTab;
    onMount(() => {
        tabs.sort((a, b) => b.index - a.index);
    });
</script>

<div class="icon-view">
    <div class="icon-view-container">
        {#each tabs as tab (tab.id)}
            <div
                class="icon-view-item"
                class:active={tab.id === currentTab.id}
                class:selected={tab.id === selectedTab.id}
                on:mouseenter={() => (selectedTab = tab)}
                on:mouseleave={() => {}}
            >
                <img
                    src={tab.favIconUrl}
                    alt={tab.title}
                    class="icon-view-item-icon"
                />
            </div>
        {/each}
    </div>
</div>

<style>
    .icon-view {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .icon-view-container {
        display: flex;
        flex-wrap: wrap-reverse;
        align-items: center;
        justify-content: flex-start;
        margin: 8px 0px;
        gap: 10px 16px;
        padding-left: 12px;
        width: 100%;
        height: 100%;
    }
    .icon-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;

        border-radius: 8px;
        transition: background-color 0.2s;
        min-height: 40px;
        min-width: 40px;
        height: 40px;
        width: 40px;
        max-height: 40px;
        max-width: 40px;
        background-color: #555;
        opacity: 0.7;

        /* background-color: #333; */
    }
    .icon-view-item-icon {
        height: 24px;
        width: 24px;

        object-fit: contain;
    }
    .icon-view-item.active {
        border: 1px solid #999;
        border-radius: 8px;
        opacity: 0.95;
    }
    .icon-view-item.selected {
        background-color: #555;
        opacity: 0.95;
    }
</style>
