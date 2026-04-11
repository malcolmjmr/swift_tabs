<script>
    /**
     * New-window slide: default / popup / incognito rows; Space to confirm.
     * Layout and keyboard scroll sync mirror HistoryView.svelte.
     */
    import { tick, onDestroy } from "svelte";
    import { chromeService } from "../../services/chromeApi";
    import tabIcon from "../../icons/tab.svg";
    import floatLandscapeIcon from "../../icons/float-landscape.svg";
    import dominoMaskIcon from "../../icons/domino-mask.svg";

    /** @type {'new-default' | 'new-popup' | 'new-incognito'} */
    export let selectedRowKey = "new-default";

    const ROW_ICON_SRC = {
        tab: tabIcon,
        float_landscape_2: floatLandscapeIcon,
        domino_mask: dominoMaskIcon,
    };

    const ROWS = [
        {
            key: "new-default",
            rowIcon: "tab",
            label: "Tabbed Window",
        },
        {
            key: "new-popup",
            rowIcon: "float_landscape_2",
            label: "Popup Window",
        },
        {
            key: "new-incognito",
            rowIcon: "domino_mask",
            label: "Incognito",
        },
    ];

    let listEl = null;
    /** @type {ResizeObserver | null} */
    let listResizeObserver = null;

    export function moveSelection(delta) {
        const i = ROWS.findIndex((r) => r.key === selectedRowKey);
        const cur = i >= 0 ? i : 0;
        const ni = Math.max(0, Math.min(ROWS.length - 1, cur + delta));
        selectedRowKey = ROWS[ni].key;
    }

    export async function activateSelectedRow() {
        const row = ROWS.find((r) => r.key === selectedRowKey) ?? ROWS[0];
        if (row.key === "new-incognito") {
            await chromeService.createEmptyIncognitoWindow();
        } else if (row.key === "new-popup") {
            await chromeService.createEmptyPopupWindow();
        } else {
            await chromeService.createEmptyWindow();
        }
    }

    function onRowClick(row) {
        selectedRowKey = row.key;
        void activateSelectedRow();
    }

    const OVERFLOW_EPS = 2;

    /** @param {HTMLElement} el @param {HTMLElement} scroller */
    function contentOffsetTop(el, scroller) {
        const sr = scroller.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        return er.top - sr.top + scroller.scrollTop;
    }

    /**
     * @param {boolean} instant - true on resize: snap; false after selection: smooth.
     */
    function syncListScrollForSelection(instant = true) {
        if (!listEl || selectedRowKey == null) return;

        const scroller = listEl;
        function setScrollTop(target) {
            const maxScroll = Math.max(
                0,
                scroller.scrollHeight - scroller.clientHeight,
            );
            const t = Math.max(0, Math.min(maxScroll, target));
            if (Math.abs(scroller.scrollTop - t) < 2) return;
            if (instant) {
                scroller.scrollTop = t;
            } else {
                scroller.scrollTo({ top: t, behavior: "smooth" });
            }
        }

        if (scroller.scrollHeight <= scroller.clientHeight + OVERFLOW_EPS) {
            if (scroller.scrollTop !== 0) setScrollTop(0);
            return;
        }

        const items = scroller.querySelectorAll("button[data-create-row-key]");
        if (items.length === 0) return;

        const esc =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(selectedRowKey)
                : selectedRowKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const selectedEl = scroller.querySelector(
            `button[data-create-row-key="${esc}"]`,
        );
        if (!selectedEl) return;

        let selectedIndex = -1;
        items.forEach((el, i) => {
            if (el === selectedEl) selectedIndex = i;
        });
        if (selectedIndex < 0) return;

        const row0 = items[0];
        const row1 = items.length > 1 ? items[1] : row0;
        const rowStep =
            row1.offsetTop - row0.offsetTop ||
            row0.getBoundingClientRect().height;
        if (rowStep <= 0) return;

        const visibleCount = Math.max(
            1,
            Math.floor(scroller.clientHeight / rowStep),
        );
        let anchorIndex = Math.floor((visibleCount - 1) / 2);
        anchorIndex = Math.min(anchorIndex, items.length - 1);

        const ySel = contentOffsetTop(items[selectedIndex], scroller);
        const yAnchor = contentOffsetTop(items[anchorIndex], scroller);
        setScrollTop(ySel - yAnchor);
    }

    function scheduleListScrollAfterSelection() {
        tick().then(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    syncListScrollForSelection(false);
                });
            });
        });
    }

    $: if (listEl && typeof ResizeObserver !== "undefined") {
        listResizeObserver?.disconnect();
        listResizeObserver = new ResizeObserver(() => {
            syncListScrollForSelection(true);
        });
        listResizeObserver.observe(listEl);
    } else {
        listResizeObserver?.disconnect();
        listResizeObserver = null;
    }

    onDestroy(() => {
        listResizeObserver?.disconnect();
        listResizeObserver = null;
    });

    $: listScrollSyncKey =
        selectedRowKey != null
            ? ROWS.map((r) => r.key).join("|") + "|" + selectedRowKey
            : "";

    $: if (listEl && listScrollSyncKey) {
        scheduleListScrollAfterSelection();
    }
</script>

<div class="history-view">
    <div class="history-header">
        <span class="history-header-title">New window</span>
    </div>
    <ul
        class="history-list"
        bind:this={listEl}
        role="listbox"
        aria-label="New window options"
    >
        <div class="history-list-padding"></div>
        {#each ROWS as row (row.key)}
            <li>
                <button
                    type="button"
                    class="history-item"
                    class:selected={row.key === selectedRowKey}
                    data-create-row-key={row.key}
                    role="option"
                    aria-selected={row.key === selectedRowKey}
                    aria-label={row.key === selectedRowKey
                        ? `${row.label}. Press Space to create.`
                        : row.label}
                    on:click={() => onRowClick(row)}
                >
                    <img
                        src={ROW_ICON_SRC[row.rowIcon]}
                        alt=""
                        class="history-item-icon history-item-icon-svg"
                        aria-hidden="true"
                    />
                    <span class="history-title create-row-label"
                        >{row.label}</span
                    >
                    {#if row.key === selectedRowKey}
                        <kbd class="create-space-kbd">Space</kbd>
                    {/if}
                </button>
            </li>
        {/each}
        <div class="history-list-padding"></div>
    </ul>
</div>

<style>
    /* Aligned with HistoryView.svelte */
    .history-view {
        display: flex;
        flex-direction: column;
        width: 100%;
        flex: 1 1 0;
        min-height: 0;
        min-width: 0;
        box-sizing: border-box;
        font-size: 14px;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
    }

    .history-header {
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--st-text-muted, #555555);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 10px;
        height: 40px;
        padding: 0 2px;
        box-sizing: border-box;
        border-bottom: 1px solid #333333;
    }

    .history-header-title {
        flex: 1 1 0%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
    }

    .history-list {
        list-style: none;
        margin: 0;
        padding: 0 7px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .history-list-padding {
        min-height: 3px;
    }

    .history-list > li {
        margin: 0;
    }

    .history-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        width: 100%;
        padding: 8px 10px;
        border-radius: 6px;
        text-align: left;
        cursor: pointer;
        color: #ffffff;
        background: transparent;
        border: none;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px transparent;
        opacity: 0.8;
        transition:
            background 0.1s,
            box-shadow 0.1s;
    }

    .create-row-label {
        flex: 1 1 0%;
        min-width: 0;
        text-align: left;
    }

    .history-item-icon.history-item-icon-svg {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        object-fit: contain;
        padding: 0px;
        margin: 0px;
    }

    .history-item.selected,
    .history-item:hover {
        opacity: 1;
    }

    .history-item:hover {
        background-color: #333333;
    }

    .history-item.selected {
        background-color: #333333;
    }

    .history-title {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .create-space-kbd {
        flex-shrink: 0;
        margin: 0px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1px 7px 2px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888888);
        background-color: #333333;
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
    }

    .history-item.selected .create-space-kbd {
        color: var(--st-text-primary, #e8e8e8);
        border-color: rgba(255, 255, 255, 0.2);
    }
</style>
