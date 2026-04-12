<script>
    import { createEventDispatcher } from "svelte";
    import * as repo from "../objectiveRepository.js";
    import {
        assistanceGenerateObjective,
        assistanceInitialQuestions,
        assistanceMoreQuestions,
        assistanceSuggestHabits,
        assistanceSuggestObjectivesForCategory,
        assistanceSuggestRelatedTitles,
    } from "../plannerLLM.js";
    import { TIMEFRAME_LABEL } from "../plannerUiLabels.js";
    import {
        applyObjectiveToKanbanColumn,
        kanbanColumnForObjective,
        timeframeCurrentPeriodSubtitle,
    } from "../kanbanColumnMap.js";
    import {
        createBlankObjective,
        normalizeObjective,
        prevCoarserTimeframe,
    } from "../objectiveTypes.js";
    import { buildSubObjectives } from "../scheduleUtils.js";

    /** @typedef {{ id: string, prompt: string, choices: string[] }} AssistQuestion */

    /** @type {Array<{id: string, name: string, icon: string}>} */
    const CATEGORIES = [
        { id: "Health", name: "Health", icon: "favorite" },
        { id: "Learning", name: "Learning", icon: "school" },
        { id: "Productivity", name: "Productivity", icon: "check_circle" },
        { id: "Creativity", name: "Creativity", icon: "palette" },
        { id: "Social", name: "Social", icon: "group" },
        { id: "Wellness", name: "Wellness", icon: "spa" },
        { id: "Finance", name: "Finance", icon: "savings" },
        { id: "Career", name: "Career", icon: "work" },
    ];

    /** @type {Record<string, string>} */
    const CATEGORY_COLORS = {
        Health: "#22c55e",
        Learning: "#3b82f6",
        Productivity: "#f97316",
        Creativity: "#a855f7",
        Social: "#ec4899",
        Wellness: "#14b8a6",
        Finance: "#eab308",
        Career: "#6366f1",
    };

    /** Long-term timeframes that use the aspirational flow */
    const ASPIRATIONAL_TIMEFRAMES = ["century", "decade", "year"];

    export let open = false;
    /** @type {'backlog'|'todo'|'in_progress'|'done'} */
    export let columnId = "backlog";
    /** @type {import('../objectiveTypes.js').Timeframe} */
    export let selectedTf = "week";
    /** @type {import('../objectiveTypes.js').Objective[]} */
    export let objectives = [];

    const dispatch = createEventDispatcher();

    // Track prior `open` inside one reactive block so `runInitial` runs when opening.
    let lastOpen = false;

    // Legacy Q&A state (kept for non-aspirational timeframes)
    /** @type {AssistQuestion[]} */
    let questions = [];
    /** @type {Record<string, { selected: string[], freeform: string }>} */
    let answers = {};
    /** @type {string[]} */
    let goalMemory = [];
    let goalInput = "";
    let initBusy = false;
    let goalBusy = false;
    let moreBusy = false;
    let genBusy = false;
    let suggestBusy = false;
    let addManyBusy = false;
    let banner = "";
    /** @type {'qa'|'suggestions'} */
    let legacyPhase = "qa";
    /** @type {{ title: string, description: string, duration: { value: number, period: string } | null, children: Array<{ title: string, description: string }> } | null} */
    let preview = null;
    /** @type {string[]} */
    let suggestedTitles = [];
    /** @type {Record<string, boolean>} */
    let pickedTitles = {};

    // New aspirational flow state
    /** @type {'input'|'objectives'|'habits'|'legacy'} */
    let aspirationalPhase = "input";
    let aspirationalBusy = false;
    let goalDescriptionInput = "";
    /** @type {Set<string>} */
    let selectedCategories = new Set();
    /** @type {Array<{ title: string, description: string, category: string, selected: boolean }>} */
    let suggestedObjectives = [];
    /** @type {Array<{ title: string, description: string, category: string, timeframe: import('../objectiveTypes.js').Timeframe, selected: boolean, parentObjectiveTitle: string }>} */
    let suggestedHabits = [];
    let customObjectiveTitle = "";
    let saveHabitsBusy = false;

    $: isAspirational = ASPIRATIONAL_TIMEFRAMES.includes(selectedTf);
    $: parentTf = prevCoarserTimeframe(selectedTf);
    $: parentBacklogTitles = (() => {
        if (!parentTf) return [];
        return objectives
            .filter(
                (o) =>
                    o.timeframe === parentTf &&
                    kanbanColumnForObjective(o, parentTf) === "backlog" &&
                    o.children.length === 0,
            )
            .map((o) => (o.title || "").trim())
            .filter(Boolean);
    })();
    $: existingTfTitles = objectives
        .filter((o) => o.timeframe === selectedTf)
        .map((o) => (o.title || "").trim())
        .filter(Boolean);

    function reset() {
        // Legacy reset
        questions = [];
        answers = {};
        goalMemory = [];
        goalInput = "";
        banner = "";
        legacyPhase = "qa";
        preview = null;
        suggestedTitles = [];
        pickedTitles = {};
        initBusy = false;
        goalBusy = false;
        moreBusy = false;
        genBusy = false;
        suggestBusy = false;
        addManyBusy = false;

        // Aspirational reset
        aspirationalPhase = "input";
        aspirationalBusy = false;
        goalDescriptionInput = "";
        selectedCategories = new Set();
        suggestedObjectives = [];
        suggestedHabits = [];
        customObjectiveTitle = "";
        saveHabitsBusy = false;
    }

    $: {
        if (open && !lastOpen) {
            reset();
            if (isAspirational) {
                aspirationalPhase = "input";
            } else {
                void runInitial();
            }
        } else if (!open && lastOpen) {
            reset();
        }
        lastOpen = open;
    }

    // Legacy functions
    function buildTranscript() {
        const parts = [];
        for (const g of goalMemory) parts.push(`Stated goal: ${g}`);
        for (const q of questions) {
            const a = answers[q.id];
            if (!a) continue;
            const sel = (a.selected || []).join("; ");
            const ff = (a.freeform || "").trim();
            parts.push(
                `Q: ${q.prompt}\nChoices selected: ${sel || "(none)"}\nFreeform: ${ff || "(none)"}`,
            );
        }
        return parts.join("\n\n");
    }

    async function runInitial() {
        initBusy = true;
        banner = "";
        try {
            const qs = await assistanceInitialQuestions({
                selectedTimeframe: TIMEFRAME_LABEL[selectedTf] || selectedTf,
                periodSubtitle: timeframeCurrentPeriodSubtitle(selectedTf),
                parentBacklogTitles,
            });
            questions = qs;
            answers = {};
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Load failed");
        } finally {
            initBusy = false;
        }
    }

    /** @param {KeyboardEvent} e */
    function onGoalKeydown(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        void commitGoal();
    }

    async function commitGoal() {
        const g = goalInput.trim();
        if (!g || goalBusy) return;
        goalMemory = [...goalMemory, g];
        goalInput = "";
        goalBusy = true;
        banner = "";
        try {
            const qs = await assistanceMoreQuestions({
                transcript: buildTranscript(),
                goalMemory,
            });
            const existing = new Set(questions.map((q) => q.id));
            const merged = [...questions];
            for (const q of qs) {
                let id = q.id;
                if (existing.has(id)) {
                    id = `${id}_${Math.random().toString(36).slice(2, 7)}`;
                }
                existing.add(id);
                merged.push({ ...q, id });
            }
            questions = merged;
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Request failed");
        } finally {
            goalBusy = false;
        }
    }

    async function moreQuestions() {
        if (moreBusy) return;
        moreBusy = true;
        banner = "";
        try {
            const qs = await assistanceMoreQuestions({
                transcript: buildTranscript(),
                goalMemory,
            });
            const existing = new Set(questions.map((q) => q.id));
            const merged = [...questions];
            for (const q of qs) {
                let id = q.id;
                if (existing.has(id)) {
                    id = `${id}_${Math.random().toString(36).slice(2, 7)}`;
                }
                existing.add(id);
                merged.push({ ...q, id });
            }
            questions = merged;
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Request failed");
        } finally {
            moreBusy = false;
        }
    }

    /**
     * @param {string} qid
     * @param {string} choice
     */
    function toggleChoice(qid, choice) {
        const cur = answers[qid] || { selected: [], freeform: "" };
        const set = new Set(cur.selected);
        if (set.has(choice)) set.delete(choice);
        else set.add(choice);
        answers = {
            ...answers,
            [qid]: { ...cur, selected: [...set] },
        };
    }

    /**
     * @param {string} qid
     * @param {string} v
     */
    function setFreeform(qid, v) {
        const cur = answers[qid] || { selected: [], freeform: "" };
        answers = { ...answers, [qid]: { ...cur, freeform: v } };
    }

    async function generateObjective() {
        if (genBusy) return;
        genBusy = true;
        banner = "";
        try {
            const raw = await assistanceGenerateObjective({
                transcript: buildTranscript(),
                goalMemory,
                selectedTimeframe: selectedTf,
            });
            preview = {
                title: raw.title,
                description: raw.description,
                duration: raw.duration,
                children: raw.children,
            };
            suggestedTitles = [];
            pickedTitles = {};
            legacyPhase = "suggestions";
            await runSuggestTitles();
        } catch (e) {
            banner =
                e instanceof Error
                    ? e.message
                    : String(e ?? "Generate failed");
        } finally {
            genBusy = false;
        }
    }

    async function runSuggestTitles() {
        if (!preview) return;
        suggestBusy = true;
        try {
            suggestedTitles = await assistanceSuggestRelatedTitles({
                transcript: buildTranscript(),
                generatedTitle: preview.title,
                generatedDescription: preview.description,
            });
            pickedTitles = Object.fromEntries(
                suggestedTitles.map((t) => [t, false]),
            );
        } catch {
            suggestedTitles = [];
            pickedTitles = {};
        } finally {
            suggestBusy = false;
        }
    }

    async function savePreviewObjective() {
        if (!preview || genBusy) return;
        genBusy = true;
        banner = "";
        try {
            let o = createBlankObjective({
                timeframe: selectedTf,
                type: "goal",
                title: preview.title,
                description: preview.description,
            });
            if (preview.duration) {
                o = normalizeObjective({
                    ...o,
                    durationValue: preview.duration.value,
                    durationPeriod: preview.duration.period,
                });
            }
            o = applyObjectiveToKanbanColumn(o, selectedTf, columnId);
            await repo.saveObjective(o);
            const kids = buildSubObjectives(
                o,
                selectedTf,
                preview.children,
                createBlankObjective,
            );
            if (kids.length) {
                await repo.attachNewChildren(o, kids);
            }
            notifyPlanner();
            dispatch("saved");
            closeModal();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Save failed");
        } finally {
            genBusy = false;
        }
    }

    async function addPickedObjectives() {
        const titles = Object.entries(pickedTitles)
            .filter(([, on]) => on)
            .map(([t]) => t);
        if (titles.length === 0 || addManyBusy) return;
        addManyBusy = true;
        banner = "";
        try {
            for (const title of titles) {
                let o = createBlankObjective({
                    timeframe: selectedTf,
                    type: "goal",
                    title,
                });
                o = applyObjectiveToKanbanColumn(o, selectedTf, columnId);
                await repo.saveObjective(o);
            }
            notifyPlanner();
            dispatch("saved");
            closeModal();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Add failed");
        } finally {
            addManyBusy = false;
        }
    }

    // Aspirational flow functions
    function toggleCategory(categoryId) {
        const newSet = new Set(selectedCategories);
        if (newSet.has(categoryId)) {
            newSet.delete(categoryId);
        } else {
            newSet.add(categoryId);
        }
        selectedCategories = newSet;
    }

    async function generateObjectiveSuggestions() {
        if (selectedCategories.size === 0 || aspirationalBusy) return;
        aspirationalBusy = true;
        banner = "";
        try {
            // Generate suggestions for each selected category
            const allSuggestions = [];
            for (const category of selectedCategories) {
                const suggestions = await assistanceSuggestObjectivesForCategory({
                    goalInput: goalDescriptionInput,
                    category,
                    timeframe: selectedTf,
                    existingObjectives: existingTfTitles,
                    periodSubtitle: timeframeCurrentPeriodSubtitle(selectedTf),
                });
                // Add category to each suggestion
                for (const s of suggestions) {
                    allSuggestions.push({
                        ...s,
                        category,
                        selected: false,
                    });
                }
            }
            suggestedObjectives = allSuggestions;
            aspirationalPhase = "objectives";
        } catch (e) {
            banner =
                e instanceof Error
                    ? e.message
                    : String(e ?? "Failed to generate suggestions");
        } finally {
            aspirationalBusy = false;
        }
    }

    function toggleObjectiveSelection(index) {
        suggestedObjectives = suggestedObjectives.map((o, i) =>
            i === index ? { ...o, selected: !o.selected } : o,
        );
    }

    function selectCustomObjective() {
        // Toggle custom objective selection
        if (customObjectiveTitle.trim()) {
            customObjectiveTitle = "";
        }
    }

    async function proceedToHabits() {
        const selectedObjectives = suggestedObjectives.filter((o) => o.selected);
        const hasCustomObjective = customObjectiveTitle.trim().length > 0;

        if (selectedObjectives.length === 0 && !hasCustomObjective) {
            banner = "Please select at least one objective or enter a custom goal";
            return;
        }

        aspirationalBusy = true;
        banner = "";
        try {
            const allHabits = [];

            // Get habits for each selected objective
            for (const obj of selectedObjectives) {
                const habits = await assistanceSuggestHabits({
                    objectiveTitle: obj.title,
                    objectiveDescription: obj.description,
                    category: obj.category,
                    timeframe: selectedTf,
                });
                for (const h of habits) {
                    allHabits.push({
                        ...h,
                        selected: false,
                        parentObjectiveTitle: obj.title,
                    });
                }
            }

            // Also get habits for custom objective if provided
            if (hasCustomObjective) {
                // Use first selected category or default to first category
                const primaryCategory = selectedCategories.values().next().value || "Health";
                const habits = await assistanceSuggestHabits({
                    objectiveTitle: customObjectiveTitle.trim(),
                    objectiveDescription: "",
                    category: primaryCategory,
                    timeframe: selectedTf,
                });
                for (const h of habits) {
                    allHabits.push({
                        ...h,
                        selected: false,
                        parentObjectiveTitle: customObjectiveTitle.trim(),
                    });
                }
            }

            suggestedHabits = allHabits;
            aspirationalPhase = "habits";
        } catch (e) {
            banner =
                e instanceof Error
                    ? e.message
                    : String(e ?? "Failed to suggest habits");
        } finally {
            aspirationalBusy = false;
        }
    }

    function toggleHabitSelection(index) {
        suggestedHabits = suggestedHabits.map((h, i) =>
            i === index ? { ...h, selected: !h.selected } : h,
        );
    }

    async function saveObjectiveAndHabits() {
        const selectedObjectives = suggestedObjectives.filter((o) => o.selected);
        const hasCustomObjective = customObjectiveTitle.trim().length > 0;
        const selectedHabits = suggestedHabits.filter((h) => h.selected);

        if (selectedObjectives.length === 0 && !hasCustomObjective) {
            banner = "No objective selected";
            return;
        }

        saveHabitsBusy = true;
        banner = "";
        try {
            // Save all selected main objectives
            const savedObjectives = [];
            for (const obj of selectedObjectives) {
                let mainObjective = createBlankObjective({
                    timeframe: selectedTf,
                    type: "goal",
                    title: obj.title,
                    description: obj.description,
                    category: obj.category,
                    isRecurring: false,
                });
                mainObjective = applyObjectiveToKanbanColumn(
                    mainObjective,
                    selectedTf,
                    columnId,
                );
                await repo.saveObjective(mainObjective);
                savedObjectives.push(mainObjective);
            }

            // Save custom objective if provided
            if (hasCustomObjective) {
                const primaryCategory = selectedCategories.values().next().value || "Health";
                let customObjective = createBlankObjective({
                    timeframe: selectedTf,
                    type: "goal",
                    title: customObjectiveTitle.trim(),
                    description: "",
                    category: primaryCategory,
                    isRecurring: false,
                });
                customObjective = applyObjectiveToKanbanColumn(
                    customObjective,
                    selectedTf,
                    columnId,
                );
                await repo.saveObjective(customObjective);
                savedObjectives.push(customObjective);
            }

            // Save the habits as recurring objectives
            if (selectedHabits.length > 0) {
                const habitObjectives = [];
                for (const habit of selectedHabits) {
                    let habitObjective = createBlankObjective({
                        timeframe: habit.timeframe,
                        type: "goal",
                        title: habit.title,
                        description: habit.description,
                        category: habit.category,
                        isRecurring: true,
                        completionCount: 0,
                    });
                    // Habits go to backlog initially
                    habitObjective = applyObjectiveToKanbanColumn(
                        habitObjective,
                        habit.timeframe,
                        "backlog",
                    );
                    habitObjectives.push(habitObjective);
                }
                await repo.saveObjectivesMany(habitObjectives);
            }

            notifyPlanner();
            dispatch("saved");
            closeModal();
        } catch (e) {
            banner =
                e instanceof Error ? e.message : String(e ?? "Save failed");
        } finally {
            saveHabitsBusy = false;
        }
    }

    function backToObjectives() {
        aspirationalPhase = "objectives";
        suggestedHabits = [];
    }

    function backToInput() {
        aspirationalPhase = "input";
        suggestedObjectives = [];
        suggestedHabits = [];
        customObjectiveTitle = "";
    }

    function notifyPlanner() {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime
                .sendMessage({ type: "PLANNER_OBJECTIVES_CHANGED" })
                .catch(() => {});
        }
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

    function backToQa() {
        legacyPhase = "qa";
    }
</script>

{#if open}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="oam-backdrop"
        role="presentation"
        on:pointerdown={onBackdropPointerDown}
    >
        <div
            class="oam-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Objective assistance"
            tabindex="-1"
            on:keydown={onDialogKeydown}
        >
            <button
                type="button"
                class="oam-close-fab"
                aria-label="Close"
                on:click={closeModal}
            >
                <span class="material-symbols-rounded" aria-hidden="true"
                    >close</span
                >
            </button>
            <div class="oam-body">
                {#if banner}
                    <p class="oam-error" role="alert">{banner}</p>
                {/if}

                {#if isAspirational}
                    <!-- Aspirational Flow -->
                    {#if aspirationalPhase === "input"}
                        <h3 class="oam-phase-title">
                            Set your {TIMEFRAME_LABEL[selectedTf]} aspirations
                        </h3>
                        <p class="oam-phase-subtitle">
                            Describe your goal and select one or more categories
                        </p>

                        <textarea
                            class="oam-textarea oam-textarea--first"
                            rows="3"
                            placeholder="Describe your aspirational goals for this {TIMEFRAME_LABEL[selectedTf]}..."
                            bind:value={goalDescriptionInput}
                            disabled={aspirationalBusy}
                        ></textarea>

                        <div class="oam-categories">
                            {#each CATEGORIES as cat}
                                <button
                                    type="button"
                                    class="oam-category-card"
                                    class:oam-category-card--selected={selectedCategories.has(cat.id)}
                                    style:--cat-color={CATEGORY_COLORS[cat.id]}
                                    disabled={aspirationalBusy}
                                    on:click={() => toggleCategory(cat.id)}
                                >
                                    <div class="oam-category-checkbox">
                                        {#if selectedCategories.has(cat.id)}
                                            <span class="material-symbols-rounded" style:color={CATEGORY_COLORS[cat.id]}>check_circle</span>
                                        {:else}
                                            <span class="material-symbols-rounded" style:color="rgba(255,255,255,0.3)">circle</span>
                                        {/if}
                                    </div>
                                    <span
                                        class="material-symbols-rounded oam-category-icon"
                                        aria-hidden="true">{cat.icon}</span
                                    >
                                    <span class="oam-category-name"
                                        >{cat.name}</span
                                    >
                                </button>
                            {/each}
                        </div>

                        <div class="oam-actions">
                            <span class="oam-selection-count">
                                {selectedCategories.size} categor{selectedCategories.size === 1 ? 'y' : 'ies'} selected
                            </span>
                            <button
                                type="button"
                                class="oam-btn oam-btn--primary"
                                disabled={aspirationalBusy ||
                                    selectedCategories.size === 0}
                                on:click={generateObjectiveSuggestions}
                            >
                                {aspirationalBusy
                                    ? "Generating..."
                                    : "Generate goal suggestions"}
                            </button>
                        </div>
                    {:else if aspirationalPhase === "objectives"}
                        <div class="oam-nav">
                            <button
                                type="button"
                                class="oam-btn oam-btn--ghost oam-btn--small"
                                on:click={backToInput}
                            >
                                ← Back
                            </button>
                        </div>

                        <h3 class="oam-phase-title">
                            Select goals to pursue
                            {#if suggestedObjectives.length > 0}
                                <span class="oam-count-badge">({suggestedObjectives.filter(o => o.selected).length} selected)</span>
                            {/if}
                        </h3>
                        <p class="oam-phase-subtitle">
                            Choose one or more objectives, or create your own
                        </p>

                        {#if aspirationalBusy}
                            <p class="oam-muted">Generating suggestions...</p>
                        {:else}
                            <div class="oam-objectives-list">
                                {#each suggestedObjectives as obj, idx}
                                    <button
                                        type="button"
                                        class="oam-objective-card"
                                        class:oam-objective-card--selected={obj.selected}
                                        on:click={() => toggleObjectiveSelection(idx)}
                                    >
                                        <div class="oam-objective-card-header">
                                            <input
                                                type="checkbox"
                                                checked={obj.selected}
                                                on:change={() => toggleObjectiveSelection(idx)}
                                                on:click|stopPropagation
                                            />
                                            <div class="oam-objective-card-title">
                                                {obj.title}
                                            </div>
                                            <span
                                                class="oam-objective-card-category"
                                                style:background-color={CATEGORY_COLORS[obj.category]}
                                            >
                                                {obj.category}
                                            </span>
                                        </div>
                                        {#if obj.description}
                                            <div class="oam-objective-card-desc">
                                                {obj.description}
                                            </div>
                                        {/if}
                                    </button>
                                {/each}

                                <div class="oam-divider" />

                                <div
                                    class="oam-objective-card oam-objective-card--custom"
                                    class:oam-objective-card--selected={customObjectiveTitle.trim().length > 0}
                                >
                                    <div class="oam-objective-card-title">
                                        Create custom goal (optional)
                                    </div>
                                    <input
                                        type="text"
                                        class="oam-input"
                                        placeholder="Enter your custom goal title"
                                        bind:value={customObjectiveTitle}
                                    />
                                </div>
                            </div>

                            <div class="oam-actions">
                                <span class="oam-selection-count">
                                    {suggestedObjectives.filter(o => o.selected).length + (customObjectiveTitle.trim() ? 1 : 0)} goal{suggestedObjectives.filter(o => o.selected).length + (customObjectiveTitle.trim() ? 1 : 0) === 1 ? '' : 's'} selected
                                </span>
                                <button
                                    type="button"
                                    class="oam-btn oam-btn--primary"
                                    disabled={suggestedObjectives.filter(o => o.selected).length === 0 &&
                                        !customObjectiveTitle.trim()}
                                    on:click={proceedToHabits}
                                >
                                    Continue to habits →
                                </button>
                            </div>
                        {/if}
                    {:else if aspirationalPhase === "habits"}
                        <div class="oam-nav">
                            <button
                                type="button"
                                class="oam-btn oam-btn--ghost oam-btn--small"
                                on:click={backToObjectives}
                            >
                                ← Back to goals
                            </button>
                        </div>

                        <h3 class="oam-phase-title">
                            Supporting habits
                            {#if suggestedHabits.length > 0}
                                <span class="oam-count-badge">({suggestedHabits.filter(h => h.selected).length} selected)</span>
                            {/if}
                        </h3>
                        <p class="oam-phase-subtitle">
                            Select habits to support your goals
                        </p>

                        {#if aspirationalBusy}
                            <p class="oam-muted">
                                Suggesting supporting habits...
                            </p>
                        {:else}
                            <div class="oam-habits-list">
                                {#each suggestedHabits as habit, idx}
                                    <label class="oam-habit-row">
                                        <input
                                            type="checkbox"
                                            checked={habit.selected}
                                            on:change={() =>
                                                toggleHabitSelection(idx)}
                                        />
                                        <div class="oam-habit-info">
                                            <div class="oam-habit-title">
                                                {habit.title}
                                            </div>
                                            {#if habit.description}
                                                <div class="oam-habit-desc">
                                                    {habit.description}
                                                </div>
                                            {/if}
                                            <div class="oam-habit-meta">
                                                <span
                                                    class="oam-habit-category"
                                                    style:--cat-color={CATEGORY_COLORS[habit.category] || CATEGORY_COLORS[selectedCategories.values().next().value]}
                                                >
                                                    {habit.category || selectedCategories.values().next().value}
                                                </span>
                                                <span class="oam-habit-timeframe"
                                                    >{TIMEFRAME_LABEL[habit.timeframe] || habit.timeframe}</span
                                                >
                                                {#if suggestedObjectives.length > 1 || customObjectiveTitle.trim()}
                                                    <span class="oam-habit-parent" title="Supports: {habit.parentObjectiveTitle}">
                                                        for: {habit.parentObjectiveTitle.slice(0, 30)}{habit.parentObjectiveTitle.length > 30 ? '...' : ''}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </label>
                                {/each}
                            </div>

                            <div class="oam-actions">
                                <span class="oam-selection-count">
                                    {suggestedHabits.filter((h) => h.selected).length} habit{suggestedHabits.filter((h) => h.selected).length === 1 ? '' : 's'} selected
                                </span>
                                <button
                                    type="button"
                                    class="oam-btn oam-btn--primary"
                                    disabled={saveHabitsBusy}
                                    on:click={saveObjectiveAndHabits}
                                >
                                    {saveHabitsBusy
                                        ? "Saving..."
                                        : `Add ${suggestedObjectives.filter(o => o.selected).length + (customObjectiveTitle.trim() ? 1 : 0)} goal${suggestedObjectives.filter(o => o.selected).length + (customObjectiveTitle.trim() ? 1 : 0) === 1 ? '' : 's'}${suggestedHabits.filter((h) => h.selected).length > 0 ? ` and ${suggestedHabits.filter((h) => h.selected).length} habit${suggestedHabits.filter((h) => h.selected).length === 1 ? '' : 's'}` : ''}`}
                                </button>
                            </div>
                        {/if}
                    {/if}
                {:else}
                    <!-- Legacy Q&A Flow -->
                    {#if legacyPhase === "qa"}
                        {#if initBusy}
                            <p class="oam-muted">Preparing questions…</p>
                        {:else}
                            <textarea
                                class="oam-textarea oam-textarea--first"
                                rows="2"
                                placeholder="Describe your goal — Enter adds it and requests more questions."
                                bind:value={goalInput}
                                on:keydown={onGoalKeydown}
                                disabled={goalBusy}
                            ></textarea>
                            {#if goalMemory.length}
                                <ul class="oam-goals">
                                    {#each goalMemory as g, i (i)}
                                        <li class="oam-goal-chip">{g}</li>
                                    {/each}
                                </ul>
                            {/if}
                            <div class="oam-q-list">
                                {#each questions as q (q.id)}
                                    <div class="oam-q">
                                        <div class="oam-q-prompt">{q.prompt}</div>
                                        <div class="oam-choices">
                                            {#each q.choices as ch (ch)}
                                                <button
                                                    type="button"
                                                    class="oam-choice"
                                                    class:oam-choice--on={(
                                                        answers[q.id]
                                                            ?.selected || []
                                                    ).includes(ch)}
                                                    on:click={() =>
                                                        toggleChoice(q.id, ch)}
                                                >
                                                    {ch}
                                                </button>
                                            {/each}
                                        </div>
                                        <input
                                            class="oam-input"
                                            type="text"
                                            placeholder="Notes (optional)"
                                            value={answers[q.id]?.freeform || ""}
                                            on:input={(e) =>
                                                setFreeform(
                                                    q.id,
                                                    /** @type {HTMLInputElement} */ (
                                                        e.currentTarget
                                                    ).value,
                                                )}
                                        />
                                    </div>
                                {/each}
                            </div>
                            <div class="oam-actions oam-actions--wrap">
                                <button
                                    type="button"
                                    class="oam-btn oam-btn--ghost"
                                    disabled={moreBusy || initBusy}
                                    on:click={moreQuestions}
                                >
                                    {moreBusy ? "…" : "More questions"}
                                </button>
                                <button
                                    type="button"
                                    class="oam-btn oam-btn--primary"
                                    disabled={genBusy || initBusy}
                                    on:click={generateObjective}
                                >
                                    {genBusy
                                        ? "Generating…"
                                        : "Generate objective"}
                                </button>
                            </div>
                        {/if}
                    {:else if legacyPhase === "suggestions" && preview}
                        <div class="oam-preview">
                            <h3 class="oam-preview-title">{preview.title}</h3>
                            <p class="oam-preview-desc">{preview.description}</p>
                            {#if preview.duration}
                                <p class="oam-preview-meta">
                                    Duration: {preview.duration.value}
                                    {preview.duration.period}
                                </p>
                            {/if}
                            {#if preview.children.length}
                                <ul class="oam-preview-kids">
                                    {#each preview.children as c, i (i)}
                                        <li>{c.title}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        <div class="oam-actions">
                            <button
                                type="button"
                                class="oam-btn oam-btn--ghost"
                                on:click={backToQa}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                class="oam-btn oam-btn--primary"
                                disabled={genBusy}
                                on:click={savePreviewObjective}
                            >
                                Add / save objective
                            </button>
                        </div>
                        <div class="oam-divider" />
                        {#if suggestBusy}
                            <p class="oam-muted">Generating titles…</p>
                        {:else if suggestedTitles.length === 0}
                            <p class="oam-muted">No extra titles suggested.</p>
                        {:else}
                            <ul class="oam-suggest-list">
                                {#each suggestedTitles as t (t)}
                                    <li class="oam-suggest-row">
                                        <label class="oam-check">
                                            <input
                                                type="checkbox"
                                                checked={pickedTitles[t] ?? false}
                                                on:change={(e) => {
                                                    pickedTitles = {
                                                        ...pickedTitles,
                                                        [t]: /** @type {HTMLInputElement} */ (
                                                            e.currentTarget
                                                        ).checked,
                                                    };
                                                }}
                                            />
                                            <span>{t}</span>
                                        </label>
                                    </li>
                                {/each}
                            </ul>
                            <div class="oam-actions">
                                <button
                                    type="button"
                                    class="oam-btn oam-btn--primary"
                                    disabled={addManyBusy}
                                    on:click={addPickedObjectives}
                                >
                                    Add selected
                                </button>
                            </div>
                        {/if}
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .oam-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10003;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
    }

    .oam-dialog {
        position: relative;
        display: flex;
        flex-direction: column;
        width: min(560px, 100%);
        max-height: min(88vh, 800px);
        border-radius: 16px;
        background: var(--st-bg-primary, #1a1a1a);
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .oam-close-fab {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 2;
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

    .oam-close-fab:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .oam-body {
        padding: 14px 14px 16px;
        padding-top: 48px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        flex: 1;
        min-height: 0;
    }

    .oam-phase-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
    }

    .oam-phase-subtitle {
        margin: 0 0 16px;
        font-size: 14px;
        color: var(--st-text-muted, #888);
    }

    .oam-input,
    .oam-textarea {
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

    .oam-textarea {
        resize: vertical;
        min-height: 72px;
    }

    .oam-textarea--first {
        margin-bottom: 16px;
    }

    /* Categories Grid */
    .oam-categories {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 16px;
    }

    .oam-category-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 16px 12px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: var(--st-text-primary, #eee);
        cursor: pointer;
        font-family: inherit;
        transition:
            border-color 0.15s ease,
            background 0.15s ease;
    }

    .oam-category-card:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .oam-category-card--selected {
        border-color: var(--cat-color, rgba(120, 170, 255, 0.8));
        background: rgba(120, 170, 255, 0.1);
    }

    .oam-category-card:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .oam-category-checkbox {
        position: absolute;
        top: 8px;
        right: 8px;
    }

    .oam-category-checkbox .material-symbols-rounded {
        font-size: 18px;
    }

    .oam-category-icon {
        font-size: 28px;
        color: var(--cat-color, var(--st-text-primary, #eee));
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
    }

    .oam-category-name {
        font-size: 13px;
        font-weight: 500;
    }

    .oam-selection-count {
        font-size: 13px;
        color: var(--st-text-muted, #888);
    }

    .oam-count-badge {
        font-size: 14px;
        font-weight: 500;
        color: var(--st-text-muted, #888);
    }

    /* Objectives List */
    .oam-objectives-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
    }

    .oam-objective-card {
        text-align: left;
        padding: 14px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: var(--st-text-primary, #eee);
        cursor: pointer;
        font-family: inherit;
        transition:
            border-color 0.15s ease,
            background 0.15s ease;
    }

    .oam-objective-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .oam-objective-card--selected {
        border-color: rgba(120, 170, 255, 0.8);
        background: rgba(120, 170, 255, 0.12);
    }

    .oam-objective-card--custom {
        padding: 12px;
    }

    .oam-objective-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
    }

    .oam-objective-card-header input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        flex-shrink: 0;
    }

    .oam-objective-card-title {
        flex: 1;
        font-size: 15px;
        font-weight: 600;
        min-width: 0;
    }

    .oam-objective-card-category {
        flex-shrink: 0;
        font-size: 10px;
        padding: 3px 8px;
        border-radius: 999px;
        color: #fff;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .oam-objective-card-desc {
        font-size: 13px;
        color: var(--st-text-muted, #aaa);
        line-height: 1.4;
        padding-left: 28px;
    }

    /* Habits List */
    .oam-habits-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
    }

    .oam-habit-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        transition: background 0.12s ease;
    }

    .oam-habit-row:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .oam-habit-row input[type="checkbox"] {
        margin-top: 2px;
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .oam-habit-info {
        flex: 1;
    }

    .oam-habit-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
    }

    .oam-habit-desc {
        font-size: 12px;
        color: var(--st-text-muted, #999);
        margin-bottom: 6px;
        line-height: 1.3;
    }

    .oam-habit-meta {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .oam-habit-category {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--cat-color, rgba(120, 170, 255, 0.3));
        color: #fff;
        font-weight: 500;
    }

    .oam-habit-timeframe {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.15);
        color: var(--st-text-muted, #aaa);
    }

    .oam-habit-parent {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(120, 170, 255, 0.15);
        color: rgba(120, 170, 255, 0.9);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Navigation */
    .oam-nav {
        margin-bottom: 12px;
    }

    .oam-btn--small {
        padding: 6px 12px;
        font-size: 13px;
    }

    /* Legacy styles */
    .oam-goals {
        list-style: none;
        margin: 0 0 12px;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .oam-goal-chip {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(120, 170, 255, 0.2);
        color: var(--st-text-primary, #eee);
    }

    .oam-q-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 16px;
    }

    .oam-q {
        padding: 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
    }

    .oam-q-prompt {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--st-text-primary, #eee);
    }

    .oam-choices {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }

    .oam-choice {
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: transparent;
        color: var(--st-text-muted, #ccc);
        cursor: pointer;
        font-family: inherit;
    }

    .oam-choice--on {
        border-color: rgba(120, 170, 255, 0.65);
        background: rgba(120, 170, 255, 0.15);
        color: var(--st-text-primary, #fff);
    }

    .oam-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
    }

    .oam-actions--wrap {
        flex-wrap: wrap;
    }

    .oam-btn {
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        cursor: pointer;
        border: 1px solid transparent;
    }

    .oam-btn--ghost {
        background: transparent;
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.15));
        color: var(--st-text-primary, #ddd);
    }

    .oam-btn--primary {
        background: rgba(80, 120, 220, 0.35);
        border-color: rgba(120, 160, 255, 0.4);
        color: var(--st-text-primary, #fff);
    }

    .oam-btn:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .oam-error {
        margin: 0 0 12px;
        font-size: 13px;
        color: #f88;
    }

    .oam-muted {
        margin: 0 0 12px;
        font-size: 13px;
        color: var(--st-text-muted, #888);
    }

    .oam-preview {
        margin-bottom: 12px;
    }

    .oam-preview-title {
        margin: 0 0 8px;
        font-size: 17px;
        color: var(--st-text-primary, #fff);
    }

    .oam-preview-desc {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.45;
        color: var(--st-text-muted, #ccc);
    }

    .oam-preview-meta {
        margin: 0 0 8px;
        font-size: 13px;
        color: var(--st-text-muted, #aaa);
    }

    .oam-preview-kids {
        margin: 0;
        padding-left: 1.2rem;
        font-size: 13px;
        color: var(--st-text-muted, #bbb);
    }

    .oam-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 16px 0;
    }

    .oam-suggest-list {
        list-style: none;
        margin: 0 0 12px;
        padding: 0;
    }

    .oam-suggest-row {
        margin-bottom: 6px;
    }

    .oam-check {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 14px;
        color: var(--st-text-primary, #eee);
        cursor: pointer;
    }
</style>
