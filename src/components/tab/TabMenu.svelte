<script>
    /**
     * Tab menu: single wrapped list of items; section labels break rows; some items open submenus.
     */
    import { onMount, onDestroy } from "svelte";
    import { scale } from "svelte/transition";
    import { recentActionsStore } from "../../stores/recentActionsStore";
    import {
        TAB_MENU_SECTIONS as SECTIONS,
        runTabMenuAction,
    } from "./tabMenuActions.js";
    import {
        registerTabMenuWheelSelect,
        unregisterTabMenuWheelSelect,
    } from "../../app/gestures/tabNavigationScroll.js";

    export let tab = null;
    export let onClose = () => {};
    export let docked = true;
    /** Same threshold as navigation-mode tab list (settings.scrollVerticalThreshold). */
    export let scrollVerticalThreshold = 33;

    const QUICK_ID = "quick";

    let searchQuery = "";
    let selectedIndex = 0;
    let listEl = null;
    let scrollSelectDelta = 0;

    /** @type {"root" | "submenu"} */
    let menuPanel = "root";
    /** @type {string | null} */
    let openSectionId = null;

    $: searchTrim = searchQuery.trim();

    $: if (searchTrim.length > 0) {
        openSectionId = null;
        menuPanel = "root";
    }

    function sectionById(id) {
        return SECTIONS.find((s) => s.id === id) ?? null;
    }

    function openSubmenu(sectionId) {
        menuPanel = "submenu";
        openSectionId = sectionId;
        selectedIndex = 0;
        scrollSelectDelta = 0;
    }

    function closeSubmenu() {
        menuPanel = "root";
        openSectionId = null;
        selectedIndex = 0;
        scrollSelectDelta = 0;
    }

    /**
     * @returns {Array<
     *   | { type: "section_head"; label: string }
     *   | { type: "cell"; cell: object; selectableIndex: number }
     * >}
     */
    function buildSearchNodes(q) {
        const qLower = q.toLowerCase();
        const match = (label) => label.toLowerCase().includes(qLower);
        const nodes = [{ type: "section_head", label: "Results" }];
        let si = 0;
        const pushCell = (cell) => {
            nodes.push({ type: "cell", cell, selectableIndex: si++ });
        };
        for (const section of SECTIONS) {
            if (section.id === "custom") {
                if (match("create") || match("action") || match("custom")) {
                    pushCell({
                        type: "create_action",
                        sectionId: "custom",
                    });
                }
                continue;
            }
            for (const item of section.items) {
                if (match(item.label)) {
                    pushCell({
                        type: "action",
                        sectionId: section.id,
                        data: item,
                    });
                }
            }
        }
        return nodes;
    }

    function buildRootNodes() {
        const nodes = [];
        let si = 0;
        const pushCell = (cell) => {
            nodes.push({ type: "cell", cell, selectableIndex: si++ });
        };
        const quick = sectionById(QUICK_ID);
        if (quick?.items?.length) {
            nodes.push({ type: "section_head", label: "Quick" });
            for (const item of quick.items) {
                pushCell({
                    type: "action",
                    sectionId: quick.id,
                    data: item,
                });
            }
        }
        for (const section of SECTIONS) {
            if (section.id === QUICK_ID) continue;
            const label = section.label ?? section.id;
            const hasItems =
                section.items.length > 0 || section.id === "custom";
            if (!hasItems) continue;
            pushCell({
                type: "section_nav",
                sectionId: section.id,
                label,
            });
        }
        return nodes;
    }

    function buildSubmenuNodes(sectionId) {
        const nodes = [];
        let si = 0;
        const pushCell = (cell) => {
            nodes.push({ type: "cell", cell, selectableIndex: si++ });
        };
        const section = sectionById(sectionId);
        if (!section) {
            pushCell({ type: "back" });
            return nodes;
        }
        const title = section.label ?? section.id;
        pushCell({ type: "back" });
        nodes.push({ type: "section_head", label: title });
        if (section.id === "custom") {
            pushCell({ type: "create_action", sectionId: "custom" });
        } else {
            for (const item of section.items) {
                pushCell({
                    type: "action",
                    sectionId: section.id,
                    data: item,
                });
            }
        }
        return nodes;
    }

    $: viewNodes =
        searchTrim.length > 0
            ? buildSearchNodes(searchTrim)
            : menuPanel === "submenu" && openSectionId
              ? buildSubmenuNodes(openSectionId)
              : buildRootNodes();

    $: selectableList = (() => {
        const list = [];
        for (const node of viewNodes) {
            if (node.type !== "cell") continue;
            const cell = node.cell;
            if (
                cell.type === "action" ||
                cell.type === "create_action" ||
                cell.type === "section_nav" ||
                cell.type === "back"
            ) {
                list.push(cell);
            }
        }
        return list;
    })();

    $: clampedIndex =
        selectableList.length === 0
            ? -1
            : Math.min(Math.max(0, selectedIndex), selectableList.length - 1);
    $: selectedCell = clampedIndex >= 0 ? selectableList[clampedIndex] : null;

    function cellKey(cell, i) {
        if (cell.type === "action")
            return `a-${cell.sectionId}-${cell.data.id}-${i}`;
        if (cell.type === "create_action") return `c-${i}`;
        if (cell.type === "section_nav") return `n-${cell.sectionId}-${i}`;
        if (cell.type === "back") return `b-${i}`;
        return `x-${i}`;
    }

    function nodeKey(node, i) {
        if (node.type === "section_head") return `h-${node.label}-${i}`;
        return cellKey(node.cell, i);
    }

    function isCellSelected(cell) {
        if (!selectedCell || !cell) return false;
        if (cell.type !== selectedCell.type) return false;
        if (cell.type === "action") {
            return (
                cell.sectionId === selectedCell.sectionId &&
                cell.data?.id === selectedCell.data?.id
            );
        }
        if (cell.type === "section_nav") {
            return cell.sectionId === selectedCell.sectionId;
        }
        return true;
    }

    onMount(() => {
        recentActionsStore.init();
        registerTabMenuWheelSelect(handleScrollSelect);
    });

    onDestroy(() => {
        unregisterTabMenuWheelSelect();
    });

    function scrollSelectedIntoView() {
        if (listEl && clampedIndex >= 0) {
            const el = listEl.querySelector(
                `[data-selectable-index="${clampedIndex}"]`,
            );
            el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }

    function handleScrollSelect(deltaPx) {
        if (selectableList.length === 0) return;
        scrollSelectDelta += deltaPx;
        if (Math.abs(scrollSelectDelta) < scrollVerticalThreshold) return;
        const step = scrollSelectDelta > 0 ? 1 : -1;
        scrollSelectDelta = 0;
        selectedIndex = Math.max(
            0,
            Math.min(selectableList.length - 1, selectedIndex + step),
        );
        scrollSelectedIntoView();
    }

    function executeAction(sectionId, actionId) {
        void runTabMenuAction(tab, sectionId, actionId, onClose);
    }

    function activateCell(cell) {
        if (!cell) return;
        if (cell.type === "back") {
            closeSubmenu();
            return;
        }
        if (cell.type === "section_nav") {
            openSubmenu(cell.sectionId);
            return;
        }
        if (cell.type === "create_action") return;
        if (cell.type === "action") {
            executeAction(cell.sectionId, cell.data.id);
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (!searchTrim && menuPanel === "submenu") {
                closeSubmenu();
                return;
            }
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
            const cell =
                clampedIndex >= 0 ? selectableList[clampedIndex] : null;
            activateCell(cell);
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
            scrollSelectDelta = 0;
            event.preventDefault();
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
        <div class="tab-menu-body tab-menu-items" bind:this={listEl}>
            {#each viewNodes as node, ni (nodeKey(node, ni))}
                {#if node.type === "section_head"}
                    <div class="menu-section-head" role="presentation">
                        <span class="section-title">{node.label}</span>
                        <span class="section-rule" aria-hidden="true"></span>
                    </div>
                {:else}
                    {@const cell = node.cell}
                    {@const si = node.selectableIndex}
                    {#if cell.type === "action"}
                        <button
                            type="button"
                            class="chip"
                            class:chip--selected={isCellSelected(cell)}
                            data-selectable-index={si}
                            on:click={() => {
                                selectedIndex = si;
                                executeAction(cell.sectionId, cell.data.id);
                            }}
                        >
                            <span class="material-symbols-rounded chip-icon"
                                >{cell.data.icon}</span
                            >
                            {cell.data.label}
                        </button>
                    {:else if cell.type === "create_action"}
                        <button
                            type="button"
                            class="chip"
                            class:chip--selected={isCellSelected(cell)}
                            data-selectable-index={si}
                            on:click={() => {}}
                        >
                            <span class="material-symbols-rounded chip-icon"
                                >add_circle_outline</span
                            >
                            Create action
                        </button>
                    {:else if cell.type === "section_nav"}
                        <button
                            type="button"
                            class="chip chip--section-nav"
                            class:chip--selected={isCellSelected(cell)}
                            data-selectable-index={si}
                            on:click={() => openSubmenu(cell.sectionId)}
                        >
                            {cell.label}
                            <span class="material-symbols-rounded chip-chevron"
                                >arrow_forward_ios</span
                            >
                        </button>
                    {:else if cell.type === "back"}
                        <button
                            type="button"
                            class="chip chip--section-nav"
                            class:chip--selected={isCellSelected(cell)}
                            data-selectable-index={si}
                            on:click={closeSubmenu}
                        >
                            <span
                                class="material-symbols-rounded chip-chevron chip-chevron--back"
                                >arrow_back_ios_new</span
                            >
                            Back
                        </button>
                    {/if}
                {/if}
            {/each}
        </div>
    </div>
{/if}

<style>
    .tab-menu {
        position: fixed;
        right: 400px;
        bottom: 20px;
        z-index: 999991;
        width: 320px;
        max-height: min(480px, calc(100vh - 40px));
        display: flex;
        flex-direction: column;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.97));

        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        overflow: hidden;
    }

    .tab-menu--docked {
        position: relative;
        right: auto;
        bottom: auto;
        flex: 0 1 auto;
        width: clamp(220px, 36vw, 320px);
        min-width: 200px;
        max-height: min(50vh, 480px);
        align-self: stretch;
    }

    .menu-search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 12px 10px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.1));
        flex-shrink: 0;
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

    .tab-menu-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 8px 12px 14px;
        scrollbar-width: thin;
    }

    .tab-menu-items {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 6px;
    }

    .menu-section-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        flex: 1 1 100%;
        width: 100%;
        min-width: 0;
        margin-top: 2px;
    }

    .menu-section-head:first-child {
        margin-top: 0;
    }

    .section-title {
        flex: 0 0 auto;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--st-text-muted, #888);
    }

    .section-rule {
        flex: 1 1 auto;
        min-width: 12px;
        height: 1px;
        background-color: #333333;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0 10px;
        height: 26px;
        font-size: 12px;
        color: var(--st-text-primary, #eee);
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        border: none;
        max-width: 100%;
        opacity: 0.72;
        cursor: pointer;
        text-align: left;
        box-sizing: border-box;
        transition:
            background 0.1s,
            opacity 0.1s;
    }

    .chip:hover {
        background: rgba(255, 255, 255, 0.12);
        opacity: 0.92;
    }

    .chip--selected {
        opacity: 1;
    }

    .chip-icon {
        font-size: 16px;
        color: var(--st-text-secondary, #b0b0b0);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .chip--section-nav {
        justify-content: space-between;
    }

    .chip-chevron {
        font-size: 12px;
        opacity: 0.6;
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .chip-chevron--back {
        margin-right: 2px;
    }
</style>
