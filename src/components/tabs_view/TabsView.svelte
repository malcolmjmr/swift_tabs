<script>
    import { onMount } from "svelte";
    import GalleryView from "./GalleryView.svelte";
    import IconView from "./IconView.svelte";
    import ListView from "./ListView.svelte";

    export let windows;

    export let currentTab;
    export let selectedTab;

    let window;
    let tabs = [];
    onMount(() => {
        if (windows) {
            window = windows.find((w) => w.id === currentTab.windowId);
            tabs = window.tabs;
        }
    });
</script>

{#if tabs.length > 0}
    <div class="tabs-view">
        {#if tabs.length < 8}
            <GalleryView {tabs} {currentTab} {selectedTab} />
        {:else if tabs.length < 20}
            <ListView {tabs} {currentTab} {selectedTab} />
        {:else}
            <IconView {tabs} {currentTab} {selectedTab} />
        {/if}
    </div>
{/if}

<style>
    .tabs-view {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex-grow: 1;
        overflow-y: scroll;
        margin: 0px 10px;
        border-bottom: 1px solid #444;
    }
</style>
