<script>
    export let tabs;
    export let currentTab;
    export let selectedTab;
</script>

<div class="icon-view">
    <div class="icon-view-container">
        {#each tabs as tab (tab.id)}
            <div
                class="icon-view-item"
                on:mouseenter={() => (selectedTab = tab)}
                on:mouseleave={() => (selectedTab = null)}
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
        flex-direction: column;
        gap: 10px;
    }
    .icon-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 10px;
        border-radius: 8px;
        background-color: #333;
        transition: background-color 0.2s;
    }
</style>
