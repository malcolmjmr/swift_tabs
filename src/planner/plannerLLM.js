import {
    generateContentPlain,
    getGeminiApiKey,
    parseJsonLoose,
} from "../services/geminiClient.js";
import {
    buildHabitCoachPrompt,
    buildOnboardingUserPrompt,
    buildScheduleUserPrompt,
    HABIT_COACH_SYSTEM_PROMPT,
    ONBOARDING_SYSTEM_PROMPT,
    SCHEDULE_SYSTEM_PROMPT,
} from "./plannerPrompts.js";

/**
 * @param {import('./objectiveTypes.js').Objective} objective
 * @param {import('./objectiveTypes.js').Timeframe} targetTimeframe
 * @returns {Promise<{ year: number|null, month: number|null, day: number|null, time: string|null, subgoals: Array<{title: string, description?: string}> }>}
 */
export async function suggestScheduleAndSubgoals(objective, targetTimeframe) {
    const apiKey = await getGeminiApiKey();
    const todayIso = new Date().toISOString().slice(0, 10);
    const userText = buildScheduleUserPrompt(
        objective,
        targetTimeframe,
        todayIso,
    );
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: SCHEDULE_SYSTEM_PROMPT,
        userText,
    });
    const raw = parseJsonLoose(text);
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid schedule response");
    }
    const o = /** @type {Record<string, unknown>} */ (raw);
    return {
        year: o.year == null ? null : Number(o.year),
        month: o.month == null ? null : Number(o.month),
        day: o.day == null ? null : Number(o.day),
        time: o.time == null || o.time === "" ? null : String(o.time),
        subgoals: Array.isArray(o.subgoals)
            ? o.subgoals
                  .filter((s) => s && typeof s === "object")
                  .map((s) => {
                      const r = /** @type {Record<string, unknown>} */ (s);
                      const title =
                          typeof r.title === "string" ? r.title.trim() : "";
                      return {
                          title: title || "Untitled step",
                          description:
                              typeof r.description === "string"
                                  ? r.description
                                  : "",
                      };
                  })
            : [],
    };
}

/**
 * @param {string} userAnswers
 * @param {import('./objectiveTypes.js').Timeframe} timeframe
 * @returns {Promise<Array<{ title: string, description: string, instructions: string }>>}
 */
export async function suggestOnboardingObjectives(userAnswers, timeframe) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ONBOARDING_SYSTEM_PROMPT,
        userText: buildOnboardingUserPrompt(userAnswers, timeframe),
    });
    const raw = parseJsonLoose(text);
    const suggestions =
        raw &&
        typeof raw === "object" &&
        Array.isArray(/** @type {{ suggestions?: unknown }} */ (raw).suggestions)
            ? /** @type {{ suggestions: unknown[] }} */ (raw).suggestions
            : [];
    if (!Array.isArray(suggestions) || suggestions.length === 0) return [];
    return suggestions.map((s, i) => {
        const r = s && typeof s === "object" ? /** @type {Record<string, unknown>} */ (s) : {};
        const title =
            typeof r.title === "string" && r.title.trim()
                ? r.title.trim()
                : `Suggestion ${i + 1}`;
        return {
            title,
            description:
                typeof r.description === "string" ? r.description : "",
            instructions:
                typeof r.instructions === "string" ? r.instructions : "",
        };
    });
}

/**
 * @param {import('./objectiveTypes.js').Objective} habit
 * @returns {Promise<string>}
 */
export async function fetchHabitCoaching(habit) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: HABIT_COACH_SYSTEM_PROMPT,
        userText: buildHabitCoachPrompt(habit),
    });
    return (text || "").trim() || "Keep going — consistency beats intensity.";
}
