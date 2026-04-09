<script>
    import { fade, fly } from "svelte/transition";
    import TabSwitchingModal from "../TabSwitchingModal.svelte";
    import TabMenu from "../tab/TabMenu.svelte";
    import SystemMenu from "../SystemMenu.svelte";
    import TabsView from "../tabs_view/TabsView.svelte";
    import Omnibox from "../Omnibox.svelte";
    import ActiveTabInfo from "../tab/ActiveTabInfo.svelte";
    import TriageModeOverlay from "./TriageModeOverlay.svelte";
    import HelpMenu from "../HelpMenu.svelte";
    import SettingsPage from "../SettingsPage.svelte";
    /** @type {(tab: chrome.tabs.Tab) => void | Promise<void>} */
    export let onNavActivateTab = async () => {};

    export let tabMenuIsOpen;
    export let helpMenuIsOpen;
    export let settingsPageIsOpen;
    export let systemMenuIsOpen;
    export let isInNavigationMode;
    export let omniboxOpenedStandalone;
    export let omniboxIsOpen;
    export let multiSelectedIds;
    /** @type {chrome.windows.Window[]} */
    export let windowsList;
    export let currentTab;
    export let selectedTab;
    export let navSlideIndex;
    export let navViewMode;
    export let overviewFocusedWindowIndex;
    export let tabsViewRef = null;
    export let omniboxQuery;
    export let activeTabId;
    export let settings;
    export let saveSettingsPatch;
    export let isInTabSwitchingMode;
    export let currentWindowTabs;
    export let showActiveInfoLayer;
    /** @type {chrome.tabs.Tab | null} */
    export let activeInfoTab;
    export let isInTriageMode = false;
    export let triageHorizontalPx = 0;
    export let triageCanScrollUp = false;
    export let triageCanScrollDown = false;
    /** @param {CustomEvent<PointerEvent>} e */
    export let onTriagePointerGestureStart = () => {};
</script>

{#if tabMenuIsOpen}
    <TabMenu
        tab={isInNavigationMode || isInTriageMode ? selectedTab : currentTab}
        onClose={() => {
            tabMenuIsOpen = false;
        }}
    />
{/if}
{#if helpMenuIsOpen}
    <HelpMenu onClose={() => (helpMenuIsOpen = false)} />
{/if}
{#if settingsPageIsOpen}
    <SettingsPage
        {settings}
        onChange={saveSettingsPatch}
        onClose={() => (settingsPageIsOpen = false)}
    />
{/if}
{#if systemMenuIsOpen}
    <SystemMenu />
{:else if isInTriageMode && !tabMenuIsOpen}
    {#if !(omniboxOpenedStandalone && omniboxIsOpen)}
        <TriageModeOverlay
            tab={activeInfoTab}
            horizontalPx={triageHorizontalPx}
            canScrollUp={triageCanScrollUp}
            canScrollDown={triageCanScrollDown}
            on:pointergesturestart={(e) => onTriagePointerGestureStart(e)}
            on:menuRequest={() => {
                tabMenuIsOpen = true;
            }}
        />
    {/if}
    {#if omniboxIsOpen}
        <Omnibox
            windows={windowsList}
            {activeTabId}
            bind:query={omniboxQuery}
            on:close={() => {
                omniboxIsOpen = false;
                omniboxOpenedStandalone = false;
                omniboxQuery = "";
            }}
        />
    {/if}
{:else if isInNavigationMode && !tabMenuIsOpen}
    {#if !(omniboxOpenedStandalone && omniboxIsOpen)}
        <TabsView
            bind:this={tabsViewRef}
            includeEdgeSlides={true}
            windows={windowsList}
            {multiSelectedIds}
            bind:currentTab
            bind:selectedTab
            bind:slideIndex={navSlideIndex}
            bind:viewMode={navViewMode}
            bind:overviewFocusedWindowIndex
            on:activatetab={async (e) => {
                const tab = e.detail?.tab;
                if (!tab?.id) return;
                await onNavActivateTab(tab);
            }}
        />
    {/if}
    {#if omniboxIsOpen}
        <Omnibox
            windows={windowsList}
            {activeTabId}
            bind:query={omniboxQuery}
            on:close={() => {
                omniboxIsOpen = false;
                omniboxOpenedStandalone = false;
                omniboxQuery = "";
            }}
        />
    {/if}
{:else if (showActiveInfoLayer && activeInfoTab) || isInTabSwitchingMode}
    <div in:fade={{ duration: 150 }} out:fade={{ duration: 200 }}>
        <ActiveTabInfo
            tab={activeInfoTab}
            on:menuRequest={() => {
                tabMenuIsOpen = true;
            }}
        />
    </div>
{/if}
