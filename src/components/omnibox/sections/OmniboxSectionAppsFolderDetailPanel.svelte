<script>
    import { newRoutineId } from "../../../services/apps/appsModel.js";
    import { chromeService } from "../../../services/chromeApi";

    /** @type {string | null} */
    export let detailFolderId = null;
    /** @type {{ version: number, items: object[] }} */
    export let appsLayout = { version: 1, items: [] };
    export let onReloadApps = async () => {};
    export let onLeaveDetail = () => {};
    /** @param {string} folderId @param {Record<string, unknown>} patch */
    export let persistFolderFields = async (_folderId, _patch) => {};

    /** @param {object[]} items @param {string} id */
    function findFolderDeep(items, id) {
        for (const it of items || []) {
            if (it.kind === "folder") {
                if (it.id === id) return it;
                const inner = findFolderDeep(it.items || [], id);
                if (inner) return inner;
            }
        }
        return null;
    }

    /** @param {string} t */
    function timeToMinutes(t) {
        const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
        if (!m) return 0;
        return (
            (Math.min(23, parseInt(m[1], 10)) || 0) * 60 +
            (Math.min(59, parseInt(m[2], 10)) || 0)
        );
    }

    /** @param {number} mins */
    function minutesToTime(mins) {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    $: folder =
        detailFolderId != null
            ? findFolderDeep(appsLayout.items || [], detailFolderId)
            : null;

    let folderTitleEdit = "";
    let accessEnabled = false;
    let accessHideHome = true;
    let accessBlockNav = true;
    let schedEnabled = false;
    let schedStart = "09:00";
    let schedEnd = "17:00";
    /** @type {boolean[]} */
    let schedDays = [true, true, true, true, true, true, true];
    let freqEnabled = false;
    let freqMax = 20;
    let freqWindowHours = 24;

    /** @type {object[]} */
    let routines = [];
    let routineRunError = "";

    /** @type {string | null} */
    let lastFolderId = null;

    $: if (detailFolderId == null) {
        lastFolderId = null;
    } else if (detailFolderId !== lastFolderId && folder) {
        lastFolderId = detailFolderId;
        folderTitleEdit = folder.title || "";
        const p = folder.accessPolicy;
        accessEnabled = !!(p && p.enabled);
        accessHideHome = p?.hideFromHomeWhenRestricted !== false;
        accessBlockNav = p?.blockNavigationWhenRestricted !== false;
        const w = p?.blockedWindows?.[0];
        schedEnabled = !!(w && accessEnabled);
        if (w) {
            schedStart = minutesToTime(w.startMinutes ?? 0);
            schedEnd = minutesToTime(w.endMinutes ?? 1020);
            if (w.daysOfWeek?.length) {
                schedDays = [0, 1, 2, 3, 4, 5, 6].map((d) =>
                    w.daysOfWeek.includes(d),
                );
            }
        }
        const f = p?.frequency;
        freqEnabled = !!(f && accessEnabled);
        if (f) {
            freqMax = f.maxVisits ?? 20;
            freqWindowHours = f.windowHours ?? 24;
        }
        routines = JSON.parse(JSON.stringify(folder.fetchRoutines || []));
        routineRunError = "";
    }

    async function saveFolderTitle() {
        if (!detailFolderId) return;
        const t = folderTitleEdit.trim();
        await persistFolderFields(detailFolderId, { title: t || "Folder" });
        await onReloadApps();
    }

    function buildAccessPolicy() {
        if (!accessEnabled) return undefined;
        /** @type {object} */
        const policy = {
            enabled: true,
            hideFromHomeWhenRestricted: accessHideHome,
            blockNavigationWhenRestricted: accessBlockNav,
            timezone: "local",
        };
        if (schedEnabled) {
            const days = schedDays
                .map((on, i) => (on ? i : -1))
                .filter((i) => i >= 0);
            policy.blockedWindows = [
                {
                    daysOfWeek: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
                    startMinutes: timeToMinutes(schedStart),
                    endMinutes: timeToMinutes(schedEnd),
                },
            ];
        }
        if (freqEnabled) {
            policy.frequency = {
                windowHours: freqWindowHours,
                maxVisits: Math.max(0, Number(freqMax) || 0),
                source: "chrome_history",
            };
        }
        return policy;
    }

    async function saveAccess() {
        if (!detailFolderId) return;
        await persistFolderFields(detailFolderId, {
            accessPolicy: buildAccessPolicy(),
        });
        await onReloadApps();
    }

    async function saveRoutines() {
        if (!detailFolderId) return;
        await persistFolderFields(detailFolderId, {
            fetchRoutines: routines,
        });
        await onReloadApps();
    }

    function addRoutine() {
        routines = [
            ...routines,
            {
                id: newRoutineId(),
                enabled: true,
                label: "",
                instructions: "Find recent updates and useful links.",
                outputFormat: "text",
                schedule: { kind: "interval", periodMinutes: 360 },
            },
        ];
    }

    /** @param {number} i */
    function removeRoutine(i) {
        routines = routines.filter((_, j) => j !== i);
    }

    /** @param {string} routineId */
    async function runRoutineNow(routineId) {
        if (!detailFolderId) return;
        routineRunError = "";
        try {
            await chromeService.appsRunRoutine(
                "folder",
                detailFolderId,
                routineId,
            );
            await onReloadApps();
        } catch (e) {
            routineRunError =
                e instanceof Error ? e.message : "Routine run failed";
        }
    }
</script>

<div class="apps-detail-panel">
    <div class="apps-detail-scroll">
        {#if folder}
            <div class="apps-detail-header-row">
                <button
                    type="button"
                    class="apps-detail-btn"
                    on:click={() => onLeaveDetail()}>Back</button
                >
            </div>
            <div class="apps-detail-section-title">Folder</div>
            <input
                class="apps-detail-input"
                bind:value={folderTitleEdit}
                on:blur={() => void saveFolderTitle()}
            />

            {#if folder.access}
                <div class="access-summary">
                    <span class="apps-detail-section-title">Status</span>
                    {folder.access.restricted
                        ? "Restricted"
                        : "Not restricted"}
                    {#if folder.access.reasons?.length}
                        <div class="access-reasons">
                            {folder.access.reasons.join(" · ")}
                        </div>
                    {/if}
                </div>
            {/if}

            <div class="apps-detail-section-title">Access policy</div>
            <label class="apps-check"
                ><input type="checkbox" bind:checked={accessEnabled} /> Enable
                policy</label
            >
            <label class="apps-check"
                ><input type="checkbox" bind:checked={accessHideHome} /> Hide from
                home when restricted</label
            >
            <label class="apps-check"
                ><input type="checkbox" bind:checked={accessBlockNav} /> Block
                navigation (close tab)</label
            >

            <label class="apps-check"
                ><input type="checkbox" bind:checked={schedEnabled} /> Blocked time
                window</label
            >
            {#if schedEnabled}
                <div class="apps-row">
                    <input
                        type="time"
                        class="apps-detail-input apps-time"
                        bind:value={schedStart}
                    />
                    <span>to</span>
                    <input
                        type="time"
                        class="apps-detail-input apps-time"
                        bind:value={schedEnd}
                    />
                </div>
                <div class="apps-days">
                    {#each dayLabels as label, i}
                        <label class="apps-day"
                            ><input
                                type="checkbox"
                                bind:checked={schedDays[i]}
                            />{label}</label
                        >
                    {/each}
                </div>
            {/if}

            <label class="apps-check"
                ><input type="checkbox" bind:checked={freqEnabled} /> Visit limit
                (Chrome history, sum of apps in folder)</label
            >
            {#if freqEnabled}
                <div class="apps-row">
                    <span class="apps-muted">Max visits</span>
                    <input
                        type="number"
                        class="apps-detail-input apps-num"
                        bind:value={freqMax}
                        min="0"
                    />
                    <select
                        class="apps-detail-input apps-select"
                        bind:value={freqWindowHours}
                    >
                        <option value={24}>per 24h</option>
                        <option value={168}>per 7d</option>
                    </select>
                </div>
            {/if}

            <button
                type="button"
                class="apps-detail-btn"
                on:click={() => void saveAccess()}>Save access</button
            >

            <div class="apps-detail-section-title">Fetch routines (LLM + search)</div>
            {#if routineRunError}
                <div class="news-detail-error">{routineRunError}</div>
            {/if}
            {#each routines as r, i (r.id)}
                <div class="routine-card">
                    <input
                        class="apps-detail-input"
                        placeholder="Label"
                        bind:value={r.label}
                    />
                    <label class="apps-check"
                        ><input
                            type="checkbox"
                            bind:checked={r.enabled}
                        />Enabled</label
                    >
                    <textarea
                        class="apps-textarea"
                        rows="2"
                        bind:value={r.instructions}
                    />
                    <div class="apps-row">
                        <select
                            class="apps-detail-input apps-select"
                            bind:value={r.outputFormat}
                        >
                            <option value="text">Output: text</option>
                            <option value="links">Output: links → app queues</option>
                        </select>
                        {#if r.schedule?.kind === "interval"}
                            <span class="apps-muted">Every</span>
                            <input
                                type="number"
                                class="apps-detail-input apps-num"
                                min="1"
                                max="1440"
                                bind:value={r.schedule.periodMinutes}
                            />
                            <span class="apps-muted">min</span>
                        {:else}
                            <span class="apps-muted">Daily at</span>
                            <input
                                type="number"
                                class="apps-detail-input apps-num"
                                min="0"
                                max="23"
                                bind:value={r.schedule.hour}
                            />
                            <input
                                type="number"
                                class="apps-detail-input apps-num"
                                min="0"
                                max="59"
                                bind:value={r.schedule.minute}
                            />
                        {/if}
                    </div>
                    <div class="apps-row">
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => {
                                r.schedule = {
                                    kind: "interval",
                                    periodMinutes: 60,
                                };
                            }}>Interval</button
                        >
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => {
                                r.schedule = {
                                    kind: "daily",
                                    hour: 9,
                                    minute: 0,
                                };
                            }}>Daily</button
                        >
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => void runRoutineNow(r.id)}
                            >Run now</button
                        >
                        <button
                            type="button"
                            class="apps-detail-btn"
                            on:click={() => removeRoutine(i)}>Remove</button
                        >
                    </div>
                    {#if r.lastError}
                        <div class="news-detail-error">{r.lastError}</div>
                    {/if}
                    {#if r.lastOutput?.text}
                        <pre class="apps-suggestions-text">{r.lastOutput.text}</pre>
                    {/if}
                </div>
            {/each}
            <button type="button" class="apps-detail-btn" on:click={addRoutine}
                >Add routine</button
            >
            <button
                type="button"
                class="apps-detail-btn"
                on:click={() => void saveRoutines()}>Save routines</button
            >
        {:else}
            <div class="empty-state">Folder not found</div>
        {/if}
    </div>
</div>

<style>
    .apps-detail-header-row {
        margin-bottom: 8px;
    }
    .apps-detail-panel {
        display: flex;
        flex-direction: column;
        min-height: 120px;
        max-height: 480px;
    }
    .apps-detail-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 14px;
    }
    .apps-detail-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888);
        margin: 12px 0 8px;
    }
    .apps-detail-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-primary, #fff);
        font-size: 13px;
        font-family: inherit;
    }
    .apps-time {
        width: auto;
    }
    .apps-num {
        width: 72px;
    }
    .apps-select {
        width: auto;
    }
    .apps-detail-btn {
        padding: 6px 12px;
        margin: 4px 4px 4px 0;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
        color: var(--st-text-primary, #fff);
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
    }
    .apps-check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        margin: 6px 0;
        color: var(--st-text-primary, #eee);
    }
    .apps-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
        font-size: 12px;
    }
    .apps-days {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 8px 0;
    }
    .apps-day {
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--st-text-primary, #ccc);
    }
    .apps-muted {
        color: var(--st-text-muted, #888);
        font-size: 12px;
    }
    .apps-textarea {
        width: 100%;
        box-sizing: border-box;
        margin: 6px 0;
        padding: 8px;
        border-radius: 6px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-primary, #fff);
        font-size: 12px;
        font-family: inherit;
    }
    .routine-card {
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
    }
    .access-summary {
        margin: 8px 0;
        font-size: 12px;
        color: var(--st-text-primary, #ccc);
    }
    .access-reasons {
        margin-top: 4px;
        color: var(--st-text-muted, #888);
        font-size: 11px;
    }
    .apps-suggestions-text {
        white-space: pre-wrap;
        font-size: 11px;
        line-height: 1.4;
        margin-top: 6px;
        color: var(--st-text-primary, #eee);
    }
    .news-detail-error {
        color: var(--st-text-primary, #f0a0a0);
        font-size: 12px;
    }
    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }
</style>
