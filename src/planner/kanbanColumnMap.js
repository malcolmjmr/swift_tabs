import {
    bucketForObjective,
    demoteOverdueSchedule,
} from "./dueSemantics.js";
import {
    fallbackScheduleForTimeframe,
    sanitizeScheduleForTimeframe,
} from "./scheduleUtils.js";
import { normalizeObjective } from "./objectiveTypes.js";

/** @typedef {'backlog'|'todo'|'in_progress'|'done'} KanbanColumnId */

/**
 * @param {import('./objectiveTypes.js').Objective} o
 * @param {import('./objectiveTypes.js').Timeframe} tf
 * @returns {KanbanColumnId|null}
 */
export function kanbanColumnForObjective(o, tf) {
    if (o.timeframe !== tf) return null;
    if (o.status === "completed") return "done";
    if (o.status === "in_progress") return "in_progress";
    if (
        bucketForObjective(o, tf) === "scheduled" &&
        (o.status === "active" || o.status === "blocked")
    ) {
        return "todo";
    }
    return "backlog";
}

/**
 * @param {import('./objectiveTypes.js').Objective} o
 * @param {import('./objectiveTypes.js').Timeframe} tf
 * @param {KanbanColumnId} targetColumn
 * @returns {import('./objectiveTypes.js').Objective}
 */
export function applyObjectiveToKanbanColumn(o, tf, targetColumn) {
    /** @type {import('./objectiveTypes.js').Objective} */
    let next = { ...o, timeframe: tf };

    switch (targetColumn) {
        case "backlog": {
            next = demoteOverdueSchedule(next);
            if (
                next.status === "completed" ||
                next.status === "in_progress"
            ) {
                next = { ...next, status: "active" };
            }
            break;
        }
        case "todo": {
            if (bucketForObjective(next, tf) !== "scheduled") {
                const s = sanitizeScheduleForTimeframe(
                    tf,
                    fallbackScheduleForTimeframe(tf),
                );
                next = {
                    ...next,
                    year: s.year,
                    month: s.month,
                    day: s.day,
                    time: s.time,
                };
            }
            next = { ...next, status: "active" };
            break;
        }
        case "in_progress": {
            if (bucketForObjective(next, tf) !== "scheduled") {
                const s = sanitizeScheduleForTimeframe(
                    tf,
                    fallbackScheduleForTimeframe(tf),
                );
                next = {
                    ...next,
                    year: s.year,
                    month: s.month,
                    day: s.day,
                    time: s.time,
                };
            }
            next = { ...next, status: "in_progress" };
            break;
        }
        case "done":
            next = { ...next, status: "completed" };
            break;
        default:
            break;
    }

    return normalizeObjective(next);
}

/**
 * Short subtitle for the selected timeframe anchored on "now" (local).
 * @param {import('./objectiveTypes.js').Timeframe} tf
 * @returns {string}
 */
export function timeframeCurrentPeriodSubtitle(tf) {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();

    switch (tf) {
        case "today":
            return d.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        case "week": {
            const start = new Date(y, m, day);
            const dow = start.getDay();
            start.setDate(start.getDate() - dow);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const o = { month: "short", day: "numeric" };
            return `${start.toLocaleDateString(undefined, o)} – ${end.toLocaleDateString(undefined, { ...o, year: "numeric" })}`;
        }
        case "month":
            return d.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
            });
        case "year":
            return String(y);
        case "decade": {
            const startDec = Math.floor(y / 10) * 10;
            return `${startDec}s`;
        }
        case "century": {
            const c = Math.ceil(y / 100);
            const suffix =
                c % 10 === 1 && c % 100 !== 11
                    ? "st"
                    : c % 10 === 2 && c % 100 !== 12
                      ? "nd"
                      : c % 10 === 3 && c % 100 !== 13
                        ? "rd"
                        : "th";
            return `${c}${suffix} century`;
        }
        default:
            return "";
    }
}
