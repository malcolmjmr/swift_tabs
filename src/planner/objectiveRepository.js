import { getDomainStorage } from "../services/domainStorage/storageService.js";
import { normalizeObjective } from "./objectiveTypes.js";

const COLLECTION = "objectives";

/**
 * @returns {Promise<import('./objectiveTypes.js').Objective[]>}
 */
export async function listObjectives() {
    const storage = getDomainStorage();
    const ids = await storage.listIds(COLLECTION);
    if (ids.length === 0) return [];
    const rows = await storage.getMany(COLLECTION, ids);
    return rows
        .filter((r) => r != null)
        .map((r) => normalizeObjective(/** @type {object} */ (r)));
}

/**
 * @param {string} id
 * @returns {Promise<import('./objectiveTypes.js').Objective|null>}
 */
export async function getObjective(id) {
    const storage = getDomainStorage();
    const r = await storage.get(COLLECTION, id);
    return r ? normalizeObjective(/** @type {object} */ (r)) : null;
}

/**
 * @param {import('./objectiveTypes.js').Objective} objective
 */
export async function saveObjective(objective) {
    const storage = getDomainStorage();
    const rec = { ...normalizeObjective(objective), id: objective.id };
    await storage.put(COLLECTION, rec);
}

/**
 * @param {import('./objectiveTypes.js').Objective[]} objectives
 */
export async function saveObjectivesMany(objectives) {
    if (objectives.length === 0) return;
    const storage = getDomainStorage();
    const recs = objectives.map((o) => ({
        ...normalizeObjective(o),
        id: o.id,
    }));
    await storage.putMany(COLLECTION, recs);
}

/**
 * @param {string} id
 */
export async function deleteObjective(id) {
    const storage = getDomainStorage();
    const existing = await getObjective(id);
    if (!existing) return;

    const all = await listObjectives();
    const toSave = [];

    for (const o of all) {
        if (o.id === id) continue;
        let changed = false;
        const next = { ...o };
        if (next.parents.includes(id)) {
            next.parents = next.parents.filter((p) => p !== id);
            changed = true;
        }
        if (next.children.includes(id)) {
            next.children = next.children.filter((c) => c !== id);
            changed = true;
        }
        if (changed) toSave.push(normalizeObjective(next));
    }

    await saveObjectivesMany(toSave);
    await storage.delete(COLLECTION, id);
}

/**
 * Link parent → child (updates both records).
 * @param {string} parentId
 * @param {string} childId
 */
export async function linkParentChild(parentId, childId) {
    if (parentId === childId) return;
    const parent = await getObjective(parentId);
    const child = await getObjective(childId);
    if (!parent || !child) return;

    const pChildren = new Set(parent.children);
    pChildren.add(childId);
    const cParents = new Set(child.parents);
    cParents.add(parentId);

    await saveObjectivesMany([
        normalizeObjective({
            ...parent,
            children: [...pChildren],
        }),
        normalizeObjective({
            ...child,
            parents: [...cParents],
        }),
    ]);
}

/**
 * @param {import('./objectiveTypes.js').Objective} parent
 * @param {import('./objectiveTypes.js').Objective[]} newChildren
 */
export async function attachNewChildren(parent, newChildren) {
    if (newChildren.length === 0) return;
    const childIds = newChildren.map((c) => c.id);
    const nextParent = normalizeObjective({
        ...parent,
        children: [...new Set([...parent.children, ...childIds])],
    });
    const withParents = newChildren.map((c) =>
        normalizeObjective({
            ...c,
            parents: [...new Set([...c.parents, parent.id])],
        }),
    );
    await saveObjectivesMany([nextParent, ...withParents]);
}
