<script>
    import { createEventDispatcher, tick } from "svelte";
    import { chromeService } from "../../../services/chromeApi";
    import { isSwiftAppsRow, resultFaviconKey } from "../omniboxShared.js";
    import { collectFirstAppsFromFolder } from "./appsFolderPreview.js";
    import OmniboxAppsFolderModal from "./OmniboxAppsFolderModal.svelte";
    import OmniboxSectionApps from "./OmniboxSectionApps.svelte";
    import OmniboxSectionAppsDetailPanel from "./OmniboxSectionAppsDetailPanel.svelte";

    export let dataEnabled = false;
    export let isActiveSlide = false;
    export let query = "";
    export let debouncedQuery = "";
    export let sectionResultsOpen = false;

    const dispatch = createEventDispatcher();

    let resultsListEl;
    /** @type {Record<string, object>} */
    let appsRegistryById = {};
    /** @type {object[]} */
    let appsRegistryList = [];
    let appsLayout = { version: 1, items: [] };
    /** @type {'home' | 'folder' | 'detail' | 'library'} */
    let appsView = "home";
    /** @type {{ title: string, items: object[] }[]} */
    let appsFolderStack = [];
    let detailAppId = null;
    /** @type {'home' | 'folder' | 'library'} */
    let detailOpenedFrom = "home";
    /** @type {number | null} */
    let appsDragFromIndex = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let appsLongPressTimer = null;
    /** @type {HTMLElement | undefined} */
    let appsIconFlowEl;
    let appsSuppressNextClick = false;
    let appsFolderDropRailActive = false;
    /** @type {object[]} */
    let recentHistoryPreview = [];

    /** @type {object[]} */
    let visibleResults = [];
    let selectedResultIndex = 0;
    /** @type {Record<string, boolean>} */
    let faviconFailedByKey = {};

    /** @type {{ id: string, title: string, items: object[] } | null} */
    let folderModalRoot = null;

    let loadStarted = false;

    const APPS_LONG_PRESS_MS = 480;

    $: if (dataEnabled && !loadStarted) {
        loadStarted = true;
        void loadAppsState();
    }

    $: if (!isActiveSlide) {
        appsView = "home";
        appsFolderStack = [];
        detailAppId = null;
        folderModalRoot = null;
    }

    $: debouncedQuery, applyAppsVisibleResults();

    /** @param {object[]} items @param {string} folderId */
    function findFolderInTree(items, folderId) {
        for (const it of items || []) {
            if (it.kind === "folder") {
                if (it.id === folderId) return it;
                const inner = findFolderInTree(it.items || [], folderId);
                if (inner) return inner;
            }
        }
        return null;
    }

    function resyncAppsFolderStackFromLayout() {
        const next = [];
        for (const frame of appsFolderStack) {
            const node = findFolderInTree(appsLayout.items || [], frame.id);
            if (!node || node.kind !== "folder") break;
            next.push({
                id: node.id,
                title: node.title || "",
                items: JSON.parse(JSON.stringify(node.items || [])),
            });
        }
        appsFolderStack = next;
        if (appsView === "folder" && next.length === 0) {
            appsView = "home";
        }
    }

    async function loadAppsState() {
        try {
            const r = await chromeService.appsGetState();
            if (r && typeof r === "object" && r.error) return;
            appsRegistryList = Array.isArray(r?.apps) ? r.apps : [];
            appsLayout =
                r?.layout && typeof r.layout === "object"
                    ? r.layout
                    : { version: 1, items: [] };
            appsRegistryById = Object.fromEntries(
                appsRegistryList.map((a) => [a.id, a]),
            );
            recentHistoryPreview = Array.isArray(r?.recentHistoryPreview)
                ? r.recentHistoryPreview
                : [];
            resyncAppsFolderStackFromLayout();
            applyAppsVisibleResults();
        } catch (e) {
            console.warn("Omnibox: apps state", e);
        }
    }

    /** Inline folder so apps can be dragged to the home rail. */
    function openFolderForBrowse(folder) {
        openAppsFolder(folder);
    }

    function isAppsIconFlowView() {
        return (
            appsView === "home" ||
            appsView === "folder" ||
            appsView === "library"
        );
    }

    /** Exported for omnibox shell strip navigation. */
    export function consumesEmptyQueryStripArrows() {
        if (!isActiveSlide || !sectionResultsOpen) return false;
        const qEmpty = !query.trim();
        return qEmpty && isAppsIconFlowView();
    }

    /** @returns {number[][]} */
    function appsFlowRowIndices() {
        const root = appsIconFlowEl;
        const n = visibleResults.length;
        if (!root || n === 0) return [];
        const tiles = [...root.querySelectorAll(".apps-icon-slot")];
        if (tiles.length !== n) return [];
        /** @type {number[][]} */
        const rows = [];
        let lastTop = NaN;
        for (let i = 0; i < n; i++) {
            const top = tiles[i].offsetTop;
            if (rows.length === 0 || Math.abs(top - lastTop) > 2) {
                rows.push([i]);
                lastTop = top;
            } else {
                rows[rows.length - 1].push(i);
            }
        }
        return rows;
    }

    async function moveAppsFlowHorizontal(d) {
        const n = visibleResults.length;
        if (n === 0) return;
        await tick();
        const rows = appsFlowRowIndices();
        if (rows.length === 0) {
            selectedResultIndex = Math.max(
                0,
                Math.min(n - 1, selectedResultIndex + d),
            );
            scrollSelectedIntoView();
            return;
        }
        for (let r = 0; r < rows.length; r++) {
            const cidx = rows[r].indexOf(selectedResultIndex);
            if (cidx < 0) continue;
            const nc = cidx + d;
            if (nc >= 0 && nc < rows[r].length) {
                selectedResultIndex = rows[r][nc];
            } else if (d > 0 && r + 1 < rows.length) {
                selectedResultIndex = rows[r + 1][0];
            } else if (d < 0 && r > 0) {
                const pr = rows[r - 1];
                selectedResultIndex = pr[pr.length - 1];
            }
            scrollSelectedIntoView();
            return;
        }
    }

    async function moveAppsFlowVertical(dRow) {
        const n = visibleResults.length;
        if (n === 0) return;
        await tick();
        const rows = appsFlowRowIndices();
        if (rows.length === 0) {
            selectedResultIndex = Math.max(
                0,
                Math.min(n - 1, selectedResultIndex + dRow * 6),
            );
            scrollSelectedIntoView();
            return;
        }
        for (let r = 0; r < rows.length; r++) {
            const cidx = rows[r].indexOf(selectedResultIndex);
            if (cidx < 0) continue;
            const newR = r + dRow;
            if (newR < 0 || newR >= rows.length) {
                scrollSelectedIntoView();
                return;
            }
            const targetRow = rows[newR];
            const newCi = Math.min(cidx, targetRow.length - 1);
            selectedResultIndex = targetRow[newCi];
            scrollSelectedIntoView();
            return;
        }
    }

    function clearAppsLongPressTimer() {
        if (appsLongPressTimer != null) {
            clearTimeout(appsLongPressTimer);
            appsLongPressTimer = null;
        }
    }

    function appsIconPointerDown(i, item, e) {
        if (e.button !== 0) return;
        clearAppsLongPressTimer();
        if (!isSwiftAppsRow(item)) return;
        appsLongPressTimer = setTimeout(() => {
            appsLongPressTimer = null;
            appsSuppressNextClick = true;
            selectedResultIndex = i;
            if (item.type === "stApp") {
                openAppsDetail(item.app.id);
            } else if (item.type === "stLibApp") {
                openAppsDetail(item.app.id, "library");
            } else if (item.type === "stFolder") {
                openFolderForBrowse(item.folder);
            } else if (item.type === "stAllApps") {
                openAppsLibrary();
            }
        }, APPS_LONG_PRESS_MS);
    }

    function appsIconPointerUpCancel() {
        clearAppsLongPressTimer();
    }

    function matchesAppQuery(app, q) {
        if (!q) return true;
        const d = (app.domain || "").toLowerCase();
        const t = (app.title || "").toLowerCase();
        const dt = (app.displayTitle || "").toLowerCase();
        return d.includes(q) || t.includes(q) || dt.includes(q);
    }

    function folderMatchesQuery(folder, q) {
        if (!q) return true;
        const title = (folder.title || "").toLowerCase();
        if (title.includes(q)) return true;
        for (const ch of folder.items || []) {
            if (ch.kind === "app") {
                const app = appsRegistryById[ch.appId];
                if (app && matchesAppQuery(app, q)) return true;
            } else if (ch.kind === "folder" && folderMatchesQuery(ch, q)) {
                return true;
            }
        }
        return false;
    }

    function countFolderEntries(folder) {
        let n = 0;
        for (const ch of folder.items || []) {
            if (ch.kind === "app") n += 1;
            else if (ch.kind === "folder") n += countFolderEntries(ch);
        }
        return n;
    }

    function buildAppsHomeRows(q) {
        const rows = [];
        for (const it of appsLayout.items || []) {
            if (it.kind === "app") {
                const app = appsRegistryById[it.appId];
                if (!app) continue;
                if (!matchesAppQuery(app, q)) continue;
                rows.push({
                    type: "stApp",
                    app,
                    title: app.displayTitle || app.title || app.domain,
                    subtitle: app.domain,
                });
            } else if (it.kind === "folder") {
                if (!folderMatchesQuery(it, q)) continue;
                rows.push({
                    type: "stFolder",
                    folder: it,
                    title: it.title || "",
                    subtitle: `${countFolderEntries(it)} items`,
                    folderPreviewApps: collectFirstAppsFromFolder(
                        it,
                        appsRegistryById,
                        9,
                    ),
                });
            }
        }
        rows.push({
            type: "stAllApps",
            title: "All apps",
            subtitle: "Browse full library",
            folderPreviewApps: recentHistoryPreview.slice(0, 9),
        });
        return rows;
    }

    function buildAppsFolderRows(q) {
        const top = appsFolderStack[appsFolderStack.length - 1];
        const rows = [];
        if (!top?.items) return rows;
        for (const it of top.items) {
            if (it.kind === "app") {
                const app = appsRegistryById[it.appId];
                if (!app) continue;
                if (!matchesAppQuery(app, q)) continue;
                rows.push({
                    type: "stApp",
                    app,
                    title: app.displayTitle || app.title || app.domain,
                    subtitle: app.domain,
                });
            } else if (it.kind === "folder") {
                if (!folderMatchesQuery(it, q)) continue;
                rows.push({
                    type: "stFolder",
                    folder: it,
                    title: it.title || "",
                    subtitle: `${countFolderEntries(it)} items`,
                    folderPreviewApps: collectFirstAppsFromFolder(
                        it,
                        appsRegistryById,
                        9,
                    ),
                });
            }
        }
        return rows;
    }

    function buildAppsLibraryRows(q) {
        const rows = [];
        const historyRank = new Map(
            recentHistoryPreview.map((a, idx) => [a.id, idx]),
        );
        const sorted = [...appsRegistryList].sort((a, b) => {
            const ta = a.lastOpenedAt || 0;
            const tb = b.lastOpenedAt || 0;
            if (tb !== ta) return tb - ta;
            const ra = historyRank.get(a.id);
            const rb = historyRank.get(b.id);
            if (ra !== rb) return (ra ?? 1e9) - (rb ?? 1e9);
            const na = (
                a.displayTitle ||
                a.title ||
                a.domain ||
                ""
            ).toLowerCase();
            const nb = (
                b.displayTitle ||
                b.title ||
                b.domain ||
                ""
            ).toLowerCase();
            return na.localeCompare(nb);
        });
        for (const app of sorted) {
            //if (!matchesAppQuery(app, q)) continue;
            rows.push({
                type: "stLibApp",
                app,
                title: app.displayTitle || app.title || app.domain,
                subtitle: app.domain,
            });
        }
        return rows;
    }

    function applyAppsVisibleResults() {
        const q = debouncedQuery.trim().toLowerCase();
        if (appsView === "detail") {
            visibleResults = [];
            selectedResultIndex = 0;
            return;
        }
        if (appsView === "library") {
            visibleResults = buildAppsLibraryRows(q);
            selectedResultIndex = Math.min(
                selectedResultIndex,
                Math.max(0, visibleResults.length - 1),
            );
            return;
        }
        if (appsView === "folder") {
            visibleResults = buildAppsFolderRows(q);
            selectedResultIndex = Math.min(
                selectedResultIndex,
                Math.max(0, visibleResults.length - 1),
            );
            return;
        }
        visibleResults = buildAppsHomeRows(q);
        selectedResultIndex = Math.min(
            selectedResultIndex,
            Math.max(0, visibleResults.length - 1),
        );
    }

    function openAppsFolder(folder) {
        appsFolderStack = [
            ...appsFolderStack,
            {
                id: folder.id,
                title: folder.title || "",
                items: JSON.parse(JSON.stringify(folder.items || [])),
            },
        ];
        appsView = "folder";
        applyAppsVisibleResults();
        selectedResultIndex = 0;
    }

    function openFolderModal(folder) {
        folderModalRoot = {
            id: folder.id,
            title: folder.title || "",
            items: JSON.parse(JSON.stringify(folder.items || [])),
        };
    }

    function closeFolderModal() {
        folderModalRoot = null;
    }

    async function modalLaunchApp(app) {
        await launchSwiftApp(app);
        closeFolderModal();
        dispatch("submit");
        dispatch("close");
    }

    function openAppsLibrary() {
        appsView = "library";
        applyAppsVisibleResults();
        selectedResultIndex = 0;
    }

    function openAppsDetail(appId, from) {
        detailAppId = appId;
        detailOpenedFrom =
            from ||
            (appsView === "library"
                ? "library"
                : appsView === "folder"
                  ? "folder"
                  : "home");
        appsView = "detail";
        visibleResults = [];
        selectedResultIndex = 0;
    }

    function appsDetailBack() {
        appsView = detailOpenedFrom;
        detailAppId = null;
        applyAppsVisibleResults();
        selectedResultIndex = 0;
    }

    function appIdOnHomeLayout(appId) {
        function walk(items) {
            for (const it of items || []) {
                if (it.kind === "app" && it.appId === appId) return true;
                if (it.kind === "folder" && walk(it.items)) return true;
            }
            return false;
        }
        return walk(appsLayout.items);
    }

    async function launchSwiftApp(app) {
        if (!app?.defaultUrl) return;
        await chromeService.createTab({ url: app.defaultUrl, active: true });
        await chromeService.appsPutApp({
            id: app.id,
            lastOpenedAt: Date.now(),
        });
    }

    async function appsHandlePrimaryAction() {
        const item = visibleResults[selectedResultIndex];
        if (!item) return;
        if (item.type === "stApp" || item.type === "stLibApp") {
            await launchSwiftApp(item.app);
            dispatch("submit");
            dispatch("close");
            return;
        }
        if (item.type === "stFolder") {
            openFolderForBrowse(item.folder);
            return;
        }
        if (item.type === "stAllApps") {
            openAppsLibrary();
        }
    }

    async function appsHandleSecondaryAction() {
        const item = visibleResults[selectedResultIndex];
        if (!item) return;
        if (item.type === "stApp" || item.type === "stLibApp") {
            openAppsDetail(
                item.app.id,
                appsView === "library" ? "library" : undefined,
            );
            return;
        }
        if (item.type === "stFolder") {
            openFolderForBrowse(item.folder);
            return;
        }
        if (item.type === "stAllApps") {
            openAppsLibrary();
        }
    }

    async function onSwiftAppsClick(item) {
        if (item.type === "stApp" || item.type === "stLibApp") {
            await launchSwiftApp(item.app);
            dispatch("submit");
            dispatch("close");
            return;
        }
        if (item.type === "stFolder") openFolderForBrowse(item.folder);
        else if (item.type === "stAllApps") openAppsLibrary();
    }

    function onSwiftAppsDblClick(item) {
        if (item.type === "stApp" || item.type === "stLibApp") {
            openAppsDetail(
                item.app.id,
                item.type === "stLibApp" ? "library" : undefined,
            );
            return;
        }
        if (item.type === "stFolder") openFolderForBrowse(item.folder);
        else if (item.type === "stAllApps") openAppsLibrary();
    }

    function onResultRowClick(i, item) {
        if (appsSuppressNextClick) {
            appsSuppressNextClick = false;
            selectedResultIndex = i;
            return;
        }
        selectedResultIndex = i;
        void onSwiftAppsClick(item);
    }

    function onResultRowDblClick(i, item) {
        selectedResultIndex = i;
        onSwiftAppsDblClick(item);
    }

    function onAppsDragStart(i, item, e) {
        if (!isSwiftAppsRow(item)) return;
        if (
            item.type === "stAllApps" ||
            item.type === "stLibApp" ||
            appsView === "library"
        )
            return;
        appsDragFromIndex = i;
        if (appsView === "folder" && item.type === "stApp") {
            appsFolderDropRailActive = true;
        }
        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(i));
            const el = e.currentTarget;
            if (
                el instanceof HTMLElement &&
                el.classList.contains("apps-icon-tile")
            ) {
                const r = el.getBoundingClientRect();
                e.dataTransfer.setDragImage(el, r.width / 2, r.height / 2);
            }
        } catch (_) {}
    }

    function onAppsDragOver(i, e) {
        if (appsDragFromIndex === null) return;
        e.preventDefault();
        try {
            e.dataTransfer.dropEffect = "move";
        } catch (_) {}
    }

    function onAppsDragOverHomeRail(e) {
        if (appsDragFromIndex === null) return;
        e.preventDefault();
        try {
            e.dataTransfer.dropEffect = "move";
        } catch (_) {}
    }

    async function onAppsDropHomeRail(e) {
        if (appsDragFromIndex === null) return;
        e.preventDefault();
        const from = appsDragFromIndex;
        appsDragFromIndex = null;
        const fromItem = visibleResults[from];
        if (fromItem?.type !== "stApp" || appsView !== "folder") return;
        await chromeService.appsMoveAppToHomeRoot(fromItem.app.id);
        await loadAppsState();
    }

    async function onAppsDrop(i, item, e) {
        if (appsDragFromIndex === null) return;
        e.preventDefault();
        const from = appsDragFromIndex;
        appsDragFromIndex = null;
        if (from === i) return;

        const fromItem = visibleResults[from];
        const toItem = visibleResults[i];

        if (fromItem?.type === "stApp" && toItem?.type === "stFolder") {
            await chromeService.appsMoveAppIntoFolder(
                fromItem.app.id,
                toItem.folder.id,
            );
            await loadAppsState();
            return;
        }

        if (
            fromItem?.type === "stApp" &&
            toItem?.type === "stApp" &&
            appsView === "home"
        ) {
            await chromeService.appsMergeIntoFolder(
                fromItem.app.id,
                toItem.app.id,
            );
            appsFolderStack = [];
            appsView = "home";
            await loadAppsState();
            return;
        }

        if (appsView !== "home" && appsView !== "folder") return;
        const list =
            appsView === "home"
                ? [...(appsLayout.items || [])]
                : [
                      ...(appsFolderStack[appsFolderStack.length - 1]?.items ||
                          []),
                  ];
        const layoutIndexFrom = homeRowIndexToLayoutIndex(from);
        const layoutIndexTo = homeRowIndexToLayoutIndex(i);
        if (layoutIndexFrom < 0 || layoutIndexTo < 0) return;
        const [removed] = list.splice(layoutIndexFrom, 1);
        list.splice(layoutIndexTo, 0, removed);
        if (appsView === "home") {
            appsLayout = { ...appsLayout, items: list };
            await chromeService.appsPutLayout(appsLayout);
        } else {
            const stack = [...appsFolderStack];
            const prevTop = stack[stack.length - 1];
            const top = { ...prevTop, items: list };
            stack[stack.length - 1] = top;
            appsFolderStack = stack;
            await syncFolderByIdToLayout(top.id, list);
        }
        await loadAppsState();
        applyAppsVisibleResults();
    }

    async function removeFolderFromHomeRoot(folderId) {
        const prev = appsLayout.items || [];
        const next = prev.filter(
            (it) => !(it.kind === "folder" && it.id === folderId),
        );
        if (next.length === prev.length) return;
        appsLayout = { ...appsLayout, items: next };
        await chromeService.appsPutLayout(appsLayout);
    }

    async function onAppsDragEnd() {
        appsFolderDropRailActive = false;
        const from = appsDragFromIndex;
        appsDragFromIndex = null;
        if (from == null) return;
        const item = visibleResults[from];
        if (!item || !isSwiftAppsRow(item)) return;
        if (item.type === "stAllApps" || item.type === "stLibApp") return;
        if (appsView !== "home") return;
        if (item.type === "stApp") {
            await chromeService.appsRemoveFromHome(item.app.id);
            await loadAppsState();
        } else if (item.type === "stFolder") {
            await removeFolderFromHomeRoot(item.folder.id);
            await loadAppsState();
        }
    }

    function homeRowIndexToLayoutIndex(rowIndex) {
        const item = visibleResults[rowIndex];
        if (!item || item.type === "stAllApps") return -1;
        const list =
            appsView === "home"
                ? appsLayout.items || []
                : appsFolderStack[appsFolderStack.length - 1]?.items || [];
        for (let j = 0; j < list.length; j++) {
            const it = list[j];
            if (
                it.kind === "app" &&
                item.type === "stApp" &&
                it.appId === item.app.id
            )
                return j;
            if (
                it.kind === "folder" &&
                item.type === "stFolder" &&
                it.id === item.folder.id
            )
                return j;
        }
        return -1;
    }

    function replaceFolderItemsInTree(items, folderId, newItems) {
        return (items || []).map((node) => {
            if (node.kind === "folder" && node.id === folderId) {
                return { ...node, items: newItems };
            }
            if (node.kind === "folder") {
                return {
                    ...node,
                    items: replaceFolderItemsInTree(
                        node.items || [],
                        folderId,
                        newItems,
                    ),
                };
            }
            return node;
        });
    }

    async function syncFolderByIdToLayout(folderId, newItems) {
        const tree = replaceFolderItemsInTree(
            JSON.parse(JSON.stringify(appsLayout.items || [])),
            folderId,
            newItems,
        );
        appsLayout = { ...appsLayout, items: tree };
        await chromeService.appsPutLayout(appsLayout);
    }

    function scrollSelectedIntoView() {
        const tile = resultsListEl?.querySelector(".apps-icon-slot--selected");
        if (tile) {
            tile.scrollIntoView({ block: "nearest", behavior: "smooth" });
            return;
        }
        const selected = resultsListEl?.querySelector(".result-item.selected");
        selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function markResultFaviconFailed(item) {
        faviconFailedByKey = {
            ...faviconFailedByKey,
            [resultFaviconKey(item)]: true,
        };
    }

    /** @returns {boolean} */
    export function handleOmniboxEscape() {
        if (folderModalRoot) {
            closeFolderModal();
            return true;
        }
        return false;
    }

    /** @returns {boolean} */
    export function handleOmniboxBackspace() {
        if (appsView === "detail") {
            appsDetailBack();
            return true;
        }
        if (appsView === "library") {
            appsView = "home";
            applyAppsVisibleResults();
            return true;
        }
        if (appsView === "folder" && appsFolderStack.length > 0) {
            appsFolderStack = appsFolderStack.slice(0, -1);
            if (appsFolderStack.length === 0) appsView = "home";
            applyAppsVisibleResults();
            return true;
        }
        return false;
    }

    function moveSelectionLinear(direction) {
        const maxIndex = Math.max(0, visibleResults.length - 1);
        selectedResultIndex =
            (selectedResultIndex + direction + maxIndex + 1) % (maxIndex + 1);
        scrollSelectedIntoView();
    }

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        const qEmpty = !query.trim();

        if (appsView === "detail") {
            if (qEmpty && event.key === " " && sectionResultsOpen) {
                event.preventDefault();
                const app = appsRegistryById[detailAppId];
                if (app) {
                    void launchSwiftApp(app).then(() => {
                        dispatch("submit");
                        dispatch("close");
                    });
                }
                return true;
            }
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                return true;
            }
            return false;
        }

        if (qEmpty && sectionResultsOpen && isAppsIconFlowView()) {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                void moveAppsFlowHorizontal(-1);
                return true;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                void moveAppsFlowHorizontal(1);
                return true;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                void moveAppsFlowVertical(-1);
                return true;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                void moveAppsFlowVertical(1);
                return true;
            }
        }

        if (!qEmpty && sectionResultsOpen && isAppsIconFlowView()) {
            if (event.key === "ArrowUp") {
                event.preventDefault();
                moveSelectionLinear(-1);
                return true;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                moveSelectionLinear(1);
                return true;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                return true;
            }
        }

        if (event.key === " " && qEmpty && sectionResultsOpen) {
            if (isAppsIconFlowView()) {
                event.preventDefault();
                void appsHandlePrimaryAction();
                return true;
            }
        }

        if (event.key === "Enter") {
            if (qEmpty && sectionResultsOpen && isAppsIconFlowView()) {
                event.preventDefault();
                void appsHandleSecondaryAction();
                return true;
            }
            if (
                visibleResults[selectedResultIndex] &&
                isSwiftAppsRow(visibleResults[selectedResultIndex])
            ) {
                event.preventDefault();
                void appsHandleSecondaryAction();
                return true;
            }
        }

        return false;
    }

    $: emptyMessage =
        debouncedQuery.trim() &&
        visibleResults.length === 0 &&
        isAppsIconFlowView()
            ? `No apps match '${query.trim()}'`
            : appsRegistryList.length === 0
              ? "No apps yet"
              : "Nothing on home — try All apps";
</script>

{#if appsView === "detail"}
    <OmniboxSectionAppsDetailPanel
        {detailAppId}
        {appsRegistryById}
        {appIdOnHomeLayout}
        onLaunchSwiftApp={launchSwiftApp}
        onReloadApps={loadAppsState}
        onLeaveDetail={appsDetailBack}
        on:submit={() => dispatch("submit")}
        on:close={() => dispatch("close")}
    />
{:else}
    <OmniboxAppsFolderModal
        open={folderModalRoot != null}
        rootFolder={folderModalRoot}
        {appsRegistryById}
        {faviconFailedByKey}
        onFaviconError={markResultFaviconFailed}
        onClose={closeFolderModal}
        onLaunchApp={modalLaunchApp}
    />
    {#if visibleResults.length === 0}
        <div class="empty-state">{emptyMessage}</div>
    {:else}
        <div
            bind:this={resultsListEl}
            class="results-list"
            class:results-list--apps-arrange={isAppsIconFlowView()}
            role="listbox"
        >
            <OmniboxSectionApps
                {visibleResults}
                {selectedResultIndex}
                showDropToHomeRail={appsView === "folder" &&
                    appsFolderDropRailActive}
                {faviconFailedByKey}
                bind:appsIconFlowEl
                onFaviconError={markResultFaviconFailed}
                onAppsIconPointerDown={appsIconPointerDown}
                onAppsIconPointerUpCancel={appsIconPointerUpCancel}
                {onAppsDragStart}
                {onAppsDragOver}
                {onAppsDrop}
                {onAppsDragOverHomeRail}
                {onAppsDropHomeRail}
                onAppsDragEnd={() => void onAppsDragEnd()}
                {onResultRowClick}
                {onResultRowDblClick}
            />
        </div>
    {/if}
{/if}

<style>
    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-height: 0;
    }

    .results-list--apps-arrange :global(.apps-icon-tile--draggable) {
        cursor: grab;
    }
</style>
