/** @typedef {'century'|'decade'|'year'|'month'|'week'|'today'} Timeframe */

/** @typedef {'goal'|'habit'} ObjectiveType */

/**
 * @typedef {'active'|'in_progress'|'blocked'|'completed'} ObjectiveStatus
 */

/**
 * @typedef {Object} Objective
 * @property {string} id
 * @property {ObjectiveType} type
 * @property {string} title
 * @property {string} description
 * @property {string} instructions
 * @property {Timeframe} timeframe
 * @property {number|null|undefined} year
 * @property {number|null|undefined} month 1-12
 * @property {number|null|undefined} day 1-31
 * @property {string|null|undefined} time HH:mm
 * @property {ObjectiveStatus} status
 * @property {string[]} parents
 * @property {string[]} children
 * @property {number} created Unix ms
 * @property {string} [habitCadence] e.g. daily, weekly
 * @property {number} [habitStreak]
 * @property {number} [habitLastLogged] Unix ms
 * @property {string} [url] Optional http(s) link when objective represents a saved URL
 * @property {number|null} [durationValue] Estimated effort length (e.g. hours)
 * @property {string} [durationPeriod] Unit: minute, hour, day, week, month, or free text
 * @property {boolean} [isRecurring] True if this is a habit/recurring objective
 * @property {string} [category] Category for habits/goals: Health, Learning, Productivity, Creativity, Social, Wellness, Finance, Career
 * @property {number} [completionCount] Number of times a habit has been completed
 */

export const TIMEFRAMES = /** @type {const} */ ([
    "century",
    "decade",
    "year",
    "month",
    "week",
    "today",
]);

/** Coarse → fine */
export const TIMEFRAME_ORDER = Object.freeze(
    Object.fromEntries(TIMEFRAMES.map((t, i) => [t, i])),
);

/**
 * @param {Timeframe} a
 * @param {Timeframe} b
 * @returns {number}
 */
export function compareTimeframe(a, b) {
    return TIMEFRAME_ORDER[a] - TIMEFRAME_ORDER[b];
}

/**
 * @param {Timeframe} t
 * @returns {Timeframe|null}
 */
export function nextFinerTimeframe(t) {
    const i = TIMEFRAME_ORDER[t];
    if (i === undefined || i >= TIMEFRAMES.length - 1) return null;
    return TIMEFRAMES[i + 1];
}

/**
 * @param {Timeframe} t
 * @returns {Timeframe|null}
 */
export function prevCoarserTimeframe(t) {
    const i = TIMEFRAME_ORDER[t];
    if (i === undefined || i <= 0) return null;
    return TIMEFRAMES[i - 1];
}

/**
 * @param {unknown} v
 * @returns {v is Timeframe}
 */
export function isTimeframe(v) {
    return typeof v === "string" && TIMEFRAME_ORDER[/** @type {Timeframe} */ (v)] !== undefined;
}

/**
 * @param {Partial<Objective>} raw
 * @returns {Objective}
 */
export function normalizeObjective(raw) {
    const id =
        typeof raw.id === "string" && raw.id
            ? raw.id
            : crypto.randomUUID();
    const timeframe = isTimeframe(raw.timeframe)
        ? raw.timeframe
        : "month";
    const type =
        raw.type === "habit" || raw.type === "goal" ? raw.type : "goal";
    const status =
        raw.status === "in_progress" ||
        raw.status === "blocked" ||
        raw.status === "completed" ||
        raw.status === "active"
            ? raw.status
            : "active";

    const urlTrim =
        typeof raw.url === "string" && raw.url.trim() ? raw.url.trim() : "";

    /** @type {import('./objectiveTypes.js').Objective} */
    const out = {
        id,
        type,
        title: typeof raw.title === "string" ? raw.title : "",
        description: typeof raw.description === "string" ? raw.description : "",
        instructions:
            typeof raw.instructions === "string" ? raw.instructions : "",
        timeframe,
        year: raw.year == null ? null : Number(raw.year),
        month: raw.month == null ? null : Number(raw.month),
        day: raw.day == null ? null : Number(raw.day),
        time:
            raw.time == null || raw.time === ""
                ? null
                : String(raw.time),
        status,
        parents: Array.isArray(raw.parents)
            ? raw.parents.filter((x) => typeof x === "string")
            : [],
        children: Array.isArray(raw.children)
            ? raw.children.filter((x) => typeof x === "string")
            : [],
        created:
            typeof raw.created === "number" && Number.isFinite(raw.created)
                ? raw.created
                : Date.now(),
        habitCadence:
            type === "habit" && typeof raw.habitCadence === "string"
                ? raw.habitCadence
                : "",
        habitStreak:
            type === "habit"
                ? typeof raw.habitStreak === "number"
                    ? raw.habitStreak
                    : 0
                : undefined,
        habitLastLogged:
            type === "habit" &&
            typeof raw.habitLastLogged === "number"
                ? raw.habitLastLogged
                : undefined,
        isRecurring: typeof raw.isRecurring === "boolean" ? raw.isRecurring : false,
        category: typeof raw.category === "string" ? raw.category : "",
        completionCount: typeof raw.completionCount === "number" ? raw.completionCount : 0,
    };
    const dv = raw.durationValue;
    const dvn =
        dv == null || dv === ""
            ? null
            : typeof dv === "number"
              ? dv
              : Number(dv);
    if (dvn != null && Number.isFinite(dvn)) {
        out.durationValue = dvn;
    } else {
        out.durationValue = null;
    }
    const dp =
        typeof raw.durationPeriod === "string" ? raw.durationPeriod.trim() : "";
    if (dp) out.durationPeriod = dp;
    if (urlTrim) out.url = urlTrim;
    return out;
}

/**
 * @returns {Objective}
 */
export function createBlankObjective(overrides = {}) {
    return normalizeObjective({
        id: crypto.randomUUID(),
        type: "goal",
        title: "",
        description: "",
        instructions: "",
        timeframe: "month",
        year: null,
        month: null,
        day: null,
        time: null,
        status: "active",
        parents: [],
        children: [],
        created: Date.now(),
        ...overrides,
    });
}
