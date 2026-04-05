<script>
    import ObjectiveRow from "./ObjectiveRow.svelte";

    /** @type {import('../objectiveTypes.js').Timeframe} */
    export let timeframe;
    export let label = "";
    /** @type {import('../objectiveTypes.js').Objective[]} */
    export let backlogItems = [];
    /** @type {import('../objectiveTypes.js').Objective[]} */
    export let scheduledItems = [];
    export let expanded = true;
    export let showOnboarding = false;
    export let onboardingBusy = false;
    /** @type {Array<{ title: string, description: string, instructions: string }>} */
    export let onboardingSuggestions = [];
    export let scheduleBusyId = "";
    export let autoscheduleBusy = false;
    /** @type {'created'|'schedule'|'title'} */
    export let scheduledSortMode = "created";
    /** @type {'created'|'title'} */
    export let backlogSortMode = "created";

    export let onToggleExpand = () => {};
    export let onDropScheduled = /** @type {(e: DragEvent) => void} */ (() => {});
    export let onDragOverScheduled = /** @type {(e: DragEvent) => void} */ (() => {});
    export let onOnboardingRequest = /** @type {(text: string) => void} */ (() => {});
    export let onPickSuggestion = /** @type {(s: { title: string, description: string, instructions: string }) => void} */ (() => {});
    export let onAddObjective = () => {};
    export let onSortScheduled = () => {};
    export let onSortBacklog = () => {};
    export let onAutoscheduleBacklog = () => {};

    let localOnboardingText = "";

    function requestSuggestions() {
        onOnboardingRequest(localOnboardingText.trim());
    }

    $: scheduledSortHint =
        scheduledSortMode === "schedule"
            ? "Order: by schedule"
            : scheduledSortMode === "title"
              ? "Order: A–Z"
              : "Order: added";

    $: backlogSortHint =
        backlogSortMode === "title" ? "Order: A–Z" : "Order: added";
</script>

<section class="tf-section">
    <div class="tf-header-row">
        <button
            type="button"
            class="tf-header-main"
            on:click={() => onToggleExpand()}
        >
            <span class="tf-chevron">{expanded ? "▼" : "▶"}</span>
            <span class="tf-label">{label}</span>
            <span class="tf-count"
                >{backlogItems.length + scheduledItems.length}</span
            >
        </button>
        <div class="tf-header-tools">
            <button
                type="button"
                class="tf-tool"
                title="Add objective to this timeframe"
                on:click|stopPropagation={() => onAddObjective()}
            >
                Add
            </button>
            <button
                type="button"
                class="tf-tool"
                title={scheduledSortHint}
                on:click|stopPropagation={() => onSortScheduled()}
            >
                Sort schedule
            </button>
        </div>
    </div>

    {#if expanded}
        <div class="tf-body">
            {#if showOnboarding}
                <div class="onboarding">
                    <p class="onboarding-hint">
                        This timeframe is empty. Share context, then get AI
                        suggestions (optional).
                    </p>
                    <textarea
                        class="onboarding-ta"
                        rows="4"
                        placeholder="Your goals, values, constraints…"
                        bind:value={localOnboardingText}
                    />
                    <button
                        type="button"
                        class="btn btn-secondary"
                        disabled={onboardingBusy}
                        on:click={requestSuggestions}
                    >
                        {onboardingBusy ? "Thinking…" : "Get suggestions"}
                    </button>
                    {#if onboardingSuggestions.length}
                        <ul class="suggest-list">
                            {#each onboardingSuggestions as s}
                                <li>
                                    <button
                                        type="button"
                                        class="suggest-btn"
                                        on:click={() => onPickSuggestion(s)}
                                    >
                                        + {s.title}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            {/if}

            <div class="lanes">
                <div
                    class="lane lane-scheduled"
                    role="region"
                    aria-label="Schedule drop zone"
                    on:dragover={onDragOverScheduled}
                    on:drop={onDropScheduled}
                >
                    <h4 class="lane-title">Schedule</h4>
                    <p class="lane-drop-hint">
                        Drop backlog from a coarser timeframe here.
                    </p>
                    <ul class="lane-list">
                        {#each scheduledItems as o (o.id)}
                            <ObjectiveRow
                                {o}
                                {timeframe}
                                column="schedule"
                                draggable={false}
                                busy={scheduleBusyId === o.id}
                            />
                        {/each}
                    </ul>
                </div>

                <div class="lane lane-backlog">
                    <div class="lane-title-row">
                        <h4 class="lane-title">Backlog</h4>
                        <div class="lane-tools">
                            <button
                                type="button"
                                class="lane-tool"
                                title="Add objective to backlog"
                                on:click={() => onAddObjective()}
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                class="lane-tool"
                                title={backlogSortHint}
                                on:click={() => onSortBacklog()}
                            >
                                Sort
                            </button>
                            <button
                                type="button"
                                class="lane-tool"
                                title="Schedule each backlog item (Gemini when configured)"
                                disabled={autoscheduleBusy ||
                                    backlogItems.length === 0}
                                on:click={() => onAutoscheduleBacklog()}
                            >
                                {autoscheduleBusy ? "Scheduling…" : "Autoschedule"}
                            </button>
                        </div>
                    </div>
                    <ul class="lane-list">
                        {#each backlogItems as o (o.id)}
                            <ObjectiveRow
                                {o}
                                {timeframe}
                                column="backlog"
                                draggable={true}
                                busy={scheduleBusyId === o.id}
                            />
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    .tf-section {
        margin-bottom: 1.75rem;
        background: transparent;
    }

    .tf-header-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 6px 0 10px;
        border-bottom: 1px solid var(--p-border, #30363d);
    }

    .tf-header-main {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--p-text, #e6edf3);
        cursor: pointer;
        font: inherit;
        text-align: left;
    }

    .tf-header-main:hover .tf-label {
        color: var(--p-accent, #58a6ff);
    }

    .tf-header-tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
    }

    .tf-tool {
        padding: 0;
        border: none;
        background: transparent;
        color: var(--p-muted, #8b949e);
        font: inherit;
        font-size: 0.75rem;
        cursor: pointer;
        white-space: nowrap;
    }

    .tf-tool:hover {
        color: var(--p-accent, #58a6ff);
        text-decoration: underline;
    }

    .tf-chevron {
        width: 1rem;
        font-size: 0.7rem;
        color: var(--p-muted, #8b949e);
    }

    .tf-label {
        flex: 1;
        font-weight: 600;
        font-size: 0.8125rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--p-muted, #8b949e);
        min-width: 0;
    }

    .tf-count {
        font-size: 0.75rem;
        color: var(--p-muted, #8b949e);
        font-variant-numeric: tabular-nums;
    }

    .tf-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 12px 0 4px 1rem;
    }

    .onboarding {
        padding: 0 0 4px;
        background: transparent;
    }

    .onboarding-hint {
        margin: 0 0 8px;
        font-size: 0.8125rem;
        color: var(--p-muted, #8b949e);
    }

    .onboarding-ta {
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 8px;
        padding: 8px 0;
        border: none;
        border-radius: 0;
        background: transparent;
        color: var(--p-text, #e6edf3);
        font: inherit;
        resize: vertical;
        box-shadow: none;
        outline: none;
    }

    .onboarding-ta:focus {
        background: var(--p-accent-muted, #388bfd14);
    }

    .onboarding-ta::placeholder {
        color: var(--p-muted, #8b949e);
    }

    .suggest-list {
        margin: 10px 0 0;
        padding: 0;
        list-style: none;
    }

    .suggest-btn {
        display: block;
        width: 100%;
        text-align: left;
        margin-bottom: 4px;
        padding: 6px 0;
        border: none;
        border-radius: 0;
        background: transparent;
        color: var(--p-text, #e6edf3);
        cursor: pointer;
        font: inherit;
        font-size: 0.875rem;
    }

    .suggest-btn:hover {
        color: var(--p-accent, #58a6ff);
        text-decoration: underline;
    }

    .lanes {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .lane-title {
        margin: 0;
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--p-muted, #8b949e);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .lane-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
        flex-wrap: wrap;
    }

    .lane-title-row .lane-title {
        margin: 0;
    }

    .lane-tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    }

    .lane-tool {
        padding: 0;
        border: none;
        background: transparent;
        color: var(--p-muted, #8b949e);
        font: inherit;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
        cursor: pointer;
    }

    .lane-tool:hover:not(:disabled) {
        color: var(--p-accent, #58a6ff);
        text-decoration: underline;
    }

    .lane-tool:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .lane-list {
        margin: 0;
        padding: 0;
    }

    .lane-scheduled {
        min-height: 48px;
        padding: 4px 0 12px;
        margin: 0;
        border: none;
        background: transparent;
    }

    .lane-drop-hint {
        margin: 0 0 8px;
        font-size: 0.75rem;
        color: var(--p-muted, #8b949e);
    }

    .lane-backlog {
        border-top: 1px solid var(--p-border, #30363d);
        margin-top: 4px;
        padding-top: 12px;
    }

    .btn {
        padding: 8px 0;
        border-radius: 0;
        border: none;
        font-weight: 500;
        cursor: pointer;
        font-size: 0.8125rem;
        background: transparent;
        color: var(--p-muted, #8b949e);
    }

    .btn-secondary:hover:not(:disabled) {
        color: var(--p-accent, #58a6ff);
        text-decoration: underline;
    }

    .btn-secondary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
</style>
