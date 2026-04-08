<script>
    /**
     * History: root categories (counts) + drill-in lists (recent, saved, other devices).
     * See docs/interfaces/interface_tabs_view.md
     */
    import { onMount, tick, onDestroy } from "svelte";
    import { chromeService } from "../../services/chromeApi";
    import historyIcon from "../../icons/history.svg";
    import folderIcon from "../../icons/folder.svg";
    import devicesIcon from "../../icons/devices.svg";
    import chevronRightIcon from "../../icons/chevron-right.svg";

    /** Currently highlighted row key (for keyboard + Space) */
    export let selectedRowKey = null;

    /** @type {'root' | 'recent' | 'saved' | 'devices' | 'deviceTabs'} */
    let historyPane = "root";

    let recentlyClosed = [];
    let savedFolders = [];
    /**
     * From GET_SESSIONS_OTHER_DEVICES: { deviceName, isPlaceholder?, windows: [{ key, tabs: [...] }] }[]
     */
    let deviceGroups = [];
    /** Device whose tabs are shown in `deviceTabs` */
    let activeDeviceName = null;

    let loadError = null;

    let rows = [];

    /** Scroll container for list rows (treadmill scroll sync). */
    let historyListEl = null;
    /** @type {ResizeObserver | null} */
    let listResizeObserver = null;

    const ROOT_KEYS = {
        recent: "root-recent",
        saved: "root-saved",
        devices: "root-devices",
    };

    /** Material-style row icon glyph name → bundled SVG (root sections, saved folders). */
    function sectionRowIconSrc(rowIcon) {
        switch (rowIcon) {
            case "history":
                return historyIcon;
            case "folder_special":
            case "folder":
                return folderIcon;
            case "devices":
                return devicesIcon;
            default:
                return historyIcon;
        }
    }

    function labelRecentlyClosedSession(s) {
        if (s.tab) {
            return s.tab.title || s.tab.url || "Tab";
        }
        if (s.window) {
            const n = s.window.tabs?.length ?? 0;
            return n > 1
                ? `Window (${n} tabs)`
                : s.window.tabs?.[0]?.title || "Window";
        }
        return "Session";
    }

    function hostnameFromUrl(url) {
        if (!url || typeof url !== "string") return "";
        try {
            const u = new URL(url);
            return u.hostname || "";
        } catch {
            return "";
        }
    }

    /** Chrome usually uses ms; some values arrive as UNIX seconds. */
    function normalizeSessionTimestampMs(raw) {
        if (raw == null || !Number.isFinite(Number(raw))) return NaN;
        const n = Number(raw);
        if (n < 1e12) return n * 1000;
        return n;
    }

    /** @param {number | undefined} lastModifiedRaw */
    function formatClosedAgo(lastModifiedRaw) {
        const lastModifiedMs = normalizeSessionTimestampMs(lastModifiedRaw);
        if (!Number.isFinite(lastModifiedMs)) return "";
        const sec = Math.max(0, (Date.now() - lastModifiedMs) / 1000);
        if (sec < 45) return "Just now";
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
        if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
        return new Date(lastModifiedMs).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    }

    /** Device tab subtitle: time only if today, else month/day + time. */
    function formatSessionSubtitleWhen(lastModifiedRaw) {
        const ms = normalizeSessionTimestampMs(lastModifiedRaw);
        if (!Number.isFinite(ms)) return "";
        const d = new Date(ms);
        const now = new Date();
        const isToday =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
        const timeStr = d.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
        });
        if (isToday) return timeStr;
        const dateStr = d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
        return `${dateStr}, ${timeStr}`;
    }

    function deviceTabCount(g) {
        if (!g || g.isPlaceholder) return 0;
        return (g.windows || []).reduce((n, w) => n + (w.tabs || []).length, 0);
    }

    async function load() {
        loadError = null;
        try {
            const [closed, folders] = await Promise.all([
                chromeService.getRecentlyClosed(),
                chromeService.getSessionsFolderBookmarks(),
            ]);
            let other = [];
            try {
                other = await chromeService.getSessionsOtherDevices();
            } catch (e) {
                console.warn("Swift Tabs: getSessionsOtherDevices failed", e);
            }
            recentlyClosed = closed || [];
            savedFolders = folders || [];
            deviceGroups = Array.isArray(other) ? other : [];
            rebuildRows();
        } catch (e) {
            loadError = e?.message || "Failed to load";
            rows = [];
        }
    }

    $: sectionHeading =
        historyPane === "deviceTabs"
            ? activeDeviceName || "Device"
            : historyPane === "recent"
              ? "Recent tabs"
              : historyPane === "saved"
                ? "Saved sessions"
                : historyPane === "devices"
                  ? "Other devices"
                  : "History";

    function rebuildRows() {
        if (historyPane === "root") {
            rows = [
                {
                    key: ROOT_KEYS.recent,
                    section: "recent",
                    label: "Recent tabs",
                    count: recentlyClosed.length,
                    rowIcon: "history",
                },
                {
                    key: ROOT_KEYS.saved,
                    section: "saved",
                    label: "Saved sessions",
                    count: savedFolders.length,
                    rowIcon: "folder_special",
                },
                {
                    key: ROOT_KEYS.devices,
                    section: "devices",
                    label: "Other devices",
                    count: deviceGroups.length,
                    rowIcon: "devices",
                },
            ];
        } else if (historyPane === "recent") {
            rows = recentlyClosed.map((s, i) => {
                const subTime = formatClosedAgo(s.lastModified);
                if (s.tab) {
                    return {
                        key: `c-${s.tab.sessionId}-${s.tab.index}`,
                        sessionId: s.tab.sessionId,
                        label: labelRecentlyClosedSession(s),
                        iconKind: "favicon",
                        favIconUrl: s.tab.favIconUrl || null,
                        rowIcon: "tab",
                        subDomain: hostnameFromUrl(s.tab.url),
                        subTime,
                    };
                }
                const first = s.window?.tabs?.[0];
                const n = s.window?.tabs?.length ?? 0;
                return {
                    key: `c-w-${s.lastModified}-${i}`,
                    sessionId: s.window?.sessionId ?? s.sessionId,
                    label: labelRecentlyClosedSession(s),
                    iconKind: "favicon",
                    favIconUrl: first?.favIconUrl ?? null,
                    rowIcon: "select_window_2",
                    subDomain:
                        hostnameFromUrl(first?.url) ||
                        (n > 1 ? `${n} tabs` : "") ||
                        "Window",
                    subTime,
                };
            });
        } else if (historyPane === "saved") {
            rows = savedFolders.map((f) => ({
                key: `b-${f.id}`,
                bookmarkFolderId: f.id,
                label: f.title,
                iconKind: "material",
                rowIcon: "folder",
                subDomain: "Bookmarks",
                subTime: "",
            }));
        } else if (historyPane === "devices") {
            rows = deviceGroups.map((g, i) => ({
                key: `dev-${g.deviceName.replace(/\s+/g, "-")}-${i}`,
                label: g.deviceName,
                count: deviceTabCount(g),
                rowIcon: "devices",
                isDeviceSummaryRow: true,
                deviceName: g.deviceName,
            }));
        } else if (historyPane === "deviceTabs") {
            const group = deviceGroups.find(
                (g) => g.deviceName === activeDeviceName,
            );
            const next = [];
            if (group?.windows?.length) {
                let wi = 0;
                for (const win of group.windows) {
                    wi += 1;
                    const tabs = win.tabs || [];
                    if (wi > 1) {
                        next.push({
                            key: `wd-${win.key}`,
                            isWindowDivider: true,
                        });
                    }
                    next.push({
                        key: `wh-${win.key}`,
                        isWindowHeader: true,
                        windowOrdinal: wi,
                        tabCount: tabs.length,
                        windowSessionId: win.windowSessionId || null,
                    });
                    let ti = 0;
                    for (const tab of tabs) {
                        const sid = tab.sessionId;
                        next.push({
                            key: `dt-${win.key}-t-${ti}`,
                            sessionId: sid,
                            label: tab.label || "Tab",
                            iconKind: "favicon",
                            favIconUrl: tab.favIconUrl || null,
                            rowIcon: "tab",
                            subDomain: hostnameFromUrl(tab.url) || "",
                            subTime: formatSessionSubtitleWhen(
                                tab.lastModified,
                            ),
                            isPlaceholder: sid == null || sid === "",
                        });
                        ti += 1;
                    }
                }
            }
            rows = next;
        } else {
            rows = [];
        }

        if (selectedRowKey && !rows.some((x) => x.key === selectedRowKey)) {
            selectedRowKey = null;
        }
        if (!selectedRowKey && rows.length) {
            if (historyPane === "deviceTabs") {
                const firstWin = rows.find(
                    (r) =>
                        r.isWindowHeader &&
                        !r.isWindowDivider &&
                        r.windowSessionId != null &&
                        r.windowSessionId !== "",
                );
                selectedRowKey =
                    firstWin?.key ??
                    rows.find(
                        (r) =>
                            !r.isWindowHeader &&
                            !r.isWindowDivider &&
                            !r.isPlaceholder &&
                            r.sessionId != null &&
                            r.sessionId !== "",
                    )?.key ??
                    rows.find((r) => !r.isWindowDivider)?.key ??
                    null;
            } else {
                const first =
                    rows.find(
                        (r) =>
                            !r.isWindowHeader &&
                            !r.isWindowDivider &&
                            !r.isPlaceholder &&
                            r.sessionId != null &&
                            r.sessionId !== "",
                    ) ??
                    rows.find((r) => !r.isWindowHeader && !r.isWindowDivider);
                selectedRowKey = first?.key ?? null;
            }
        }
    }

    function openSection(section) {
        if (section === "recent") historyPane = "recent";
        else if (section === "saved") historyPane = "saved";
        else if (section === "devices") historyPane = "devices";
        activeDeviceName = null;
        selectedRowKey = null;
        rebuildRows();
    }

    /** @returns {boolean} true if navigated up one level */
    export function goBack() {
        if (historyPane === "root") return false;
        if (historyPane === "deviceTabs") {
            historyPane = "devices";
            activeDeviceName = null;
            selectedRowKey = null;
            rebuildRows();
            return true;
        }
        historyPane = "root";
        activeDeviceName = null;
        selectedRowKey = null;
        rebuildRows();
        return true;
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
        if (selectedRowKey != null) {
            const r = rows.find((x) => x.key === selectedRowKey);
            if (r && !r.isWindowDivider) return r;
        }
        const first = rows.find((x) => !x.isWindowDivider);
        return first ?? null;
    }

    export async function activateSelectedRow() {
        const row = getSelectedRow();
        if (!row) return;
        await activateRow(row);
    }

    async function openSavedFolder(folderId) {
        const url = `chrome://bookmarks/?id=${folderId}`;
        await chromeService.createTab({ url, active: true });
    }

    export async function activateRow(row) {
        if (!row) return;
        if (row.isWindowDivider) return;
        if (row.isWindowHeader) {
            if (
                historyPane === "deviceTabs" &&
                row.windowSessionId != null &&
                row.windowSessionId !== ""
            ) {
                try {
                    await chromeService.restoreSession(row.windowSessionId);
                } catch (e) {
                    console.warn(
                        "Swift Tabs: restore window session failed",
                        e,
                    );
                }
            }
            return;
        }
        if (historyPane === "root" && row.section) {
            openSection(row.section);
            return;
        }
        if (historyPane === "devices" && row.isDeviceSummaryRow) {
            activeDeviceName = row.deviceName;
            historyPane = "deviceTabs";
            selectedRowKey = null;
            rebuildRows();
            return;
        }
        if (row.isPlaceholder) return;
        if (row.sessionId != null && row.sessionId !== "") {
            await chromeService.restoreSession(row.sessionId);
            return;
        }
        if (row.bookmarkFolderId) {
            await openSavedFolder(row.bookmarkFolderId);
        }
    }

    export function moveSelection(delta) {
        if (!rows.length) return;
        const selectableIdx =
            historyPane === "deviceTabs"
                ? rows
                      .map((r, i) => (!r.isWindowDivider ? i : -1))
                      .filter((i) => i >= 0)
                : rows
                      .map((r, i) => (!r.isWindowHeader ? i : -1))
                      .filter((i) => i >= 0);
        if (!selectableIdx.length) return;
        const curFull = rows.findIndex((r) => r.key === selectedRowKey);
        let pos = selectableIdx.indexOf(curFull);
        if (pos < 0) {
            pos = delta > 0 ? -1 : selectableIdx.length;
        }
        const ni = Math.max(0, Math.min(selectableIdx.length - 1, pos + delta));
        selectedRowKey = rows[selectableIdx[ni]].key;
    }

    function onRowClick(row) {
        selectedRowKey = row.key;
        void activateRow(row);
    }

    const OVERFLOW_EPS = 2;

    /** @param {HTMLElement} el @param {HTMLElement} scroller */
    function contentOffsetTop(el, scroller) {
        const sr = scroller.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        return er.top - sr.top + scroller.scrollTop;
    }

    /**
     * Match keyboard selection treadmill: fixed highlight slot when list overflows.
     * @param {boolean} instant - false after selection: smooth scroll; true on resize: snap.
     */
    function syncHistoryListScrollForSelection(instant = true) {
        if (!historyListEl || selectedRowKey == null || !rows.length) return;

        const scroller = historyListEl;
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

        const items = scroller.querySelectorAll("button[data-history-row-key]");
        if (items.length === 0) return;

        const esc =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(selectedRowKey)
                : selectedRowKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const selectedEl = scroller.querySelector(
            `button[data-history-row-key="${esc}"]`,
        );
        if (!selectedEl) return;

        let selectedIndex = -1;
        items.forEach((el, i) => {
            if (el === selectedEl) selectedIndex = i;
        });
        if (selectedIndex < 0) return;

        /** Mixed row heights (device window headers vs tabs, recent detail rows). */
        const stepSamples = [];
        const sampleEnd = Math.min(items.length, 24);
        for (let i = 1; i < sampleEnd; i++) {
            const d =
                contentOffsetTop(items[i], scroller) -
                contentOffsetTop(items[i - 1], scroller);
            if (d > 1) stepSamples.push(d);
        }
        const rowStep =
            stepSamples.length > 0
                ? stepSamples.reduce((a, b) => a + b, 0) / stepSamples.length
                : selectedEl.getBoundingClientRect().height;
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

    function scheduleHistoryListScrollAfterSelection() {
        tick().then(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    syncHistoryListScrollForSelection(false);
                });
            });
        });
    }

    $: if (historyListEl && typeof ResizeObserver !== "undefined") {
        listResizeObserver?.disconnect();
        listResizeObserver = new ResizeObserver(() => {
            syncHistoryListScrollForSelection(true);
        });
        listResizeObserver.observe(historyListEl);
    } else {
        listResizeObserver?.disconnect();
        listResizeObserver = null;
    }

    onDestroy(() => {
        listResizeObserver?.disconnect();
        listResizeObserver = null;
    });

    $: historyListScrollSyncKey =
        selectedRowKey != null && rows.length
            ? [
                  historyPane,
                  selectedRowKey,
                  rows.map((r) => r.key).join(","),
              ].join("|")
            : "";

    $: if (historyListEl && historyListScrollSyncKey) {
        scheduleHistoryListScrollAfterSelection();
    }
</script>

<div class="history-view">
    <div
        class="history-header"
        class:history-header--natural-case={historyPane === "deviceTabs"}
    >
        <span class="history-header-title">{sectionHeading}</span>
        {#if historyPane !== "root"}
            <button
                type="button"
                class="history-header-escape"
                aria-label={historyPane === "deviceTabs"
                    ? "Back to device list (Esc)"
                    : "Back to history (Esc)"}
                title="Esc, Backspace, or Delete"
                on:click={() => goBack()}
            >
                <kbd class="history-header-esc-kbd">Esc</kbd>
            </button>
        {/if}
    </div>
    {#if loadError}
        <p class="muted">{loadError}</p>
    {:else if historyPane !== "root" && rows.length === 0}
        <p class="muted">
            {#if historyPane === "recent"}
                No recently closed tabs or windows.
            {:else if historyPane === "saved"}
                No saved session folders.
            {:else if historyPane === "devices"}
                No synced devices. Turn on Chrome sync and open tabs on another
                device to see them here.
            {:else if historyPane === "deviceTabs"}
                No open tabs from this device.
            {:else}
                Nothing to show here.
            {/if}
        </p>
    {:else}
        <ul
            class="history-list"
            bind:this={historyListEl}
            role="listbox"
            aria-label={sectionHeading}
        >
            <div class="history-list-padding"></div>
            {#each rows as row (row.key)}
                <li
                    class:history-li-divider={row.isWindowDivider}
                    class:history-li--window-header={row.isWindowHeader &&
                        historyPane === "deviceTabs"}
                >
                    {#if row.isWindowDivider}
                        <div
                            class="history-window-divider-line"
                            aria-hidden="true"
                        ></div>
                    {:else if historyPane === "root" || historyPane === "devices"}
                        <button
                            type="button"
                            class="history-item"
                            class:history-item--section={true}
                            class:history-item--placeholder={row.isPlaceholder}
                            class:selected={row.key === selectedRowKey}
                            data-history-row-key={row.key}
                            on:click={() => onRowClick(row)}
                        >
                            <img
                                src={sectionRowIconSrc(row.rowIcon)}
                                alt=""
                                class="history-item-icon history-item-icon-svg"
                                aria-hidden="true"
                            />
                            <span class="history-title">{row.label}</span>
                            <span class="history-count">{row.count}</span>
                            <span class="history-row-spacer" aria-hidden="true"
                            ></span>
                            <img
                                src={chevronRightIcon}
                                alt=""
                                class="history-chevron history-chevron-svg"
                                aria-hidden="true"
                            />
                        </button>
                    {:else if historyPane === "deviceTabs"}
                        {#if row.isWindowHeader}
                            <button
                                type="button"
                                class="history-window-header history-window-header--action"
                                class:selected={row.key === selectedRowKey}
                                data-history-row-key={row.key}
                                disabled={!row.windowSessionId}
                                aria-label={row.key === selectedRowKey &&
                                row.windowSessionId
                                    ? `Restore window, Space (${row.tabCount} tabs)`
                                    : `Window ${row.windowOrdinal}, ${row.tabCount} tabs${row.windowSessionId ? ". Select for Space to restore window." : "."}`}
                                on:click={() => onRowClick(row)}
                            >
                                <div class="history-window-header-main">
                                    <span class="history-window-header-title">
                                        {#if row.key === selectedRowKey && row.windowSessionId}
                                            <span
                                                >Restore - Window {row.windowOrdinal}
                                                ({row.tabCount}
                                                tabs)</span
                                            >
                                            <span
                                                class="history-window-header-spacer"
                                                aria-hidden="true"
                                            ></span>

                                            <kbd
                                                class="history-window-header-kbd"
                                                >Space</kbd
                                            >
                                        {:else}
                                            Window {row.windowOrdinal} ({row.tabCount}
                                            tabs)
                                        {/if}
                                    </span>
                                </div>
                            </button>
                        {:else}
                            <button
                                type="button"
                                class="history-item"
                                class:history-item--placeholder={row.isPlaceholder}
                                class:selected={row.key === selectedRowKey}
                                data-history-row-key={row.key}
                                on:click={() => onRowClick(row)}
                            >
                                {#if row.favIconUrl}
                                    <img
                                        src={row.favIconUrl}
                                        alt=""
                                        class="history-item-icon history-item-icon-img"
                                    />
                                {:else}
                                    <span
                                        class="history-item-icon-fallback"
                                        aria-hidden="true"
                                        >{(row.label || "?")
                                            .charAt(0)
                                            .toUpperCase()}</span
                                    >
                                {/if}
                                <div class="history-detail-text">
                                    <span class="history-title"
                                        >{row.label}</span
                                    >
                                    {#if row.subDomain || row.subTime}
                                        <div class="history-sub-row">
                                            {#if row.subDomain}
                                                <span class="history-sub-domain"
                                                    >{row.subDomain}</span
                                                >
                                            {/if}
                                            {#if row.subTime}
                                                <span class="history-sub-time"
                                                    >{row.subTime}</span
                                                >
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </button>
                        {/if}
                    {:else}
                        <button
                            type="button"
                            class="history-item"
                            class:history-item--placeholder={row.isPlaceholder}
                            class:selected={row.key === selectedRowKey}
                            data-history-row-key={row.key}
                            on:click={() => onRowClick(row)}
                        >
                            {#if row.iconKind === "favicon"}
                                {#if row.favIconUrl}
                                    <img
                                        src={row.favIconUrl}
                                        alt=""
                                        class="history-item-icon history-item-icon-img"
                                    />
                                {:else}
                                    <span
                                        class="history-item-icon-fallback"
                                        aria-hidden="true"
                                        >{(row.label || "?")
                                            .charAt(0)
                                            .toUpperCase()}</span
                                    >
                                {/if}
                            {:else}
                                <img
                                    src={sectionRowIconSrc(row.rowIcon)}
                                    alt=""
                                    class="history-item-icon history-item-icon-svg"
                                    aria-hidden="true"
                                />
                            {/if}
                            <div class="history-detail-text">
                                <span class="history-title">{row.label}</span>
                                {#if row.subDomain || row.subTime}
                                    <div class="history-sub-row">
                                        {#if row.subDomain}
                                            <span class="history-sub-domain"
                                                >{row.subDomain}</span
                                            >
                                        {/if}
                                        {#if row.subTime}
                                            <span class="history-sub-time"
                                                >{row.subTime}</span
                                            >
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </button>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
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

    .history-header--natural-case {
        text-transform: none;
        letter-spacing: 0.02em;
    }

    .history-header-title {
        flex: 1 1 0%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
    }

    .history-header-escape {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 28px;
        margin: 0;
        padding: 0 6px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: transparent;
    }

    .history-header-escape:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.12));
    }

    .history-header-escape:hover .history-header-esc-kbd {
        opacity: 1;
        color: var(--st-text-primary, #e8e8e8);
    }

    .history-header-esc-kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2em;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        letter-spacing: 0.02em;
        color: var(--st-text-muted, #a0a0a0);
        background: #333;
        opacity: 0.95;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
    }

    .muted {
        margin: 0 10px;
        font-size: 14px;
        color: var(--st-text-muted, #808080);
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
        height: 10px;
    }

    .history-list > li {
        margin: 0;
    }

    .history-li-divider {
        list-style: none;
        margin: 0;
        padding: 4px 3px 2px;
        pointer-events: none;
    }

    .history-window-divider-line {
        height: 1px;
        background: var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 1px;
    }

    .history-window-header--action {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        width: 100%;
        margin-top: 0;
        padding: 0;
        border: none;
        border-radius: 6px;
        background: transparent;
        box-sizing: border-box;
        cursor: pointer;
        text-align: left;
        font: inherit;
        color: var(--st-text-muted, #888888);
        transition: background 0.1s;
    }

    .history-window-header--action:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .history-window-header--action:hover:not(:disabled):not(.selected) {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
    }

    .history-window-header--action.selected {
        background-color: #333333;
        color: var(--st-text-primary, #e8e8e8);
    }

    .history-window-header-main {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        padding: 6px 12px;
        width: 100%;
        box-sizing: border-box;
        font-size: 15px;

        text-transform: none;
        letter-spacing: 0.01em;
    }

    .history-window-header-icon {
        font-size: 24px;

        text-align: center;
        opacity: 0.9;
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 48;
    }

    .history-window-header--action.selected .history-window-header-icon {
        opacity: 1;
    }

    .history-window-header-title {
        flex-grow: 1;
        min-width: 0;
        text-align: left;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .history-window-header-spacer {
        flex: 1 1 0%;
        min-width: 4px;
    }

    .history-window-header-kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 2px;
        padding: 1px 7px 2px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888888);
        transition: background 0.1s;
        background-color: #333333;

        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
    }

    .history-window-header-kbd::before {
        margin-right: 1px;
        font-weight: 500;
        opacity: 0.85;
    }

    .history-window-header-kbd::after {
        margin-left: 1px;
        font-weight: 500;
        opacity: 0.85;
    }

    .history-window-header--action.selected .history-window-header-kbd {
        color: var(--st-text-primary, #e8e8e8);
        border-color: rgba(255, 255, 255, 0.2);
    }

    /* Align with ListView.svelte list-view-item */
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
        transition:
            background 0.1s,
            box-shadow 0.1s;
    }

    .history-item--section {
        align-items: center;
    }

    .history-item--section .history-title {
        flex: 999 1 0%;
        min-width: 0;
    }

    .history-item--section .history-count {
        flex-shrink: 0;
    }

    .history-item--section .history-row-spacer {
        flex: 1 1 0%;
        min-width: 0;
    }

    .history-item--section .history-chevron-svg {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        object-fit: contain;
        opacity: 0.45;
    }

    .history-item-icon.history-item-icon-svg {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        object-fit: contain;
        opacity: 0.55;
    }

    .history-item-icon-img {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        margin: 0;
        object-fit: contain;
    }

    .history-item-icon-fallback {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        min-width: 24px;
        min-height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #808080);
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .history-item.selected .history-item-icon.history-item-icon-svg,
    .history-item:hover .history-item-icon.history-item-icon-svg {
        opacity: 0.72;
    }

    .history-count {
        font-size: 14px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--st-text-muted, #808080);
    }

    .history-detail-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
        flex: 1 1 0%;
        text-align: left;
    }

    .history-detail-text .history-title {
        width: 100%;
    }

    .history-item:hover {
        background-color: #333333;
    }

    .history-item.selected {
        background-color: #333333;
    }

    .history-item--placeholder {
        cursor: default;
        opacity: 0.9;
    }

    .history-item--placeholder:hover:not(.selected) {
        background-color: transparent;
    }

    .history-item--placeholder.selected {
        background-color: #2a2a2a;
    }

    .history-title {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .history-sub-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        width: 100%;
        min-width: 0;
    }

    .history-sub-domain {
        flex: 1 1 0%;
        min-width: 0;
        font-size: 12px;
        font-weight: 400;
        color: var(--st-text-muted, #808080);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
    }

    .history-sub-time {
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
        color: var(--st-text-muted, #808080);
        text-align: left;
    }
</style>
