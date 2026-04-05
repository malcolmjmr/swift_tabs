import { TIMEFRAME_ORDER } from "./objectiveTypes.js";

/** @typedef {'backlog'|'scheduled'} Bucket */

/**
 * Whether schedule fields satisfy the precision for this timeframe column.
 * century/decade/year: year set → scheduled
 * month: year + month
 * week: year + month + day (day anchors the week)
 * today: year + month + day (time optional for all-day)
 *
 * @param {import('./objectiveTypes.js').Objective} o
 * @param {import('./objectiveTypes.js').Timeframe} timeframe
 * @returns {Bucket}
 */
export function bucketForObjective(o, timeframe) {
    if (o.timeframe !== timeframe) return "backlog";

    const y = o.year != null && Number.isFinite(o.year);
    const m = o.month != null && Number.isFinite(o.month);
    const d = o.day != null && Number.isFinite(o.day);

    switch (timeframe) {
        case "century":
        case "decade":
        case "year":
            return y ? "scheduled" : "backlog";
        case "month":
            return y && m ? "scheduled" : "backlog";
        case "week":
            return y && m && d ? "scheduled" : "backlog";
        case "today":
            return y && m && d ? "scheduled" : "backlog";
        default:
            return "backlog";
    }
}

/**
 * End-of-day in local timezone for y,m,d (month 1-12).
 * @param {number} y
 * @param {number} mo
 * @param {number} da
 * @returns {number}
 */
function endOfLocalDayMs(y, mo, da) {
    const dt = new Date(y, mo - 1, da, 23, 59, 59, 999);
    return dt.getTime();
}

/**
 * Parse HH:mm to minutes from midnight; invalid → null.
 * @param {string|null|undefined} t
 * @returns {number|null}
 */
function parseTimeMinutes(t) {
    if (t == null || typeof t !== "string") return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
}

/**
 * @param {import('./objectiveTypes.js').Objective} o
 * @param {number} nowMs
 * @returns {boolean}
 */
export function isObjectiveOverdue(o, nowMs = Date.now()) {
    if (o.status === "completed") return false;

    const y = o.year;
    const mo = o.month;
    const da = o.day;
    const tm = o.time;

    if (y == null || !Number.isFinite(y)) return false;

    if (o.timeframe === "century" || o.timeframe === "decade") {
        const endYear =
            o.timeframe === "decade"
                ? Math.floor(y / 10) * 10 + 9
                : Math.floor(y / 100) * 100 + 99;
        const end = new Date(endYear, 11, 31, 23, 59, 59, 999).getTime();
        return nowMs > end;
    }

    if (o.timeframe === "year") {
        const end = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
        return nowMs > end;
    }

    if (mo == null || !Number.isFinite(mo)) return false;

    if (o.timeframe === "month") {
        const lastDay = new Date(y, mo, 0).getDate();
        const end = endOfLocalDayMs(y, mo, lastDay);
        return nowMs > end;
    }

    if (da == null || !Number.isFinite(da)) return false;

    if (o.timeframe === "week") {
        const start = new Date(y, mo - 1, da);
        const dow = start.getDay();
        const daysUntilSat = (6 - dow + 7) % 7;
        const end = new Date(
            y,
            mo - 1,
            da + daysUntilSat,
            23,
            59,
            59,
            999,
        );
        return nowMs > end.getTime();
    }

    const mins = parseTimeMinutes(tm);
    if (mins != null && o.timeframe === "today") {
        const start = new Date(y, mo - 1, da, 0, 0, 0, 0).getTime();
        const due = start + mins * 60 * 1000;
        return nowMs > due;
    }

    const endDay = endOfLocalDayMs(y, mo, da);
    return nowMs > endDay;
}

/**
 * Clear schedule fields finer than timeframe so the item returns to backlog bucket.
 * @param {import('./objectiveTypes.js').Objective} o
 * @returns {import('./objectiveTypes.js').Objective}
 */
export function demoteOverdueSchedule(o) {
    const t = o.timeframe;
    if (t === "century" || t === "decade" || t === "year") {
        return { ...o, year: null, month: null, day: null, time: null };
    }
    if (t === "month") {
        return { ...o, month: null, day: null, time: null };
    }
    if (t === "week") {
        return { ...o, day: null, time: null };
    }
    return { ...o, time: null, day: null };
}

/**
 * @param {import('./objectiveTypes.js').Objective[]} list
 * @param {number} [nowMs]
 * @returns {import('./objectiveTypes.js').Objective[]}
 */
export function reconcileOverdueObjectives(list, nowMs = Date.now()) {
    const out = [];
    for (const o of list) {
        if (
            bucketForObjective(o, o.timeframe) === "scheduled" &&
            isObjectiveOverdue(o, nowMs)
        ) {
            out.push(demoteOverdueSchedule(o));
        }
    }
    return out;
}

/**
 * Backlog → scheduled: same timeframe or finer target column.
 *
 * @param {import('./objectiveTypes.js').Timeframe} sourceTf
 * @param {import('./objectiveTypes.js').Timeframe} targetTf
 * @returns {boolean}
 */
export function canScheduleDrop(sourceTf, targetTf) {
    return TIMEFRAME_ORDER[targetTf] >= TIMEFRAME_ORDER[sourceTf];
}
