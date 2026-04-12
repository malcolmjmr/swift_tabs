<script>
    import { createEventDispatcher } from "svelte";
    import * as repo from "../objectiveRepository.js";
    import {
        createBlankObjective,
        nextFinerTimeframe,
        normalizeObjective,
        TIMEFRAMES,
    } from "../objectiveTypes.js";
    import { TIMEFRAME_LABEL } from "../plannerUiLabels.js";
    import {
        fallbackScheduleForTimeframe,
        sanitizeScheduleForTimeframe,
        normalizeTimeString,
    } from "../scheduleUtils.js";

    const CATEGORIES = [
        "",
        "Health",
        "Learning",
        "Productivity",
        "Creativity",
        "Social",
        "Wellness",
        "Finance",
        "Career",
    ];

    export let open = false;
    /** @type {string|null} */
    export let objectiveId = null;
    /** @type {import('../objectiveTypes.js').Objective[]} */
    export let objectives = [];

    const dispatch = createEventDispatcher();

    /** @type {import('../objectiveTypes.js').Objective|null} */
    let edit = null;
    let yearStr = "";
    let monthStr = "";
    let dayStr = "";
    let timeStr = "";
    let durationValueStr = "";
    let durationPeriodStr = "";
    let newChildTitle = "";
    let banner = "";
    let saveBusy = false;
    let newChildBusy = false;

    // Habit fields
    let isRecurring = false;
    let selectedCategory = "";
    let completionCountStr = "";

    $: childRows = edit
        ? edit.children
              .map((cid) => objectives.find((o) => o.id === cid))
              .filter(Boolean)
        : [];

    $: if (!open) {
        edit = null;
        banner = "";
    }
    /** Sync whenever the dialog is open with a target id (avoids missed runs when props update out of phase with a prevOpen guard). */
    $: if (open && objectiveId) {
        void syncFromStore();
    }

    async function syncFromStore() {
        if (!objectiveId || !open) return;
        const targetId = objectiveId;
        banner = "";
        try {
            const o =
                objectives.find((x) => x.id === targetId) ??
                (await repo.getObjective(targetId));
            if (!open || objectiveId !== targetId) return;
            if (!o) {
                banner = "Objective not found.";
                edit = null;
                return;
            }
            applyObjectiveToForm(o);
        } catch (e) {
            if (!open || objectiveId !== targetId) return;
            banner =
                e instanceof Error ? e.message : String(e ?? "Load failed");
            edit = null;
        }
    }

    /** @param {import('../objectiveTypes.js').Objective} o */
    function applyObjectiveToForm(o) {
        edit = { ...o };
        yearStr = o.year != null ? String(o.year) : "";
        monthStr = o.month != null ? String(o.month) : "";
        dayStr = o.day != null ? String(o.day) : "";
        timeStr = o.time ?? "";
        durationValueStr =
            o.durationValue != null && Number.isFinite(o.durationValue)
                ? String(o.durationValue)
                : "";
        durationPeriodStr = o.durationPeriod ?? "";
        isRecurring = o.isRecurring ?? false;
        selectedCategory = o.category ?? "";
        completionCountStr =
            o.completionCount != null && Number.isFinite(o.completionCount)
                ? String(o.completionCount)
                : "0";
    }

    function onBackdropPointerDown(e) {
        if (e.target === e.currentTarget) closeModal();
    }

    /** @param {KeyboardEvent} e */
    function onDialogKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        }
    }

    function closeModal() {
        dispatch("close");
    }

    async function save() {
        if (!edit) return;
        saveBusy = true;
        banner = "";
        try {
            const y = yearStr.trim() === "" ? null : Number(yearStr);
            const mo = monthStr.trim() === "" ? null : Number(monthStr);
            const da = dayStr.trim() === "" ? null : Number(dayStr);
            const time = normalizeTimeString(timeStr.trim() || null);
            const sched = sanitizeScheduleForTimeframe(edit.timeframe, {
                year: y,
                month: mo,
                day: da,
                time,
            });
            const dv = durationValueStr.trim();
            const dvn = dv === "" ? null : Number(dv);
            const dp = durationPeriodStr.trim();
            const cc = completionCountStr.trim();
            const ccn = cc === "" ? 0 : Number(cc);
            const next = normalizeObjective({
                ...edit,
                year: sched.year,
                month: sched.month,
                day: sched.day,
                time: sched.time,
                durationValue:
                    dvn != null && Number.isFinite(dvn) ? dvn : null,
                durationPeriod: dp,
                isRecurring,
                category: selectedCategory,
                completionCount:
                    ccn != null && Number.isFinite(ccn) ? ccn : 0,
            });
            await repo.saveObjective(next);
            dispatch("saved");
            closeModal();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Save failed");
        } finally {
            saveBusy = false;
        }
    }

    async function addChild() {
        if (!edit) return;
        const t = newChildTitle.trim();
        if (!t) return;
        newChildBusy = true;
        banner = "";
        try {
            const childTf =
                nextFinerTimeframe(edit.timeframe) ?? edit.timeframe;
            const kid = createBlankObjective({
                title: t,
                timeframe: childTf,
                type: "goal",
            });
            await repo.saveObjective(kid);
            await repo.linkParentChild(edit.id, kid.id);
            newChildTitle = "";
            dispatch("saved");
            const p = await repo.getObjective(edit.id);
            if (p) applyObjectiveToForm(p);
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Add failed");
        } finally {
            newChildBusy = false;
        }
    }

    /**
     * @param {string} childId
     */
    async function unlinkChild(childId) {
        if (!edit) return;
        saveBusy = true;
        banner = "";
        try {
            const parent = await repo.getObjective(edit.id);
            const child = await repo.getObjective(childId);
            if (!parent || !child) return;
            await repo.saveObjectivesMany([
                normalizeObjective({
                    ...parent,
                    children: parent.children.filter((c) => c !== childId),
                }),
                normalizeObjective({
                    ...child,
                    parents: child.parents.filter((p) => p !== edit.id),
                }),
            ]);
            dispatch("saved");
            const p = await repo.getObjective(edit.id);
            if (p) applyObjectiveToForm(p);
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Unlink failed");
        } finally {
            saveBusy = false;
        }
    }

    function fillScheduleDefaults() {
        if (!edit) return;
        const fb = fallbackScheduleForTimeframe(edit.timeframe);
        const s = sanitizeScheduleForTimeframe(edit.timeframe, fb);
        yearStr = s.year != null ? String(s.year) : "";
        monthStr = s.month != null ? String(s.month) : "";
        dayStr = s.day != null ? String(s.day) : "";
        timeStr = s.time ?? "";
    }
</script>

{#if open}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="odm-backdrop"
        role="presentation"
        on:pointerdown={onBackdropPointerDown}
    >
        <div
            class="odm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="odm-title"
            tabindex="-1"
            on:keydown={onDialogKeydown}
        >
            <div class="odm-header">
                <h2 id="odm-title" class="odm-title">Objective details</h2>
                <button
                    type="button"
                    class="odm-icon-btn"
                    aria-label="Close"
                    on:click={closeModal}
                >
                    <span class="material-symbols-rounded" aria-hidden="true"
                        >close</span
                    >
                </button>
            </div>
            <div class="odm-body">
                {#if banner}
                    <p class="odm-error" role="alert">{banner}</p>
                {/if}
                {#if edit}
                    <label class="odm-field">
                        <span class="odm-label">Title</span>
                        <input
                            class="odm-input"
                            type="text"
                            bind:value={edit.title}
                        />
                    </label>
                    <label class="odm-field">
                        <span class="odm-label">Description</span>
                        <textarea
                            class="odm-textarea"
                            rows="3"
                            bind:value={edit.description}
                        ></textarea>
                    </label>

                    <div class="odm-row">
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Type</span>
                            <select
                                class="odm-input"
                                bind:value={isRecurring}
                            >
                                <option value={false}>Goal</option>
                                <option value={true}>Habit (Recurring)</option>
                            </select>
                        </label>
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Category</span>
                            <select
                                class="odm-input"
                                bind:value={selectedCategory}
                            >
                                {#each CATEGORIES as cat}
                                    <option value={cat}>
                                        {cat || "(None)"}
                                    </option>
                                {/each}
                            </select>
                        </label>
                    </div>

                    {#if isRecurring}
                        <label class="odm-field">
                            <span class="odm-label">Completion Count</span>
                            <input
                                class="odm-input"
                                type="number"
                                min="0"
                                bind:value={completionCountStr}
                                disabled={true}
                                title="Auto-increments when moved to Done"
                            />
                            <span class="odm-hint"
                                >Auto-increments when moved to Done</span
                            >
                        </label>
                    {/if}

                    <label class="odm-field">
                        <span class="odm-label">Timeframe</span>
                        <select
                            class="odm-input"
                            bind:value={edit.timeframe}
                            on:change={fillScheduleDefaults}
                        >
                            {#each TIMEFRAMES as tf}
                                <option value={tf}>{TIMEFRAME_LABEL[tf]}</option>
                            {/each}
                        </select>
                    </label>
                    <div class="odm-row">
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Year</span>
                            <input
                                class="odm-input"
                                type="number"
                                bind:value={yearStr}
                            />
                        </label>
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Month</span>
                            <input
                                class="odm-input"
                                type="number"
                                min="1"
                                max="12"
                                bind:value={monthStr}
                            />
                        </label>
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Day</span>
                            <input
                                class="odm-input"
                                type="number"
                                min="1"
                                max="31"
                                bind:value={dayStr}
                            />
                        </label>
                    </div>
                    <label class="odm-field">
                        <span class="odm-label">Time (HH:mm)</span>
                        <input
                            class="odm-input"
                            type="text"
                            placeholder="09:30"
                            bind:value={timeStr}
                        />
                    </label>
                    <div class="odm-row">
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Duration value</span>
                            <input
                                class="odm-input"
                                type="number"
                                min="0"
                                step="any"
                                bind:value={durationValueStr}
                            />
                        </label>
                        <label class="odm-field odm-field--grow">
                            <span class="odm-label">Duration period</span>
                            <input
                                class="odm-input"
                                type="text"
                                placeholder="hour, day, week…"
                                bind:value={durationPeriodStr}
                            />
                        </label>
                    </div>
                    <div class="odm-section">
                        <div class="odm-section-title">Children</div>
                        <ul class="odm-child-list">
                            {#each childRows as c (c.id)}
                                <li class="odm-child">
                                    <span class="odm-child-title"
                                        >{c.title || "(Untitled)"}</span
                                    >
                                    <button
                                        type="button"
                                        class="odm-child-unlink"
                                        disabled={saveBusy}
                                        on:click={() => unlinkChild(c.id)}
                                    >
                                        Unlink
                                    </button>
                                </li>
                            {/each}
                        </ul>
                        <div class="odm-row odm-row--align-end">
                            <input
                                class="odm-input odm-input--flex"
                                type="text"
                                placeholder="New child title"
                                bind:value={newChildTitle}
                            />
                            <button
                                type="button"
                                class="odm-btn odm-btn--primary"
                                disabled={newChildBusy || !newChildTitle.trim()}
                                on:click={addChild}
                            >
                                Add child
                            </button>
                        </div>
                    </div>
                    <div class="odm-actions">
                        <button
                            type="button"
                            class="odm-btn odm-btn--ghost"
                            on:click={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="odm-btn odm-btn--primary"
                            disabled={saveBusy}
                            on:click={save}
                        >
                            Save
                        </button>
                    </div>
                {:else if !banner}
                    <p class="odm-muted">Loading…</p>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .odm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
    }

    .odm-dialog {
        display: flex;
        flex-direction: column;
        width: min(440px, 100%);
        max-height: min(85vh, 640px);
        border-radius: 16px;
        background: var(--st-bg-primary, #1a1a1a);
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .odm-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 10px 10px 14px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .odm-title {
        flex: 1;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
    }

    .odm-icon-btn {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--st-text-primary, #fff);
        cursor: pointer;
        font-family: inherit;
    }

    .odm-icon-btn:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .odm-body {
        padding: 14px 14px 16px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .odm-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
    }

    .odm-field--grow {
        flex: 1;
        min-width: 0;
    }

    .odm-label {
        font-size: 12px;
        color: var(--st-text-muted, #aaa);
    }

    .odm-input,
    .odm-textarea {
        box-sizing: border-box;
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        background: rgba(0, 0, 0, 0.25);
        color: var(--st-text-primary, #fff);
        font-size: 14px;
        font-family: inherit;
    }

    .odm-input--flex {
        flex: 1;
        min-width: 0;
    }

    .odm-textarea {
        resize: vertical;
        min-height: 72px;
    }

    .odm-row {
        display: flex;
        flex-direction: row;
        gap: 10px;
        margin-bottom: 12px;
        flex-wrap: wrap;
    }

    .odm-row--align-end {
        align-items: flex-end;
    }

    .odm-section {
        margin: 16px 0 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .odm-section-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888);
        margin-bottom: 8px;
    }

    .odm-child-list {
        list-style: none;
        margin: 0 0 10px;
        padding: 0;
    }

    .odm-child {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
    }

    .odm-child-title {
        font-size: 13px;
        color: var(--st-text-primary, #eee);
        min-width: 0;
    }

    .odm-child-unlink {
        flex-shrink: 0;
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: transparent;
        color: var(--st-text-muted, #aaa);
        cursor: pointer;
        font-family: inherit;
    }

    .odm-child-unlink:hover:not(:disabled) {
        color: #f88;
        border-color: rgba(248, 136, 136, 0.4);
    }

    .odm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
    }

    .odm-btn {
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        cursor: pointer;
        border: 1px solid transparent;
    }

    .odm-btn--ghost {
        background: transparent;
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.15));
        color: var(--st-text-primary, #ddd);
    }

    .odm-btn--primary {
        background: rgba(80, 120, 220, 0.35);
        border-color: rgba(120, 160, 255, 0.4);
        color: var(--st-text-primary, #fff);
    }

    .odm-btn--primary:disabled,
    .odm-btn:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .odm-error {
        margin: 0 0 12px;
        font-size: 13px;
        color: #f88;
    }

    .odm-muted {
        margin: 0;
        font-size: 14px;
        color: var(--st-text-muted, #888);
    }

    .odm-hint {
        font-size: 11px;
        color: var(--st-text-muted, #888);
        margin-top: 4px;
    }
</style>
