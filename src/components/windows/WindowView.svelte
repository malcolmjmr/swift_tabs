<script>
    import { onMount } from "svelte";
    import addIcon from "../../icons/add.svg";
    import { chromeService } from "../../services/chromeApi";
    import moreIcon from "../../icons/more-horiz.svg";
    import expandIcon from "../../icons/expand-content.svg";
    import collapseIcon from "../../icons/collapse-content.svg";
    import filterIcon from "../../icons/filter.svg";

    export let window;
    export let windowIndex;

    let isHidingTabs = false;
    let visibleTabs = window.tabs;
    let hiddenTabs = [];

    let activeTab;
    $: activeTab = window.tabs.find((t) => t.active);

    let selectedTab;

    function handleTabClick(e, tab) {
        chromeService.activateTab(tab.id);
        chrome.runtime.sendMessage({
            type: "TOOLBAR",
            open: false,
        });
    }

    function handleTabHover(e, tab) {
        selectedTab = tab;
        if (e.metaKey) {
            chromeService.activateTab(tab.id);
        }
    }

    function handleNewTabClick() {
        chromeService.createTab({ active: true });
    }

    function handleToggleTabs() {
        isHidingTabs = !isHidingTabs;
        if (isHidingTabs) {
            let thirtyMinutesAgo = Date.now() - 1000 * 60 * 30;
            visibleTabs = window.tabs.filter(
                (t) => t.lastAccessed > thirtyMinutesAgo,
            );
            hiddenTabs = window.tabs.filter(
                (t) => t.lastAccessed <= thirtyMinutesAgo,
            );
        } else {
            visibleTabs = window.tabs;
            hiddenTabs = [];
        }
    }

    function handleOpenMenu() {}
</script>

<div class="window" id="window-{window.id}">
    {#if window.tabs?.length}
        <!-- Active Tab Header -->
        <div class="window-header">
            <!-- <img
                src={selectedTab?.favIconUrl ?? activeTab.favIconUrl}
                alt=""
                class="active-tab-icon"
            /> -->
            <div class="selected-tab-info">
                <div class="tab-title">
                    {selectedTab?.title ?? activeTab.title}
                </div>
                <div class="tab-url">
                    {new URL(selectedTab?.url ?? activeTab.url).hostname}
                </div>
            </div>
            <!-- Window Title -->
        </div>

        <!-- Tab Icons Grid -->
        <div class="tab-icons">
            {#each visibleTabs as tab (tab.id)}
                <div
                    class="tab-icon-wrapper"
                    title={tab.title}
                    on:click={(e) => handleTabClick(e, tab)}
                    on:mouseenter={(e) => handleTabHover(e, tab)}
                    on:focus={(e) => handleTabHover(e, tab)}
                    on:keydown={(e) => {
                        if (e.key === "Enter") {
                            handleTabClick(e, tab);
                        }
                    }}
                    role="button"
                    tabindex="0"
                >
                    <img
                        src={tab.favIconUrl}
                        alt={tab.title}
                        class="tab-icon"
                    />
                </div>
            {/each}

            <div class="new-tab-button" on:click={handleNewTabClick}>
                <img src={addIcon} alt="New Tab" class="tab-icon" />
            </div>
        </div>
    {/if}
    <div class="window-footer">
        <div class="window-title">
            {window.title ?? "Group " + (windowIndex + 1)}
        </div>
        <div class="window-footer-buttons">
            <div
                class="hidden-tabs-button {isHidingTabs ? 'hidden' : ''}"
                on:click={handleToggleTabs}
            >
                {#if isHidingTabs}
                    <div class="hidden-tabs-count">
                        {hiddenTabs.length}
                    </div>
                {/if}
                <img src={filterIcon} alt="Close" class="window-footer-icon" />
            </div>
            <div class="window-menu-button" on:click={handleOpenMenu}>
                <img src={moreIcon} alt="Menu" class="window-footer-icon" />
            </div>
        </div>
    </div>
</div>

<style>
    div.window {
        min-width: 240px;
        height: 100%;
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
    }

    div.window-header {
        min-width: calc(100% - 16px);
        display: flex;
        align-items: center;
        justify-content: center;

        padding: 8px;
        margin: 0px;
    }

    div.window-header div.selected-tab-info {
        width: 224px;

        min-height: 40px;

        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 4px;
        padding: 8px;
        border-radius: 8px;
        background-color: #333;
    }

    div.window-header div.selected-tab-info div.tab-title {
        font-size: 12px;
        width: 100%;
        min-height: 20px;
        max-height: 20px;
        padding: 0px;
        margin: 0px;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-style: normal;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }
    div.window-header div.selected-tab-info div.tab-url {
        width: 100%;
        min-height: 20px;
        max-height: 20px;
        font-size: 12px;
        font-weight: 400;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    div.tab-icons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        padding: 0px 8px 8px 8px;
    }

    div.tab-icons div.spacer {
        flex-grow: 1;
    }

    div.tab-icons div.tab-icon-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px;
        margin: 2px;
        border-radius: 4px;
        min-width: 24px;
        min-height: 24px;
        transition: background-color 0.2s;
    }

    div.tab-icons div.tab-icon-wrapper:hover {
        background-color: #333;
    }

    div.tab-icons img.tab-icon {
        width: 24px;
        height: 24px;
        padding: 0px;
        margin: 0px;
        border-radius: 2px;
    }
    div.tab-icons div.new-tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px;
        margin: 2px;
        border-radius: 4px;
        min-width: 24px;
        min-height: 24px;
    }
    div.tab-icons div.new-tab-button:hover {
        opacity: 1;
        background-color: #333;
    }
    div.new-tab-button img {
        width: 24px;
        height: 24px;
        padding: 0px;
        margin: 0px;
        border-radius: 8px;
        opacity: 0.8;
    }

    div.window-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 216px;
        padding: 0px 4px;
        margin: 0px 8px;
        background-color: #333;
        border-radius: 8px;
    }

    div.window-footer div.window-title {
        font-size: 12px;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        padding: 4px;
        margin: 0px;
    }
    div.window-footer div.window-footer-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
        padding: 4px;
        margin: 0px;
    }

    div.window-footer-buttons div img.window-footer-icon {
        width: 24px;
        height: 24px;
        padding: 0px;
        margin: 0px;
    }

    div.window-footer-buttons div.hidden-tabs-count {
        position: absolute;
        top: 3px;
        right: 10px;
        font-size: 8px;
        font-weight: 1000;
        color: #333;
    }

    div.window-footer-buttons div.hidden-tabs-button {
        position: relative;
        opacity: 0.8;
        transition: all 0.2s;
    }
    div.window-footer-buttons div.hidden-tabs-button:hover {
        opacity: 1;
    }
    div.window-footer-buttons div.hidden-tabs-button.hidden {
        opacity: 1;
    }
</style>
