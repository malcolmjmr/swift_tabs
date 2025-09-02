<script>
    /*
        TODO:
        - Create views for ActiveTabView, TabsView, WindowsView, TabMenu, AssistantMenu, 
        - Expanded and collapsed view should share the same tablist
        - Need to persistently store the whether the last view was ActiveTabView, TabsView, WindowsView

    */

    import TabList from "./TabList.svelte";
    import WindowDots from "./WindowDots.svelte";
    import {
        tabStore,
        currentWindowTabs,
        activeTabId,
        windows,
        activeWindowId,
    } from "../stores/tabStore";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import ActiveTabToolbar from "./ActiveTabToolbar.svelte";
    import ExpandedToolbarFooter from "./ExpandedToolbarFooter.svelte";
    import DesktopHeader from "./DesktopHeader.svelte";

    export let x = 0;
    export let y = 0;
    export let visible = false;

    let isExpanded = false;
    let activeTabIndex = 0;
    let currentWindow;

    let showAllWindows = false;

    onMount(() => {
        // Initialize the store when the component mounts
        tabStore.init();
    });

    function handleWheel(event) {
        // if (!isExpanded && $currentWindowTabs.length > 1) {
        //     event.preventDefault();
        //     if (event.deltaY > 0) {
        //         // Scroll down - next tab
        //         activeTabIndex = Math.min(
        //             activeTabIndex + 1,
        //             $currentWindowTabs.length - 1,
        //         );
        //         //tabStore.activateTab($currentWindowTabs[activeTabIndex].id);
        //     } else {
        //         // Scroll up - previous tab
        //         activeTabIndex = Math.max(activeTabIndex - 1, 0);
        //         //tabStore.activateTab($currentWindowTabs[activeTabIndex].id);
        //     }
        // }
    }

    function handleWindowSelect({ detail }) {
        // Reset activeTabIndex when switching windows
        activeTabIndex = 0;
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

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    // Get current window info
    $: currentWindow = $windows.find((w) => w.id === $activeWindowId);

    // Get visible tabs based on expanded state
    $: visibleTabs = $currentWindowTabs;
</script>

{#if visible}
    <div
        class="toolbar"
        class:expanded={isExpanded}
        style="left: {Math.min(
            Math.max(x - 160, 0),
            window.innerWidth - 320,
        )}px; top: {Math.min(Math.max(y - 50, 0), window.innerHeight - 100)}px;"
        on:wheel={handleWheel}
        transition:fade={{ duration: 150 }}
    >
        {#if isExpanded && !showAllWindows}
            <DesktopHeader {currentWindow} />
        {/if}

        <div class="tab-container" class:expanded={isExpanded}>
            <TabList tabs={visibleTabs} activeTabId={$activeTabId} />
        </div>
        {#if !isExpanded}
            <ActiveTabToolbar {toggleExpanded} />
        {:else}
            <ExpandedToolbarFooter {toggleExpanded} />
        {/if}
    </div>
{/if}

<style>
    .toolbar {
        position: fixed;
        z-index: 999999;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 320px;
        overflow: hidden;
    }

    .tab-container {
        position: relative;
        height: 50px;
        overflow: hidden;
    }

    .tab-container.expanded {
        height: 400px;
        margin-bottom: 50px;
    }
</style>
