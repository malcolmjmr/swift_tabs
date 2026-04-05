/**
 * @typedef {Object} DomainRecord
 * Domain document stored at `st:v1:{collection}:{id}`.
 * @property {string} id
 * @property {string} [workspaceId] When set, record is also listed under `ids:{collection}:w:{workspaceId}`.
 * Additional fields are collection-specific.
 */

/**
 * Pluggable backend for domain entities (Chrome local now; Firestore later).
 *
 * **Manifests** hold only `string[]` ids. **Atomicity:** `put` / `putMany` write each
 * record and its manifest(s) in a **single** `chrome.storage.local.set` so ids and
 * documents do not diverge. `delete` updates manifests with `set`, then `remove`s the
 * record key (two steps; manifests are updated first so listIds does not reference
 * deleted ids before the record is removed).
 *
 * @typedef {Object} StorageAdapter
 * @property {(collection: string, id: string) => Promise<DomainRecord | null>} get
 * @property {(collection: string, ids: string[]) => Promise<(DomainRecord | null)[]>} getMany
 * @property {(collection: string, workspaceId?: string | null) => Promise<string[]>} listIds
 * @property {(collection: string, record: DomainRecord) => Promise<void>} put
 * @property {(collection: string, records: DomainRecord[]) => Promise<void>} putMany
 * @property {(collection: string, id: string) => Promise<void>} delete
 */

import { ChromeLocalAdapter } from "./chromeLocalAdapter.js";

export { COLLECTIONS, COLLECTION_SET, SCHEMA_VERSION, STORAGE_PREFIX } from "./constants.js";
export { manifestKey, metaKey, recordKey } from "./keyHelpers.js";
export { ChromeLocalAdapter } from "./chromeLocalAdapter.js";

/** @type {ChromeLocalAdapter | null} */
let singleton = null;

/**
 * Shared adapter instance for the extension (phase 1: always Chrome local).
 * @returns {ChromeLocalAdapter}
 */
export function getDomainStorage() {
    if (!singleton) singleton = new ChromeLocalAdapter();
    return singleton;
}

/**
 * @param {object} [options]
 * @returns {ChromeLocalAdapter}
 */
export function createStorageService(options = {}) {
    return new ChromeLocalAdapter(options);
}
