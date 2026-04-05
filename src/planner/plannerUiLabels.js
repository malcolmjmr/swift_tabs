/**
 * Shared planner UI ordering and labels (keep in sync with PlannerApp sections).
 */
import { TIMEFRAMES } from "./objectiveTypes.js";

/** @type {Record<import('./objectiveTypes.js').Timeframe, string>} */
export const TIMEFRAME_LABEL = {
    century: "This century",
    decade: "This decade",
    year: "This year",
    month: "This month",
    week: "This week",
    today: "Today",
};

/** Today → coarse (reverse of semantic coarse→fine order). */
export const TIMEFRAMES_DISPLAY = /** @type {import('./objectiveTypes.js').Timeframe[]} */ (
    [...TIMEFRAMES].reverse()
);
