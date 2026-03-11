<script>
    import { onMount } from "svelte";

    export let activeTab;

    /*

        create tab object from chrome tab data and stored data

        loadTab
            getTabInfo
                journey


        

        

    */

    onMount(() => {
        loadTab();
    });

    async function loadTab() {
        const tabData = await chromeService.getTaData(activeTab.id);
        activeTab = {
            ...activeTab,
            ...tabData,
        };
    }
</script>

<div class="active-tab-view">
    <Header {activeTab} />
    <Properties {activeTab} />
    <Journey {activeTab} />
</div>

<style>
    .active-tab-view {
        width: 100%;
        height: 100%;
    }
</style>
