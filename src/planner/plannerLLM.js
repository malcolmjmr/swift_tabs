import {
    generateContentPlain,
    getGeminiApiKey,
    parseJsonLoose,
} from "../services/geminiClient.js";
import {
    ASPIRATIONAL_ASSISTANCE_SYSTEM_PROMPT,
    ASSISTANCE_SYSTEM_PROMPT,
    buildAssistanceGenerateObjectiveUserPrompt,
    buildAssistanceInitialUserPrompt,
    buildAssistanceMoreQuestionsUserPrompt,
    buildAssistanceSuggestTitlesUserPrompt,
    buildHabitCoachPrompt,
    buildOnboardingUserPrompt,
    buildScheduleUserPrompt,
    buildSuggestHabitsPrompt,
    buildSuggestObjectivesForCategoryPrompt,
    HABIT_COACH_SYSTEM_PROMPT,
    ONBOARDING_SYSTEM_PROMPT,
    SCHEDULE_SYSTEM_PROMPT,
} from "./plannerPrompts.js";
import { isTimeframe } from "./objectiveTypes.js";

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

/**
 * @param {Parameters<import('./plannerPrompts.js').buildAssistanceInitialUserPrompt>[0]} ctx
 * @returns {Promise<Array<{ id: string, prompt: string, choices: string[] }>>}
 */
export async function assistanceInitialQuestions(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASSISTANCE_SYSTEM_PROMPT,
        userText: buildAssistanceInitialUserPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    return parseQuestionsArray(raw);
}

/**
 * @param {Parameters<import('./plannerPrompts.js').buildAssistanceMoreQuestionsUserPrompt>[0]} ctx
 * @returns {Promise<Array<{ id: string, prompt: string, choices: string[] }>>}
 */
export async function assistanceMoreQuestions(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASSISTANCE_SYSTEM_PROMPT,
        userText: buildAssistanceMoreQuestionsUserPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    return parseQuestionsArray(raw);
}

/**
 * @param {unknown} raw
 * @returns {Array<{ id: string, prompt: string, choices: string[] }>}
 */
function parseQuestionsArray(raw) {
    const q =
        raw &&
        typeof raw === "object" &&
        Array.isArray(/** @type {{ questions?: unknown }} */ (raw).questions)
            ? /** @type {{ questions: unknown[] }} */ (raw).questions
            : [];
    const out = [];
    for (let i = 0; i < q.length; i++) {
        const item = q[i];
        const r = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
        const id =
            typeof r.id === "string" && r.id.trim()
                ? r.id.trim()
                : `q${i + 1}`;
        const prompt =
            typeof r.prompt === "string" && r.prompt.trim()
                ? r.prompt.trim()
                : `Question ${i + 1}`;
        const choices = Array.isArray(r.choices)
            ? r.choices
                  .filter((c) => typeof c === "string" && c.trim())
                  .map((c) => /** @type {string} */ (c).trim())
            : [];
        out.push({ id, prompt, choices });
    }
    return out;
}

/**
 * @param {Parameters<import('./plannerPrompts.js').buildAssistanceGenerateObjectiveUserPrompt>[0]} ctx
 * @returns {Promise<{
 *   title: string,
 *   description: string,
 *   timeframe: import('./objectiveTypes.js').Timeframe,
 *   duration: { value: number, period: string } | null,
 *   children: Array<{ title: string, description: string }>,
 * }>}
 */
export async function assistanceGenerateObjective(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASSISTANCE_SYSTEM_PROMPT,
        userText: buildAssistanceGenerateObjectiveUserPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid generate response");
    }
    const o = /** @type {Record<string, unknown>} */ (raw);
    const title =
        typeof o.title === "string" && o.title.trim()
            ? o.title.trim()
            : "Untitled objective";
    const description =
        typeof o.description === "string" ? o.description : "";
    let timeframe = isTimeframe(o.timeframe) ? o.timeframe : ctx.selectedTimeframe;
    if (!isTimeframe(timeframe)) timeframe = "month";

    let duration = null;
    const d = o.duration;
    if (d && typeof d === "object") {
        const dr = /** @type {Record<string, unknown>} */ (d);
        const value = dr.value == null ? NaN : Number(dr.value);
        const period =
            typeof dr.period === "string" ? dr.period.trim() : "";
        if (Number.isFinite(value) && period) {
            duration = { value, period };
        }
    }

    const children = Array.isArray(o.children)
        ? o.children
              .filter((c) => c && typeof c === "object")
              .map((c) => {
                  const r = /** @type {Record<string, unknown>} */ (c);
                  const ct =
                      typeof r.title === "string" ? r.title.trim() : "";
                  return {
                      title: ct || "Step",
                      description:
                          typeof r.description === "string" ? r.description : "",
                  };
              })
        : [];

    return { title, description, timeframe, duration, children };
}

/**
 * @param {Parameters<import('./plannerPrompts.js').buildAssistanceSuggestTitlesUserPrompt>[0]} ctx
 * @returns {Promise<string[]>}
 */
export async function assistanceSuggestRelatedTitles(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASSISTANCE_SYSTEM_PROMPT,
        userText: buildAssistanceSuggestTitlesUserPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    const arr =
        raw &&
        typeof raw === "object" &&
        Array.isArray(/** @type {{ titles?: unknown }} */ (raw).titles)
            ? /** @type {{ titles: unknown[] }} */ (raw).titles
            : [];
    const seen = new Set();
    const out = [];
    for (const t of arr) {
        if (typeof t !== "string") continue;
        const s = t.trim();
        if (!s || seen.has(s.toLowerCase())) continue;
        seen.add(s.toLowerCase());
        out.push(s);
    }
    return out;
}

/**
 * @param {Parameters<import('./plannerPrompts.js').buildSuggestObjectivesForCategoryPrompt>[0]} ctx
 * @returns {Promise<Array<{ title: string, description: string }>>}
 */
export async function assistanceSuggestObjectivesForCategory(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASPIRATIONAL_ASSISTANCE_SYSTEM_PROMPT,
        userText: buildSuggestObjectivesForCategoryPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid objectives suggestion response");
    }
    const o = /** @type {Record<string, unknown>} */ (raw);
    const arr = Array.isArray(o.objectives) ? o.objectives : [];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const r =
            item && typeof item === "object"
                ? /** @type {Record<string, unknown>} */ (item)
                : {};
        const title =
            typeof r.title === "string" && r.title.trim()
                ? r.title.trim()
                : `Suggestion ${i + 1}`;
        const description =
            typeof r.description === "string" ? r.description : "";
        out.push({ title, description });
    }
    return out;
}

/**
 * @param {Parameters<import('./plannerPrompts.js').buildSuggestHabitsPrompt>[0]} ctx
 * @returns {Promise<Array<{ title: string, description: string, category: string, timeframe: import('./objectiveTypes.js').Timeframe }>>}
 */
export async function assistanceSuggestHabits(ctx) {
    const apiKey = await getGeminiApiKey();
    const { text } = await generateContentPlain(apiKey, {
        systemInstruction: ASPIRATIONAL_ASSISTANCE_SYSTEM_PROMPT,
        userText: buildSuggestHabitsPrompt(ctx),
    });
    const raw = parseJsonLoose(text);
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid habits suggestion response");
    }
    const o = /** @type {Record<string, unknown>} */ (raw);
    const arr = Array.isArray(o.habits) ? o.habits : [];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const r =
            item && typeof item === "object"
                ? /** @type {Record<string, unknown>} */ (item)
                : {};
        const title =
            typeof r.title === "string" && r.title.trim()
                ? r.title.trim()
                : `Habit ${i + 1}`;
        const description =
            typeof r.description === "string" ? r.description : "";
        const category = typeof r.category === "string" ? r.category : "";
        let timeframe =
            typeof r.timeframe === "string" ? r.timeframe : "week";
        if (!isTimeframe(timeframe)) timeframe = "week";
        out.push({
            title,
            description,
            category,
            timeframe: /** @type {import('./objectiveTypes.js').Timeframe} */ (
                timeframe
            ),
        });
    }
    return out;
}
