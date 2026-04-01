<script>
    import {
        tabStore,
        currentWindowTabs,
        activeTabId,
        windows,
        activeWindowId,
    } from "../stores/tabStore";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";

    import Menu from "./menu/Menu.svelte";
    import ActiveTabLabel from "./ActiveTabLabel.svelte";
    import TabsView from "./tabs_view/TabsView.svelte";
    import NavigationBar from "./NavigationBar.svelte";
    import QuickActions from "./menu/QuickActions.svelte";

    export let mouseX = 0;
    export let mouseY = 0;
    export let currentTab = null;
    export let toolbarIsInFocus = false;

    let activeTabIndex = 0;
    let currentWindow;
    let selectedTab = null;

    let showTabsView = false;
    let showActiveTabLabel = false;
    let showNavigationBar = false;
    let showQuickActions = false;
    let showResourceView = false;
    let showMenu = false;
    let viewMode = "icon";
    onMount(() => {
        init();
    });

    async function init() {
        selectedTab = currentTab;
        await tabStore.init();
    }

    // Keep activeTabIndex in sync with actual active tab
    $: {
        activeTabIndex = $currentWindowTabs.findIndex(
            (tab) => tab.id === $activeTabId,
        );
        if (activeTabIndex === -1 && $currentWindowTabs.length > 0) {
            activeTabIndex = 0;
        }
    }

    // Get current window info
    $: currentWindow = $windows.find((w) => w.id === $activeWindowId);

    let openWindows = [];
    $: openWindows = $windows.filter((w) => w.tabs.length > 0);

    let activeTab;
    $: activeTab = $currentWindowTabs.find((t) => t.id === $activeTabId);
    $: selectedTab = currentTab;

    function handleMouseEnter() {
        toolbarIsInFocus = true;
        showTabsView = true;
        showNavigationBar = true;
        //showQuickActions = true;
        //showResourceView = true;
    }
    function handleMouseLeave() {
        toolbarIsInFocus = false;
        // showTabsView = false;
        //showNavigationBar = false;
        // showQuickActions = false;
        // showResourceView = false;
    }
</script>

<div
    class="toolbar"
    class:toolbar-is-in-focus={toolbarIsInFocus}
    transition:fade={{ duration: 150 }}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
>
    {#if showTabsView && openWindows.length > 0}
        <TabsView
            windows={openWindows}
            bind:currentTab
            bind:selectedTab
            bind:viewMode
            includeEdgeSlides={false}
        />
    {/if}

    <div class="selected-tab-container">
        {#if selectedTab}
            <ActiveTabLabel tab={selectedTab} />
        {/if}

        {#if showNavigationBar}
            <NavigationBar
                bind:showMenu
                bind:showTabsView
                bind:showResourceView
                bind:viewMode
            />
        {/if}
    </div>
    {#if showQuickActions}
        <QuickActions />
    {/if}
    {#if showMenu}
        <Menu />
    {/if}
</div>

<style>
    .toolbar {
        position: fixed;
        z-index: 999999;
        width: 300px;
        max-height: calc(100% - 20px);
        overflow: hidden;
        /* background-color: #111; */
        /* border: 1px solid #555; */

        border-radius: 12px;
        bottom: 10px;
        left: 10px;

        display: flex;
        flex-direction: column;
        justify-content: center;

        opacity: 0.95;
    }
    .toolbar-is-in-focus {
        /* padding: 10px; */
    }

    .selected-tab-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background-color: #333;
    }
</style>
