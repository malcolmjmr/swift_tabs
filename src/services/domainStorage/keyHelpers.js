import { STORAGE_PREFIX } from "./constants.js";

/**
 * @param {string} collection
 * @param {string} id
 * @returns {string}
 */
export function recordKey(collection, id) {
    return `${STORAGE_PREFIX}:${collection}:${id}`;
}

/**
 * ID manifests store only `string[]` ids; metadata lives on record keys.
 *
 * @param {string} collection
 * @param {string | null | undefined} workspaceId
 * @returns {string}
 */
export function manifestKey(collection, workspaceId) {
    if (workspaceId != null && workspaceId !== "") {
        return `${STORAGE_PREFIX}:ids:${collection}:w:${workspaceId}`;
    }
    return `${STORAGE_PREFIX}:ids:${collection}`;
}

/** @returns {string} */
export function metaKey() {
    return `${STORAGE_PREFIX}:meta`;
}
