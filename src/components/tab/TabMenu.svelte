<script>
    /**
     * Tab Menu — Notion-style command menu.
     * Search field at top, flat list of actions with Material icons.
     * Keeps Active Tab Info visible; no redundant tab header.
     */
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { scale } from "svelte/transition";
    import { chromeService } from "../../services/chromeApi";
    import {
        recentActionsStore,
        recentActions,
    } from "../../stores/recentActionsStore";

    export let tab = null;
    export let onClose = () => {};

    let searchQuery = "";
    let selectedIndex = 0;
    let listEl = null;
    let scrollSelectDelta = 0;
    const SCROLL_SELECT_THRESHOLD = 25;

    // Section 1: Quick actions
    const QUICK_ACTIONS = [
        { id: "pin", icon: "push_pin", label: "Pin" },
        { id: "reload", icon: "refresh", label: "Reload" },
        { id: "duplicate", icon: "content_copy", label: "Duplicate" },
        { id: "copy", icon: "link", label: "Copy URL" },
        { id: "sleep", icon: "sleep", label: "Sleep" },
        { id: "find", icon: "find_in_page", label: "Find" },
    ];

    // Section 2: Save to
    const SAVE_TO_ACTIONS = [
        { id: "save_favorite_apps", icon: "stars", label: "Favorite apps" },
        { id: "save_bookmarks", icon: "bookmark", label: "Bookmarks" },
        { id: "save_database", icon: "database", label: "Database" },
        { id: "save_tasks", icon: "task_alt", label: "Tasks" },
    ];

    // Section 3: Move to
    const MOVE_TO_ACTIONS = [
        { id: "move_popup", icon: "open_in_new", label: "Popup" },
        { id: "move_window", icon: "web", label: "Window" },
        { id: "move_group", icon: "folder", label: "Group" },
        { id: "move_reading_list", icon: "menu_book", label: "Reading list" },
        { id: "move_bookmarks", icon: "bookmark", label: "Bookmarks" },
        { id: "move_database", icon: "database", label: "Database" },
        { id: "move_task", icon: "task_alt", label: "Task" },
        { id: "move_time", icon: "schedule", label: "Time" },
    ];

    // Section 4: Appearance
    const APPEARANCE_ACTIONS = [
        { id: "zoom", icon: "zoom_in", label: "Zoom" },
        { id: "font_size", icon: "format_size", label: "Font size" },
        { id: "dark_mode", icon: "dark_mode", label: "Dark mode" },
        { id: "reader_mode", icon: "auto_stories", label: "Reader mode" },
        { id: "hide_elements", icon: "visibility_off", label: "Hide elements" },
    ];

    // Section 5: Custom actions (empty state)
    const CUSTOM_ACTIONS = []; // User-defined, empty by default

    // Section 6: Close actions
    const CLOSE_ACTIONS = [
        { id: "close", icon: "close", label: "Close" },
        {
            id: "close_others",
            icon: "remove_circle_outline",
            label: "Close others",
        },
        {
            id: "close_to_right",
            icon: "keyboard_double_arrow_right",
            label: "Close to the right",
        },
    ];

    const SECTIONS = [
        { id: "quick", label: null, items: QUICK_ACTIONS },
        { id: "save", label: "Save to", items: SAVE_TO_ACTIONS },
        { id: "move", label: "Move to", items: MOVE_TO_ACTIONS },
        { id: "appearance", label: "Appearance", items: APPEARANCE_ACTIONS },
        { id: "custom", label: "Custom actions", items: CUSTOM_ACTIONS },
        { id: "close", label: "Close", items: CLOSE_ACTIONS },
    ];

    function filterItems(items, query) {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        return items.filter((i) => i.label.toLowerCase().includes(q));
    }

    $: flattenedList = (() => {
        const list = [];
        SECTIONS.forEach((section) => {
            const filtered = filterItems(section.items, searchQuery);
            if (filtered.length > 0 || section.id === "custom") {
                if (section.label)
                    list.push({ type: "header", label: section.label });
                if (section.id === "custom") {
                    list.push({ type: "create_action", id: "create_action" });
                } else {
                    filtered.forEach((item) => {
                        list.push({
                            type: "action",
                            sectionId: section.id,
                            data: item,
                        });
                    });
                }
            }
        });
        return list;
    })();

    $: selectableList = flattenedList.filter(
        (i) => i.type === "action" || i.type === "create_action",
    );
    $: flattenedListWithIndex = (() => {
        let idx = 0;
        return flattenedList.map((item) => {
            const isSelectable =
                item.type === "action" || item.type === "create_action";
            const selectableIdx = isSelectable ? idx++ : -1;
            return { item, selectableIdx };
        });
    })();
    $: clampedIndex =
        selectableList.length === 0
            ? -1
            : Math.min(Math.max(0, selectedIndex), selectableList.length - 1);
    $: selectedItem = clampedIndex >= 0 ? selectableList[clampedIndex] : null;

    onMount(() => {
        recentActionsStore.init();
        window.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });
    });

    onDestroy(() => {
        window.removeEventListener("wheel", handleWheel, { capture: true });
    });

    function scrollSelectedIntoView() {
        if (listEl) {
            const item = listEl.querySelector(
                `[data-selectable-index="${clampedIndex}"]`,
            );
            item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }

    function handleScrollSelect(delta) {
        if (selectableList.length === 0) return;
        scrollSelectDelta += delta;
        if (Math.abs(scrollSelectDelta) >= SCROLL_SELECT_THRESHOLD) {
            const step = scrollSelectDelta > 0 ? -1 : 1;
            scrollSelectDelta = 0;
            selectedIndex = Math.max(
                0,
                Math.min(selectableList.length - 1, selectedIndex + step),
            );

            //scrollSelectedIntoView();
        }
    }

    async function executeAction(sectionId, actionId) {
        if (!tab?.id) return;
        try {
            switch (actionId) {
                case "pin":
                    await chromeService.pinTab(tab.id);
                    break;
                case "reload":
                    await chromeService.reloadTab(tab.id);
                    break;
                case "duplicate":
                    await chromeService.duplicateTab(tab.id);
                    break;
                case "copy": {
                    const url = await chromeService.copyTabUrl(tab.id);
                    if (url) await navigator.clipboard.writeText(url);
                    break;
                }
                case "sleep":
                    await chromeService.discardTab(tab.id);
                    break;
                case "find":
                    await chromeService.activateTab(tab.id);
                    break;
                case "move_window":
                    await chromeService.createWindowWithTab(tab.id);
                    break;
                case "close":
                    await chromeService.closeTab(tab.id);
                    break;
                case "close_others":
                    await chromeService.closeOtherTabs(tab.id);
                    break;
                case "close_to_right":
                    await chromeService.closeTabsToRight(tab.id);
                    break;
                case "create_action":
                    // Placeholder — open create action flow
                    return;
                default:
                    return;
            }
            await recentActionsStore.addAction({
                category: sectionId,
                action: actionId,
            });
            onClose();
        } catch (e) {
            console.error("TabMenu action failed:", e);
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key === "ArrowUp" && selectableList.length > 0) {
            event.preventDefault();
            selectedIndex = Math.max(0, selectedIndex - 1);
            scrollSelectedIntoView();
            return;
        }
        if (event.key === "ArrowDown" && selectableList.length > 0) {
            event.preventDefault();
            selectedIndex = Math.min(
                selectableList.length - 1,
                selectedIndex + 1,
            );
            scrollSelectedIntoView();
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const item =
                clampedIndex >= 0 ? selectableList[clampedIndex] : null;
            if (!item) return;
            if (item.type === "create_action") {
                // Create action placeholder
                return;
            }
            executeAction(item.sectionId, item.data.id);
            return;
        }
        if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.shiftKey
        ) {
            const active = document.activeElement;
            if (
                active?.tagName === "INPUT" ||
                active?.tagName === "TEXTAREA" ||
                active?.isContentEditable
            ) {
                return;
            }
            searchQuery += event.key;
            selectedIndex = 0;
            event.preventDefault();
        }
    }

    function handleWheel(event) {
        // Scroll-to-select only when mouse is OUTSIDE the menu
        if (!event.target.closest(".tab-menu")) {
            event.preventDefault();
            event.stopPropagation();
            const delta = event.deltaY > 0 ? 1 : -1;
            handleScrollSelect(delta);
        }
    }

    function handleClickOutside(event) {
        if (!event.target.closest(".tab-menu")) {
            onClose();
        }
    }
</script>

<svelte:window
    on:keydown|capture={(e) => handleKeydown(e)}
    on:click={(e) => handleClickOutside(e)}
    role="presentation"
/>

{#if tab}
    <div
        class="tab-menu"
        role="menu"
        aria-label="Tab actions"
        transition:scale={{ duration: 180 }}
    >
        <!-- Search field (Notion-style) -->
        <div class="menu-search">
            <span class="material-symbols-rounded search-icon">search</span>
            <input
                type="text"
                class="search-input"
                placeholder="Search actions..."
                bind:value={searchQuery}
                role="searchbox"
            />
        </div>

        <div class="tab-menu-list" bind:this={listEl}>
            {#each flattenedListWithIndex as { item, selectableIdx } (item.type + (item.data?.id ?? item.label ?? selectableIdx))}
                {#if item.type === "header"}
                    <div class="section-header">{item.label}</div>
                {:else if item.type === "create_action"}
                    <button
                        class="tab-menu-item create-action"
                        class:selected={selectedItem?.type === "create_action"}
                        role="menuitem"
                        data-selectable-index={selectableIdx}
                        on:click={() => {}}
                    >
                        <span
                            class="material-symbols-rounded create-action-icon"
                            >add_circle_outline</span
                        >
                        <span class="tab-menu-item-label">Create action</span>
                    </button>
                {:else if item.type === "action"}
                    <button
                        class="tab-menu-item"
                        class:selected={selectedItem?.type === "action" &&
                            selectedItem?.data?.id === item.data.id}
                        role="menuitem"
                        data-selectable-index={selectableIdx}
                        on:click={() =>
                            executeAction(item.sectionId, item.data.id)}
                    >
                        <span
                            class="material-symbols-rounded tab-menu-item-icon"
                            >{item.data.icon}</span
                        >
                        <span class="tab-menu-item-label"
                            >{item.data.label}</span
                        >
                    </button>
                {/if}
            {/each}
        </div>
    </div>
{/if}

<style>
    .tab-menu {
        position: fixed;
        right: 20px;
        bottom: 118px;
        z-index: 999991;
        width: 340px;
        max-height: 420px;
        display: flex;
        flex-direction: column;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    .menu-search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .search-icon {
        font-size: 20px;
        color: var(--st-text-muted, #808080);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .search-input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--st-text-primary, #ffffff);
        font-size: 14px;
        outline: none;
    }

    .search-input::placeholder {
        color: var(--st-text-muted, #808080);
    }

    .tab-menu-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
        margin: 0px;
        max-height: 360px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .section-header {
        padding: 8px 5px 0px 5px;
        margin: 12px 8px 5px 8px;
        font-size: 11px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-top: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
    }

    .section-header:first-of-type {
        margin-top: 0;
    }

    .tab-menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px 6px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--st-text-primary, #ffffff);
        font-size: 14px;
        cursor: pointer;
        text-align: left;
        width: calc(100% - 24px);
        max-height: 20px;
        height: 20px;
        min-height: 20px;
        margin: 0px 12px;
        transition: background 0.1s;
    }

    .tab-menu-item:hover,
    .tab-menu-item.selected {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .tab-menu-item-icon {
        font-size: 20px;
        color: var(--st-text-secondary, #b0b0b0);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .tab-menu-item-label {
        flex: 1;
    }

    .create-action-icon {
        color: var(--st-text-muted, #808080);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }
</style>
