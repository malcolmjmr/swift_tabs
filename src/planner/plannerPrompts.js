/**
 * @param {import('./objectiveTypes.js').Objective} objective
 * @param {import('./objectiveTypes.js').Timeframe} targetTimeframe
 * @param {string} todayIso
 */
export function buildScheduleUserPrompt(objective, targetTimeframe, todayIso) {
    return [
        `Today (user local context): ${todayIso}.`,
        `Objective title: ${objective.title}`,
        `Objective description: ${objective.description || "(none)"}`,
        `Source timeframe (where it lived): ${objective.timeframe}`,
        `Target timeframe (user dropped here): ${targetTimeframe}`,
        "",
        "Return a single JSON object only (no markdown) with keys:",
        "- year: number or null",
        "- month: 1-12 or null",
        "- day: 1-31 or null",
        "- time: string \"HH:mm\" in 24h or null (only when target is today and a specific time makes sense)",
        "- subgoals: array of { title: string, description?: string } (0-5 short actionable subgoals for the next finer timeframe)",
        "",
        "Use null for fields that should stay unspecified per long-term planning (e.g. for target \"year\", set year, leave month/day/time null when appropriate).",
        "Subgoals should be concrete next steps, not repeats of the parent title.",
    ].join("\n");
}

export const SCHEDULE_SYSTEM_PROMPT =
    "You help schedule personal objectives. Output valid JSON only, no markdown fences.";

/**
 * @param {string} userAnswers
 * @param {import('./objectiveTypes.js').Timeframe} timeframe
 */
export function buildOnboardingUserPrompt(userAnswers, timeframe) {
    return [
        `The user is onboarding for planner timeframe: "${timeframe}".`,
        "Their free-text answers to reflection questions:",
        userAnswers || "(empty)",
        "",
        "Return JSON only: { suggestions: [ { title: string, description?: string, instructions?: string } ] }",
        "Suggest 3-6 distinct goals or habits; keep titles short.",
    ].join("\n");
}

export const ONBOARDING_SYSTEM_PROMPT =
    "You are a thoughtful planning coach. Output valid JSON only, no markdown fences.";

/**
 * @param {import('./objectiveTypes.js').Objective} habit
 */
export function buildHabitCoachPrompt(habit) {
    return [
        `Habit title: ${habit.title}`,
        `Cadence: ${habit.habitCadence || "unspecified"}`,
        `Current streak: ${habit.habitStreak ?? 0}`,
        "",
        "Give 2-4 short sentences of motivational feedback and one practical tweak if useful. Plain text only.",
    ].join("\n");
}

export const HABIT_COACH_SYSTEM_PROMPT =
    "You support habit building with concise, kind, practical feedback.";

export const ASSISTANCE_SYSTEM_PROMPT =
    "You help users clarify and structure personal objectives for a planner app. Output valid JSON only, no markdown fences.";

/**
 * @param {{
 *   selectedTimeframe: string,
 *   periodSubtitle: string,
 *   parentBacklogTitles: string[],
 * }} ctx
 */
export function buildAssistanceInitialUserPrompt(ctx) {
    return [
        "Generate 3-5 short clarifying questions to help the user define objectives for their current planning horizon.",
        `Current timeframe (UI): ${ctx.selectedTimeframe}`,
        `Current period: ${ctx.periodSubtitle || "(n/a)"}`,
        "",
        "Parent-scope backlog objectives (titles only, no sub-tasks yet):",
        ctx.parentBacklogTitles.length
            ? ctx.parentBacklogTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")
            : "(none — user is at the coarsest horizon or backlog is empty)",
        "",
        'Return JSON: { "questions": [ { "id": string, "prompt": string, "choices": string[] } ] }',
        "Each question must have 2-6 concise multiple-choice options; choices should be mutually useful toggles (user may pick several in the UI).",
        "Use stable ids like q1, q2.",
    ].join("\n");
}

/**
 * @param {{
 *   transcript: string,
 *   goalMemory: string[],
 * }} ctx
 */
export function buildAssistanceMoreQuestionsUserPrompt(ctx) {
    return [
        "Here is what the user has shared so far (goals stated on Enter, and Q&A):",
        ctx.transcript || "(empty)",
        "",
        "Goals typed so far (one per line):",
        ctx.goalMemory.length ? ctx.goalMemory.join("\n") : "(none)",
        "",
        'Return JSON: { "questions": [ { "id": string, "prompt": string, "choices": string[] } ] }',
        "Add 2-4 NEW questions that deepen scope, constraints, success criteria, or dependencies. Do not repeat prior prompts verbatim.",
        "Use new ids (e.g. q5, q6).",
    ].join("\n");
}

/**
 * @param {{
 *   transcript: string,
 *   goalMemory: string[],
 *   selectedTimeframe: string,
 * }} ctx
 */
export function buildAssistanceGenerateObjectiveUserPrompt(ctx) {
    return [
        "Synthesize one primary objective from the user's answers and stated goals.",
        `Preferred timeframe for this objective: ${ctx.selectedTimeframe} (adjust only if clearly wrong).`,
        "",
        "Context:",
        ctx.transcript || "(empty)",
        "",
        "Stated goals:",
        ctx.goalMemory.length ? ctx.goalMemory.join("\n") : "(none)",
        "",
        'Return JSON: {',
        '  "title": string,',
        '  "description": string,',
        '  "timeframe": "century"|"decade"|"year"|"month"|"week"|"today",',
        '  "duration": { "value": number, "period": "minute"|"hour"|"day"|"week"|"month" } | null,',
        '  "children": [ { "title": string, "description"?: string } ]',
        "}",
        "children: 0-8 concrete sub-steps; omit or use [] if none.",
        "duration: null if unknown.",
    ].join("\n");
}

/**
 * @param {{
 *   transcript: string,
 *   generatedTitle: string,
 *   generatedDescription: string,
 * }} ctx
 */
export function buildAssistanceSuggestTitlesUserPrompt(ctx) {
    return [
        "The user just defined an objective. Suggest 4-10 additional distinct objective titles they might add in the same planning context (short titles only).",
        `Primary objective title: ${ctx.generatedTitle}`,
        `Description summary: ${ctx.generatedDescription || "(none)"}`,
        "",
        "Full Q&A context:",
        ctx.transcript || "(empty)",
        "",
        'Return JSON: { "titles": string[] }',
        "Titles must be non-empty, unique, and not duplicates of the primary title.",
    ].join("\n");
}

/**
 * @param {{
 *   goalInput: string,
 *   category: string,
 *   timeframe: string,
 *   existingObjectives: string[],
 *   periodSubtitle: string,
 * }} ctx
 */
export function buildSuggestObjectivesForCategoryPrompt(ctx) {
    return [
        "Suggest 3-5 aspirational objectives based on the user's input for long-term planning.",
        `Timeframe: ${ctx.timeframe}`,
        `Period: ${ctx.periodSubtitle || "(n/a)"}`,
        `Category: ${ctx.category}`,
        `User's goal description: ${ctx.goalInput || "(none provided)"}`,
        "",
        "Existing objectives in this timeframe (for context, avoid duplicates):",
        ctx.existingObjectives.length
            ? ctx.existingObjectives.map((t, i) => `${i + 1}. ${t}`).join("\n")
            : "(none)",
        "",
        'Return JSON: { "objectives": [ { "title": string, "description": string } ] }',
        "Each objective should be inspiring yet achievable. Descriptions should be 1-2 sentences explaining the aspiration.",
        "Objectives should align with the selected category and timeframe scope.",
    ].join("\n");
}

/**
 * @param {{
 *   objectiveTitle: string,
 *   objectiveDescription: string,
 *   category: string,
 *   timeframe: string,
 * }} ctx
 */
export function buildSuggestHabitsPrompt(ctx) {
    return [
        "Suggest 3-6 supporting habits that would help achieve the following objective.",
        `Objective: ${ctx.objectiveTitle}`,
        `Description: ${ctx.objectiveDescription || "(none)"}`,
        `Category: ${ctx.category}`,
        `Objective timeframe: ${ctx.timeframe}`,
        "",
        "For each habit, suggest an appropriate recurrence timeframe (daily, weekly, monthly) and keep the same category or suggest a related one from: Health, Learning, Productivity, Creativity, Social, Wellness, Finance, Career.",
        "",
        'Return JSON: { "habits": [ { "title": string, "description": string, "category": string, "timeframe": "today"|"week"|"month" } ] }',
        "Habits should be concrete, actionable, and directly support the objective.",
    ].join("\n");
}

/** System prompt for aspirational goal and habit suggestions */
export const ASPIRATIONAL_ASSISTANCE_SYSTEM_PROMPT =
    "You help users set long-term aspirational goals and establish supporting habits. Output valid JSON only, no markdown fences. Be inspiring yet practical.";
