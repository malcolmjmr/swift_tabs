/**
 * Scheduled LLM routines for apps and folders (chrome.alarms + Gemini).
 */

import {
    fetchAppRoutineRun,
    fetchFolderRoutineRun,
} from "../geminiClient.js";
import {
    appsGetLayout,
    appsListAll,
    appsPutApp,
    appsPutLayout,
} from "./appsBackground.js";
import { collectDescendantDomains } from "./appsAccess.js";
import { normalizeDomain } from "./appsModel.js";

/** @typedef {import('./appsModel.js').FetchRoutine} FetchRoutine */
/** @typedef {import('./appsModel.js').AppHomeLayout} AppHomeLayout */
/** @typedef {import('./appsModel.js').LayoutItem} LayoutItem */

/**
 * @param {number} hour
 * @param {number} minute
 */
function nextDailyWhenMs(hour, minute) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() <= Date.now()) {
        d.setDate(d.getDate() + 1);
    }
    return d.getTime();
}

/**
 * @param {FetchRoutine['schedule']} sched
 */
function createAlarmOptionsForSchedule(sched) {
    if (!sched || typeof sched !== "object") return null;
    if (sched.kind === "interval") {
        const pm = Math.max(1, Math.min(24 * 60, Number(sched.periodMinutes) || 60));
        return { periodInMinutes: pm };
    }
    if (sched.kind === "daily") {
        const h = Math.max(0, Math.min(23, Number(sched.hour) || 0));
        const m = Math.max(0, Math.min(59, Number(sched.minute) || 0));
        return { when: nextDailyWhenMs(h, m) };
    }
    return null;
}

export async function syncAppRoutineAlarms() {
    const existing = await chrome.alarms.getAll();
    for (const a of existing) {
        if (
            a.name.startsWith("appRoutine:") ||
            a.name.startsWith("folderRoutine:")
        ) {
            await chrome.alarms.clear(a.name);
        }
    }

    const [apps, layout] = await Promise.all([appsListAll(), appsGetLayout()]);

    for (const app of apps) {
        for (const r of app.fetchRoutines || []) {
            if (r.enabled === false) continue;
            const opts = createAlarmOptionsForSchedule(r.schedule);
            if (!opts) continue;
            const name = `appRoutine:${app.id}:${r.id}`;
            await chrome.alarms.create(name, opts);
        }
    }

    /** @param {LayoutItem[]} items */
    async function walkFolders(items) {
        for (const it of items || []) {
            if (it.kind !== "folder") continue;
            for (const r of it.fetchRoutines || []) {
                if (r.enabled === false) continue;
                const opts = createAlarmOptionsForSchedule(r.schedule);
                if (!opts) continue;
                const name = `folderRoutine:${it.id}:${r.id}`;
                await chrome.alarms.create(name, opts);
            }
            await walkFolders(it.items || []);
        }
    }
    await walkFolders(layout.items || []);
}

/**
 * @param {string} alarmName
 */
export async function handleRoutineAlarmName(alarmName) {
    if (alarmName.startsWith("appRoutine:")) {
        const parts = alarmName.split(":");
        const appId = parts[1];
        const routineId = parts[2];
        if (appId && routineId) await executeAppRoutine(appId, routineId);
        return;
    }
    if (alarmName.startsWith("folderRoutine:")) {
        const parts = alarmName.split(":");
        const folderId = parts[1];
        const routineId = parts[2];
        if (folderId && routineId) {
            await executeFolderRoutine(folderId, routineId);
        }
    }
}

/**
 * @param {string} appId
 * @param {string} routineId
 */
export async function executeAppRoutine(appId, routineId) {
    const apps = await appsListAll();
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const routines = [...(app.fetchRoutines || [])];
    const idx = routines.findIndex((r) => r.id === routineId);
    if (idx < 0) return;
    const routine = routines[idx];
    if (routine.enabled === false) return;

    try {
        const out = await fetchAppRoutineRun({
            domain: app.domain,
            title: app.displayTitle || app.title,
            instructions: routine.instructions,
            outputFormat: routine.outputFormat === "links" ? "links" : "text",
        });
        /** @type {FetchRoutine} */
        const next = {
            ...routine,
            lastRunAt: Date.now(),
            lastError: undefined,
            lastOutput: {
                text: out.text,
                ...(out.links?.length ? { links: out.links } : {}),
            },
        };
        routines[idx] = next;

        const savedLinks = [...(app.savedLinks || [])];
        if (
            routine.outputFormat === "links" &&
            out.links?.length
        ) {
            for (const l of out.links) {
                savedLinks.push({
                    id: `lnk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
                    url: l.url,
                    title: l.title || l.url.replace(/^https?:\/\//i, ""),
                    savedAt: Date.now(),
                });
            }
        }

        await appsPutApp({
            id: appId,
            fetchRoutines: routines,
            ...(routine.outputFormat === "links" && out.links?.length
                ? { savedLinks }
                : {}),
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        routines[idx] = {
            ...routine,
            lastRunAt: Date.now(),
            lastError: msg,
        };
        await appsPutApp({ id: appId, fetchRoutines: routines });
    }
}

/**
 * @param {LayoutItem[]} items
 * @param {string} folderId
 * @returns {import('./appsModel.js').LayoutFolder | null}
 */
function findFolderDeep(items, folderId) {
    for (const it of items || []) {
        if (it.kind === "folder") {
            if (it.id === folderId) return it;
            const inner = findFolderDeep(it.items || [], folderId);
            if (inner) return inner;
        }
    }
    return null;
}

/**
 * @param {string} folderId
 * @param {string} routineId
 */
export async function executeFolderRoutine(folderId, routineId) {
    const [layout, apps] = await Promise.all([
        appsGetLayout(),
        appsListAll(),
    ]);
    const folder = findFolderDeep(layout.items || [], folderId);
    if (!folder) return;

    const appsById = Object.fromEntries(apps.map((a) => [a.id, a]));
    const routines = [...(folder.fetchRoutines || [])];
    const idx = routines.findIndex((r) => r.id === routineId);
    if (idx < 0) return;
    const routine = routines[idx];
    if (routine.enabled === false) return;

    const appMetas = collectDescendantDomains(
        folder.items || [],
        appsById,
    ).map((d) => {
        const rec = apps.find((a) => normalizeDomain(a.domain) === d);
        return rec
            ? {
                  domain: rec.domain,
                  title: rec.displayTitle || rec.title,
              }
            : { domain: d, title: d };
    });

    try {
        const out = await fetchFolderRoutineRun({
            folderTitle: folder.title,
            apps: appMetas,
            instructions: routine.instructions,
            outputFormat: routine.outputFormat === "links" ? "links" : "text",
        });
        routines[idx] = {
            ...routine,
            lastRunAt: Date.now(),
            lastError: undefined,
            lastOutput: {
                text: out.text,
                ...(out.links?.length ? { links: out.links } : {}),
            },
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        routines[idx] = {
            ...routine,
            lastRunAt: Date.now(),
            lastError: msg,
        };
    }

    const newItems = patchFolderRoutinesInTree(
        layout.items || [],
        folderId,
        routines,
    );
    await appsPutLayout({ ...layout, items: newItems });
}

/**
 * @param {LayoutItem[]} items
 * @param {string} folderId
 * @param {FetchRoutine[]} routines
 */
function patchFolderRoutinesInTree(items, folderId, routines) {
    return (items || []).map((node) => {
        if (node.kind === "folder") {
            if (node.id === folderId) {
                return { ...node, fetchRoutines: routines };
            }
            return {
                ...node,
                items: patchFolderRoutinesInTree(
                    node.items || [],
                    folderId,
                    routines,
                ),
            };
        }
        return node;
    });
}
