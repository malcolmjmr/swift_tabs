import { nextFinerTimeframe } from "./objectiveTypes.js";

/**
 * @param {import('./objectiveTypes.js').Timeframe} targetTf
 * @returns {{ year: number|null, month: number|null, day: number|null, time: string|null }}
 */
export function fallbackScheduleForTimeframe(targetTf) {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    switch (targetTf) {
        case "century":
        case "decade":
        case "year":
            return { year: y, month: null, day: null, time: null };
        case "month":
            return { year: y, month: m, day: null, time: null };
        case "week":
        case "today":
            return { year: y, month: m, day: day, time: null };
        default:
            return { year: y, month: null, day: null, time: null };
    }
}

/**
 * @param {number|null|undefined} y
 * @param {number|null|undefined} mo
 * @param {number|null|undefined} da
 */
export function clampYmd(y, mo, da) {
    let year = y != null && Number.isFinite(y) ? Math.floor(y) : null;
    let month = mo != null && Number.isFinite(mo) ? Math.min(12, Math.max(1, Math.floor(mo))) : null;
    let day = da != null && Number.isFinite(da) ? Math.floor(da) : null;
    if (year != null && month != null && day != null) {
        const last = new Date(year, month, 0).getDate();
        day = Math.min(Math.max(1, day), last);
    }
    return { year, month, day };
}

/**
 * @param {string|null|undefined} t
 * @returns {string|null}
 */
export function normalizeTimeString(t) {
    if (t == null || typeof t !== "string") return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * @param {import('./objectiveTypes.js').Timeframe} targetTf
 * @param {{ year: number|null, month: number|null, day: number|null, time: string|null }} raw
 */
export function sanitizeScheduleForTimeframe(targetTf, raw) {
    let { year, month, day } = clampYmd(raw.year, raw.month, raw.day);
    const time = normalizeTimeString(raw.time);

    if (targetTf === "century" || targetTf === "decade" || targetTf === "year") {
        return { year, month: null, day: null, time: null };
    }
    if (targetTf === "month") {
        return { year, month, day: null, time: null };
    }
    if (targetTf === "week") {
        return { year, month, day, time: null };
    }
    return { year, month, day, time };
}

/**
 * @param {import('./objectiveTypes.js').Objective} parent
 * @param {import('./objectiveTypes.js').Timeframe} scheduledTf
 * @param {Array<{ title: string, description?: string }>} subgoals
 * @param {typeof import('./objectiveTypes.js').createBlankObjective} createBlankObjective
 */
export function buildSubObjectives(parent, scheduledTf, subgoals, createBlankObjective) {
    const childTf = nextFinerTimeframe(scheduledTf);
    if (!childTf || subgoals.length === 0) return [];
    return subgoals.map((sg) =>
        createBlankObjective({
            type: "goal",
            title: sg.title,
            description: sg.description || "",
            instructions: "",
            timeframe: childTf,
            year: null,
            month: null,
            day: null,
            time: null,
            status: "active",
            parents: [],
            children: [],
        }),
    );
}

/**
 * @param {string} normalized HH:mm from normalizeTimeString
 * @returns {string}
 */
function formatTime12(normalized) {
    const m = /^(\d{2}):(\d{2})$/.exec(normalized);
    if (!m) return normalized;
    let h = Number(m[1]);
    const min = m[2];
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${ap}`;
}

/**
 * Short label for a scheduled objective in the planner list (time when set, else date by timeframe).
 * @param {import('./objectiveTypes.js').Objective} o
 * @param {import('./objectiveTypes.js').Timeframe} timeframe
 * @returns {string}
 */
export function formatScheduledCaption(o, timeframe) {
    const timeNorm = normalizeTimeString(o.time);
    if (timeNorm) {
        return formatTime12(timeNorm);
    }

    const y = o.year;
    const mo = o.month;
    const da = o.day;
    if (y == null || !Number.isFinite(y)) return "";

    if (timeframe === "century" || timeframe === "decade" || timeframe === "year") {
        return String(Math.floor(y));
    }

    if (timeframe === "month") {
        if (mo != null && Number.isFinite(mo)) {
            const d = new Date(y, mo - 1, 1);
            return d.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
            });
        }
        return String(y);
    }

    if (mo != null && da != null && Number.isFinite(mo) && Number.isFinite(da)) {
        const d = new Date(y, mo - 1, da);
        if (timeframe === "week") {
            return d.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        }
        return "";
    }

    return String(y);
}

/**
 * Sort key tuple for scheduled objectives (year, month, day, minutes-from-midnight or -1 if no time).
 * @param {import('./objectiveTypes.js').Objective} o
 * @returns {[number, number, number, number]}
 */
function scheduleSortTuple(o) {
    const y =
        o.year != null && Number.isFinite(o.year) ? Math.floor(o.year) : 100000;
    const mo =
        o.month != null && Number.isFinite(o.month) ? Math.floor(o.month) : 0;
    const d =
        o.day != null && Number.isFinite(o.day) ? Math.floor(o.day) : 0;
    const t = normalizeTimeString(o.time);
    let mins = -1;
    if (t) {
        const p = /^(\d{2}):(\d{2})$/.exec(t);
        if (p) {
            mins = Number(p[1]) * 60 + Number(p[2]);
        }
    }
    return [y, mo, d, mins];
}

/**
 * @param {import('./objectiveTypes.js').Objective} a
 * @param {import('./objectiveTypes.js').Objective} b
 * @returns {number}
 */
export function compareObjectivesBySchedule(a, b) {
    const A = scheduleSortTuple(a);
    const B = scheduleSortTuple(b);
    for (let i = 0; i < 4; i++) {
        if (A[i] !== B[i]) return A[i] - B[i];
    }
    return 0;
}
