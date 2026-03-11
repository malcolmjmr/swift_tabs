<script>
    export let tabs;
    export let currentTab;
    export let selectedTab;
</script>

<div class="gallery-view">
    <div class="gallery-view-container">
        {#each tabs as tab (tab.id)}
            <div class="gallery-view-item">
                <img
                    src={tab.favIconUrl}
                    alt={tab.title}
                    class="gallery-view-item-icon"
                />
                <div class="gallery-view-item-title">{tab.title}</div>
                <div class="gallery-view-item-url">
                    {new URL(tab.url).hostname}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .gallery-view {
        display: flex;
        flex-grow: 1;
    }
    .gallery-view-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: start;
        align-items: start;
        height: 100%;
        width: 100%;
        padding: 10px 0px;
    }
    .gallery-view-item {
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        justify-content: start;
        gap: 10px;
        padding: 10px;
        border-radius: 8px;
        background-color: #333;
        transition: background-color 0.2s;
        width: calc(50% - 16px);
        height: 200px;
        overflow: hidden;
        text-overflow: ellipsis;

        max-width: 100%;
    }
    .gallery-view-item-icon {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background-color: #333;
    }
    .gallery-view-item-icon:hover {
        background-color: #555;
    }
    .gallery-view-item-icon:active {
        background-color: #777;
    }
    .gallery-view-item-icon:focus {
        background-color: #999;
    }
    .gallery-view-item-title,
    .gallery-view-item-url {
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        text-align: center;
    }
</style>
