<script>
    import TabListItem from "./TabListItem.svelte";
    import { createEventDispatcher } from "svelte";
    import MoveMenu from "../menus/MoveMenu.svelte";
    import { windows as windowsStore, tabStore } from "../../stores/tabStore";

    export let isExpanded = false;
    export let tabs = [];
    export let activeTabId = null;

    const dispatch = createEventDispatcher();

    function handleTabClick(tabId) {
        dispatch("tabSelect", { tabId });
    }

    // Swipe to open move menu
    let showMoveMenu = false;
    let selectedTab = null;
    function handleMoveMenu(event) {
        selectedTab = event.detail.tab;
        showMoveMenu = true;
    }
    function closeMoveMenu() {
        showMoveMenu = false;
        selectedTab = null;
    }
    async function moveSelectedTab(targetWindowId) {
        if (!selectedTab) return;
        await tabStore.moveTab(selectedTab.id, targetWindowId);
        closeMoveMenu();
    }

    let draggedTab = null;
    let dragOverTab = null;

    function handleDragStart(tab, event) {
        draggedTab = tab;
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(tab, event) {
        event.preventDefault();
        dragOverTab = tab;
    }

    function handleDrop(event) {
        event.preventDefault();
        if (draggedTab && dragOverTab && draggedTab !== dragOverTab) {
            dispatch("tabMove", {
                fromId: draggedTab.id,
                toId: dragOverTab.id,
            });
        }
        draggedTab = null;
        dragOverTab = null;
    }

    function handleDragEnd() {
        draggedTab = null;
        dragOverTab = null;
    }

    let scrollTimeout;

    function handleScroll() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (!isExpanded) {
                snapToCenter();
            }
        }, 100);
    }

    function snapToCenter() {
        const tabListElement = document.querySelector(".tab-list");
        const tabElements = tabListElement.querySelectorAll(
            'div[role="listitem"]',
        );
        let mostVisibleTab = null;
        let maxVisibleHeight = 0;

        tabElements.forEach((tabElement) => {
            const rect = tabElement.getBoundingClientRect();
            const visibleHeight =
                Math.min(rect.bottom, window.innerHeight) -
                Math.max(rect.top, 0);
            if (visibleHeight > maxVisibleHeight) {
                maxVisibleHeight = visibleHeight;
                mostVisibleTab = tabElement;
            }
        });

        if (mostVisibleTab) {
            const rect = mostVisibleTab.getBoundingClientRect();
            const offset = window.innerHeight / 2 - rect.height / 2;
            tabListElement.scrollTop += rect.top - offset;
        }
    }

    // Add scroll event listener
    $: {
        const tabListElement = document.querySelector(".tab-list");
        if (tabListElement) {
            tabListElement.addEventListener("scroll", handleScroll);
        }
    }
</script>

<div class="tab-list">
    {#each tabs as tab (tab.id)}
        <div
            draggable="true"
            on:dragstart={(e) => handleDragStart(tab, e)}
            on:dragover={(e) => handleDragOver(tab, e)}
            on:drop={handleDrop}
            on:dragend={handleDragEnd}
            role="listitem"
        >
            <TabListItem
                {tab}
                isActive={tab.id === activeTabId}
                isDragging={tab === draggedTab}
                on:click={() => handleTabClick(tab.id)}
                on:openMoveMenu={handleMoveMenu}
            />
        </div>
    {/each}
</div>

{#if showMoveMenu}
    <MoveMenu
        windows={$windowsStore}
        on:close={closeMoveMenu}
        on:moveTab={(e) => moveSelectedTab(e.detail.windowId)}
    />
{/if}

<style>
    .tab-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 0;
        overflow-y: auto;
        max-height: 400px;
    }

    /* Custom scrollbar styles */
    .tab-list::-webkit-scrollbar {
        width: 8px;
    }

    .tab-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .tab-list::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
    }

    .tab-list::-webkit-scrollbar-thumb:hover {
        background-color: #ccc;
    }
</style>
