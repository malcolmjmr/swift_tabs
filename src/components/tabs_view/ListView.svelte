<script>
    export let tabs;
    export let currentTab;
    export let selectedTab;
</script>

<div class="list-view">
    <div class="list-view-container">
        {#each tabs as tab (tab.id)}
            <div
                class="list-view-item"
                class:active={tab.id === currentTab.id}
                class:selected={tab.id === selectedTab.id}
            >
                <img
                    src={tab.favIconUrl}
                    alt={tab.title}
                    class="list-view-item-icon"
                />
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
        padding: 10px 0px;
    }
    .list-view-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .list-view-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;
        gap: 8px;
        padding: 5px;
        border-radius: 8px;
        max-height: 30px;
        margin: 0px;

        transition: background-color 0.2s;
        width: calc(100% - 10px);
        cursor: pointer;
    }
    .list-view-item:hover {
        background-color: #222;
    }
    .list-view-item.active {
        background-color: #333;
    }

    .list-view-item.selected {
        background-color: #444;
    }

    .list-view-item-icon {
        max-width: 24px;
        max-height: 24px;
        border-radius: 8px;
        margin: 0px;
    }
    .list-view-item-icon:hover {
        background-color: #555;
    }
    .list-view-item-icon:active {
        background-color: #777;
    }
    .list-view-item-icon:focus {
        background-color: #999;
    }
    .list-view-item-title,
    .list-view-item-url {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        text-align: center;
    }
</style>
