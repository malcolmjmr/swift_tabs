import { COLLECTION_SET, SCHEMA_VERSION } from "./constants.js";
import { manifestKey, metaKey, recordKey } from "./keyHelpers.js";

/** @typedef {{ id: string, workspaceId?: string, [key: string]: unknown }} DomainRecord */

/** Max keys per `storage.local.get` to avoid oversized requests. */
const GET_CHUNK_SIZE = 500;

/**
 * Chrome `storage.local` implementation of the domain storage contract.
 *
 * Manifests (`st:v1:ids:…`) hold **only** string ids. Full documents live at
 * `st:v1:{collection}:{id}`. Updates that touch a record and its manifest(s)
 * use a **single** `storage.local.set` payload so those keys stay consistent.
 *
 * See `storageService.js` for the `StorageAdapter` contract JSDoc.
 */
export class ChromeLocalAdapter {
    /**
     * @param {object} [_options]
     */
    constructor(_options = {}) {}

    /**
     * @param {string|string[]|null} keys
     * @returns {Promise<Record<string, unknown>>}
     */
    _get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                const err = chrome.runtime.lastError;
                if (err) reject(new Error(err.message));
                else resolve(result);
            });
        });
    }

    /**
     * @param {Record<string, unknown>} items
     * @returns {Promise<void>}
     */
    _set(items) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
                const err = chrome.runtime.lastError;
                if (err) reject(new Error(err.message));
                else resolve();
            });
        });
    }

    /**
     * @param {string|string[]} keys
     * @returns {Promise<void>}
     */
    _remove(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                const err = chrome.runtime.lastError;
                if (err) reject(new Error(err.message));
                else resolve();
            });
        });
    }

    /** @param {string} collection */
    _assertCollection(collection) {
        if (!COLLECTION_SET.has(collection)) {
            throw new Error(`Unknown collection: ${collection}`);
        }
    }

    /** @param {unknown} record */
    _assertRecord(record) {
        if (!record || typeof record !== "object") {
            throw new Error("Record must be a non-null object");
        }
        const id = /** @type {{ id?: unknown }} */ (record).id;
        if (typeof id !== "string" || id === "") {
            throw new Error("Record must have a non-empty string id");
        }
    }

    async _ensureMeta() {
        const k = metaKey();
        const data = await this._get(k);
        const cur = data[k];
        if (!cur || typeof cur !== "object") {
            await this._set({ [k]: { schemaVersion: SCHEMA_VERSION } });
        }
    }

    /**
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<DomainRecord | null>}
     */
    async get(collection, id) {
        this._assertCollection(collection);
        const rk = recordKey(collection, id);
        const data = await this._get(rk);
        const v = data[rk];
        return v != null && typeof v === "object" ? /** @type {DomainRecord} */ (v) : null;
    }

    /**
     * @param {string} collection
     * @param {string[]} ids
     * @returns {Promise<(DomainRecord | null)[]>}
     */
    async getMany(collection, ids) {
        this._assertCollection(collection);
        if (ids.length === 0) return [];
        const out = /** @type {(DomainRecord | null)[]} */ (new Array(ids.length).fill(null));
        for (let i = 0; i < ids.length; i += GET_CHUNK_SIZE) {
            const slice = ids.slice(i, i + GET_CHUNK_SIZE);
            const keys = slice.map((id) => recordKey(collection, id));
            const batch = await this._get(keys);
            for (let j = 0; j < slice.length; j++) {
                const v = batch[keys[j]];
                out[i + j] =
                    v != null && typeof v === "object" ? /** @type {DomainRecord} */ (v) : null;
            }
        }
        return out;
    }

    /**
     * @param {string} collection
     * @param {string | null | undefined} [workspaceId]
     * @returns {Promise<string[]>}
     */
    async listIds(collection, workspaceId) {
        this._assertCollection(collection);
        const mk = manifestKey(collection, workspaceId);
        const data = await this._get(mk);
        const list = data[mk];
        return Array.isArray(list) ? /** @type {string[]} */ ([...list]) : [];
    }

    /**
     * @param {string} collection
     * @param {DomainRecord} record
     * @returns {Promise<void>}
     */
    async put(collection, record) {
        await this._ensureMeta();
        this._assertCollection(collection);
        this._assertRecord(record);
        const id = record.id;
        const rk = recordKey(collection, id);
        const prev = await this._get(rk);
        const old = prev[rk] != null && typeof prev[rk] === "object"
            ? /** @type {DomainRecord} */ (prev[rk])
            : null;

        const globalMk = manifestKey(collection, null);
        const oldWs =
            old && typeof old.workspaceId === "string" && old.workspaceId !== ""
                ? old.workspaceId
                : null;
        const newWs =
            typeof record.workspaceId === "string" && record.workspaceId !== ""
                ? record.workspaceId
                : null;

        const keysToRead = [globalMk];
        if (newWs) keysToRead.push(manifestKey(collection, newWs));
        if (oldWs && oldWs !== newWs) keysToRead.push(manifestKey(collection, oldWs));

        const got = await this._get(keysToRead);
        const globalList = addId(
            Array.isArray(got[globalMk]) ? [.../** @type {string[]} */ (got[globalMk])] : [],
            id,
        );

        /** @type {Record<string, unknown>} */
        const payload = { [rk]: record, [globalMk]: globalList };

        if (oldWs && oldWs !== newWs) {
            const omk = manifestKey(collection, oldWs);
            payload[omk] = removeId(
                Array.isArray(got[omk]) ? [.../** @type {string[]} */ (got[omk])] : [],
                id,
            );
        }
        if (newWs) {
            const nmk = manifestKey(collection, newWs);
            const base = Array.isArray(got[nmk]) ? [.../** @type {string[]} */ (got[nmk])] : [];
            payload[nmk] = addId(base, id);
        }

        await this._set(payload);
    }

    /**
     * @param {string} collection
     * @param {DomainRecord[]} records
     * @returns {Promise<void>}
     */
    async putMany(collection, records) {
        if (records.length === 0) return;
        await this._ensureMeta();
        this._assertCollection(collection);
        for (const r of records) this._assertRecord(r);

        const globalMk = manifestKey(collection, null);
        /** @type {Set<string>} */
        const manifestKeys = new Set([globalMk]);
        const rKeys = records.map((r) => recordKey(collection, r.id));

        /** @type {Record<string, DomainRecord | null>} */
        const oldByKey = {};
        for (let i = 0; i < rKeys.length; i += GET_CHUNK_SIZE) {
            const chunkKeys = rKeys.slice(i, i + GET_CHUNK_SIZE);
            const got = await this._get(chunkKeys);
            for (let j = 0; j < chunkKeys.length; j++) {
                const key = chunkKeys[j];
                const rec = records[i + j];
                const v = got[key];
                const old =
                    v != null && typeof v === "object" ? /** @type {DomainRecord} */ (v) : null;
                oldByKey[key] = old;

                const oldWs =
                    old && typeof old.workspaceId === "string" && old.workspaceId !== ""
                        ? old.workspaceId
                        : null;
                const newWs =
                    typeof rec.workspaceId === "string" && rec.workspaceId !== ""
                        ? rec.workspaceId
                        : null;
                if (newWs) manifestKeys.add(manifestKey(collection, newWs));
                if (oldWs && oldWs !== newWs) manifestKeys.add(manifestKey(collection, oldWs));
            }
        }

        const mkList = [...manifestKeys];
        /** @type {Record<string, unknown>} */
        const manifestsRaw = {};
        for (let i = 0; i < mkList.length; i += GET_CHUNK_SIZE) {
            const chunk = mkList.slice(i, i + GET_CHUNK_SIZE);
            Object.assign(manifestsRaw, await this._get(chunk));
        }

        /** @type {Record<string, string[]>} */
        const lists = {};
        for (const mk of mkList) {
            lists[mk] = Array.isArray(manifestsRaw[mk])
                ? [.../** @type {string[]} */ (manifestsRaw[mk])]
                : [];
        }

        /** @type {Record<string, unknown>} */
        const payload = {};

        for (const rec of records) {
            const id = rec.id;
            const rk = recordKey(collection, id);
            payload[rk] = rec;

            const old = oldByKey[rk] ?? null;
            const oldWs =
                old && typeof old.workspaceId === "string" && old.workspaceId !== ""
                    ? old.workspaceId
                    : null;
            const newWs =
                typeof rec.workspaceId === "string" && rec.workspaceId !== ""
                    ? rec.workspaceId
                    : null;

            lists[globalMk] = addId(lists[globalMk] ?? [], id);

            if (oldWs && oldWs !== newWs) {
                const omk = manifestKey(collection, oldWs);
                lists[omk] = removeId(lists[omk] ?? [], id);
            }
            if (newWs) {
                const nmk = manifestKey(collection, newWs);
                lists[nmk] = addId(lists[nmk] ?? [], id);
            }
        }

        for (const mk of mkList) {
            payload[mk] = lists[mk] ?? [];
        }

        await this._set(payload);
    }

    /**
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(collection, id) {
        this._assertCollection(collection);
        const rk = recordKey(collection, id);
        const prev = await this._get(rk);
        const old = prev[rk] != null && typeof prev[rk] === "object"
            ? /** @type {DomainRecord} */ (prev[rk])
            : null;

        const globalMk = manifestKey(collection, null);
        const keysToRead = [globalMk];
        const oldWs =
            old && typeof old.workspaceId === "string" && old.workspaceId !== ""
                ? old.workspaceId
                : null;
        if (oldWs) keysToRead.push(manifestKey(collection, oldWs));

        const got = await this._get(keysToRead);
        /** @type {Record<string, unknown>} */
        const payload = {
            [globalMk]: removeId(
                Array.isArray(got[globalMk]) ? [.../** @type {string[]} */ (got[globalMk])] : [],
                id,
            ),
        };
        if (oldWs) {
            const omk = manifestKey(collection, oldWs);
            payload[omk] = removeId(
                Array.isArray(got[omk]) ? [.../** @type {string[]} */ (got[omk])] : [],
                id,
            );
        }

        await this._set(payload);
        await this._remove(rk);
    }
}

/**
 * @param {string[]} list
 * @param {string} id
 * @returns {string[]}
 */
function addId(list, id) {
    if (list.includes(id)) return list;
    const next = [...list, id];
    return next;
}

/**
 * @param {string[]} list
 * @param {string} id
 * @returns {string[]}
 */
function removeId(list, id) {
    return list.filter((x) => x !== id);
}
