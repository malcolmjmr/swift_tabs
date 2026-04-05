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
