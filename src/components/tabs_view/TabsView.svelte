<script>
    import { onMount } from "svelte";
    import GalleryView from "./GalleryView.svelte";
    import IconView from "./IconView.svelte";
    import ListView from "./ListView.svelte";

    export let windows;
    export let viewType = "list";

    export let currentTab = null;
    export let selectedTab = null;

    let window;
    let tabs = [];
    onMount(() => {
        if (windows) {
            window = windows.find((w) => w.id === currentTab.windowId);
            window.tabs.sort((a, b) => a.index - b.index);
            tabs = window.tabs;
        }
    });
</script>

{#if tabs.length > 0}
    <div class="tabs-view">
        {#if viewType === "icon"}
            <IconView {tabs} bind:selectedTab bind:currentTab />
        {:else if viewType === "gallery"}
            <GalleryView {tabs} {currentTab} bind:selectedTab />
        {:else if viewType === "list"}
            <ListView {tabs} bind:currentTab bind:selectedTab />
        {/if}
    </div>
{/if}

<style>
    .tabs-view {
        position: fixed;
        z-index: 999999;

        right: 10px;
        bottom: 10px;
        min-width: 300px;
        width: 300px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex-grow: 1;
        overflow-y: scroll;
        padding: 0px;
        margin: 0;
        /* border-bottom: 1px solid #555; */
        width: calc(100% - 20px);
    }
</style>
