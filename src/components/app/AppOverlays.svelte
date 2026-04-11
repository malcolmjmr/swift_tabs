<script>
    import { fade } from "svelte/transition";
    import TabSwitchingModal from "../TabSwitchingModal.svelte";
    import TabMenu from "../tab/TabMenu.svelte";
    import SystemMenu from "../SystemMenu.svelte";
    import TabsView from "../tabs_view/TabsView.svelte";
    import Omnibox from "../Omnibox.svelte";
    import ActiveTabInfo from "../tab/ActiveTabInfo.svelte";
    import TriageModeOverlay from "./TriageModeOverlay.svelte";
    import HelpMenu from "../HelpMenu.svelte";
    import SettingsPage from "../SettingsPage.svelte";
    import MoveMenu from "../menu/MoveMenu.svelte";
    import ActiveTabAddress from "../tab/ActiveTabAddress.svelte";
    import { tabStore } from "../../stores/tabStore.js";
    /** @type {(tab: chrome.tabs.Tab) => void | Promise<void>} */
    export let onNavActivateTab = async () => {};
    /** @param {number[]} tabIds */
    export let onRemoveClosedFromSelection = () => {};

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

    export let showMoveMenu = false;
    export let showActiveTabAddress = false;
    /** @type {() => void | Promise<void>} */
    export let refreshAfterTabEdit = async () => {};

    $: moveAddressTab =
        isInNavigationMode || isInTriageMode ? selectedTab : currentTab;

    async function handleMoveMenuMoved() {
        await tabStore.refreshState();
    }

    /** Tabs strip visible in nav mode (hidden when omnibox is the sole overlay). */
    $: navTabsStripVisible =
        isInNavigationMode && !(omniboxOpenedStandalone && omniboxIsOpen);

    /** Full tab menu: only in navigation mode; docked beside TabsView when strip visible. */
    $: tabMenuTab = selectedTab ?? currentTab;
    $: tabMenuDocked = tabMenuIsOpen && navTabsStripVisible;
    $: tabMenuStandalone =
        isInNavigationMode && tabMenuIsOpen && !navTabsStripVisible;
</script>

{#if tabMenuStandalone}
    <TabMenu
        tab={tabMenuTab}
        docked={false}
        scrollVerticalThreshold={settings?.scrollVerticalThreshold ?? 33}
        {multiSelectedIds}
        windowsList={windowsList}
        onRemoveClosedFromSelection={onRemoveClosedFromSelection}
        onClose={() => {
            tabMenuIsOpen = false;
        }}
    />
{/if}
{#if showMoveMenu}
    <MoveMenu
        tab={moveAddressTab}
        on:close={() => {
            showMoveMenu = false;
        }}
        on:moved={handleMoveMenuMoved}
    />
{/if}
{#if showActiveTabAddress && moveAddressTab}
    <ActiveTabAddress
        tab={moveAddressTab}
        on:close={() => {
            showActiveTabAddress = false;
        }}
        on:committed={async () => {
            await tabStore.refreshState();
            await refreshAfterTabEdit();
            showActiveTabAddress = false;
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
{:else if isInTriageMode}
    {#if !(omniboxOpenedStandalone && omniboxIsOpen)}
        <TriageModeOverlay
            tab={activeInfoTab}
            horizontalPx={triageHorizontalPx}
            canScrollUp={triageCanScrollUp}
            canScrollDown={triageCanScrollDown}
            on:pointergesturestart={(e) => onTriagePointerGestureStart(e)}
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
{:else if isInNavigationMode}
    {#if navTabsStripVisible}
        <div class="nav-mode-tabs-dock">
            <TabsView
                bind:this={tabsViewRef}
                embedInNavDock={true}
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
            {#if tabMenuIsOpen}
                <TabMenu
                    tab={tabMenuTab}
                    docked={true}
                    scrollVerticalThreshold={settings?.scrollVerticalThreshold ??
                        33}
                    {multiSelectedIds}
                    windowsList={windowsList}
                    onRemoveClosedFromSelection={onRemoveClosedFromSelection}
                    onClose={() => {
                        tabMenuIsOpen = false;
                    }}
                />
            {/if}
        </div>
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
        <ActiveTabInfo tab={activeInfoTab} />
    </div>
{/if}

<style>
    .nav-mode-tabs-dock {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999990;
        display: flex;
        flex-direction: row-reverse;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: stretch;
        gap: 10px;
        max-width: calc(100vw - 40px);
        box-sizing: border-box;
    }
</style>
