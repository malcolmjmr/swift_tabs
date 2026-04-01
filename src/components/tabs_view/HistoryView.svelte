<script>
    /**
     * Recently closed sessions, open tab groups, saved session folders (bookmarks).
     * See docs/interfaces/interface_tabs_view.md
     */
    import { onMount } from "svelte";
    import { chromeService } from "../../services/chromeApi";

    /** Currently highlighted row key (for keyboard + Space) */
    export let selectedRowKey = null;

    let recentlyClosed = [];
    let groups = [];
    let savedFolders = [];
    let loadError = null;

    let rows = [];

    async function load() {
        loadError = null;
        try {
            const [closed, grp, folders] = await Promise.all([
                chromeService.getRecentlyClosed(),
                chromeService.getTabGroups(),
                chromeService.getSessionsFolderBookmarks(),
            ]);
            recentlyClosed = closed || [];
            groups = grp || [];
            savedFolders = folders || [];
            rebuildRows();
        } catch (e) {
            loadError = e?.message || "Failed to load";
            rows = [];
        }
    }

    function rebuildRows() {
        const r = [];
        let ids = [];
        for (const s of recentlyClosed) {
            const id = s.sessionId;
            if (id === null || ids.includes(id)) continue;
            ids.push(id);
            let label = "Session";
            if (s.tab) {
                label = s.tab.title || s.tab.url || "Tab";
            } else if (s.window) {
                const n = s.window.tabs?.length ?? 0;
                label =
                    n > 1
                        ? `Window (${n} tabs)`
                        : s.window.tabs?.[0]?.title || "Window";
            }
            r.push({
                key: `c-${id}`,
                sessionId: id,
                label,
                sub: "Recently closed",
            });
        }
        for (const g of groups) {
            r.push({
                key: `g-${g.id}`,
                groupId: g.id,
                windowId: g.windowId,
                label: g.title,
                sub: `${g.tabCount} tabs · group`,
            });
        }
        for (const f of savedFolders) {
            r.push({
                key: `b-${f.id}`,
                bookmarkFolderId: f.id,
                label: f.title,
                sub: "Saved session folder",
            });
        }
        rows = r;
        if (selectedRowKey && !r.some((x) => x.key === selectedRowKey)) {
            selectedRowKey = null;
        }
        if (!selectedRowKey && r.length) {
            selectedRowKey = r[0].key;
        }
    }

    onMount(() => {
        load();
    });

    export function refresh() {
        return load();
    }

    export function getRows() {
        return rows;
    }

    export function getSelectedRow() {
        return rows.find((x) => x.key === selectedRowKey) ?? rows[0];
    }

    export async function activateSelectedRow() {
        const row = getSelectedRow();
        if (row) await activateRow(row);
    }

    async function openSavedFolder(folderId) {
        const url = `chrome://bookmarks/?id=${folderId}`;
        await chromeService.createTab({ url, active: true });
    }

    export async function activateRow(row) {
        if (!row) return;
        if (row.sessionId) {
            await chromeService.restoreSession(row.sessionId);
            return;
        }
        if (row.groupId != null && row.windowId != null) {
            await chromeService.activateTabGroup(row.groupId, row.windowId);
            return;
        }
        if (row.bookmarkFolderId) {
            await openSavedFolder(row.bookmarkFolderId);
        }
    }

    export function moveSelection(delta) {
        if (!rows.length) return;
        const i = rows.findIndex((r) => r.key === selectedRowKey);
        const cur = i < 0 ? 0 : i;
        const ni = Math.max(0, Math.min(rows.length - 1, cur + delta));
        selectedRowKey = rows[ni].key;
    }
</script>

<div class="history-view">
    <div class="history-header">History &amp; groups</div>
    {#if loadError}
        <p class="muted">{loadError}</p>
    {:else if rows.length === 0}
        <p class="muted">
            No recently closed items, groups, or saved sessions.
        </p>
    {:else}
        <ul class="history-list" role="listbox" aria-label="History and groups">
            {#each rows as row (row.key)}
                <li>
                    <button
                        type="button"
                        class="history-item"
                        class:selected={row.key === selectedRowKey}
                        on:click={() => {
                            selectedRowKey = row.key;
                            activateRow(row);
                        }}
                    >
                        <span class="history-title">{row.label}</span>
                        <span class="history-sub">{row.sub}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .history-view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        min-height: 120px;
    }

    .history-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #a0a0a0);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .muted {
        margin: 0;
        font-size: 13px;
        color: var(--st-text-muted, #808080);
    }

    .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: min(45vh, 360px);
        overflow-y: auto;
    }

    .history-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        padding: 8px 10px;
        border-radius: 6px;
        text-align: left;
        cursor: pointer;
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-primary, #fff);
        border: 1px solid transparent;
        box-sizing: border-box;
    }

    .history-item:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .history-item.selected {
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.25));
    }

    .history-title {
        font-size: 13px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    .history-sub {
        font-size: 11px;
        color: var(--st-text-muted, #808080);
    }
</style>
