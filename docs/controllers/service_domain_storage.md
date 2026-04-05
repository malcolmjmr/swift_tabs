# Service: Domain storage (Chrome local)

**Purpose:** Persist structured domain data (apps, objectives, workspaces, vocabulary, entities, categories, resources) in `chrome.storage.local` with predictable keys, explicit ID manifests, and room to swap in a remote adapter (e.g. Firestore) later.

**Related code:** [`src/services/domainStorage/`](../../src/services/domainStorage/)

---

## Why manifests exist

`chrome.storage.local` does not support listing keys by prefix. The only way to discover stored records without already knowing their ids is `get(null)`, which loads **all** extension storage keys and values. That does not scale when other data (settings, recent actions, etc.) shares the same store.

So each collection keeps an explicit **ID manifest**: a JSON array of string ids under a known key. Listing a collection is `get(manifestKey)` (and optionally `getMany` record keys), not `get(null)` plus filtering.

Manifests store **only** `string[]` ids. All other fields live on the **record** value at `st:v1:{collection}:{id}`.

---

## Key layout (schema v1)

Prefix `st:v1:` is derived from `SCHEMA_VERSION` in code (`st:v${SCHEMA_VERSION}`). Bump the version in [`constants.js`](../../src/services/domainStorage/constants.js) if the key layout changes.

| Role | Key pattern | Value |
|------|-------------|--------|
| Schema meta | `st:v1:meta` | `{ schemaVersion, … }` (initialized on first write) |
| Record | `st:v1:{collection}:{id}` | Full JSON-serializable document (`DomainRecord`) |
| Global ID manifest | `st:v1:ids:{collection}` | `string[]` — ids in that collection |
| Workspace ID manifest | `st:v1:ids:{collection}:w:{workspaceId}` | `string[]` — ids scoped to that workspace |

**Collections** (must match adapter allowlist): `apps`, `objectives`, `workspaces`, `vocabulary`, `entities`, `categories`, `resources`.

**Isolation:** Domain keys use the `st:v1:` prefix so they do not collide with existing keys such as `settings` or `swift_tabs_recent_actions`. Domain storage is **not** responsible for those blobs.

---

## Records and workspaces

A **DomainRecord** must include a string `id`. Optional `workspaceId` (non-empty string) means the id is also listed under `st:v1:ids:{collection}:w:{workspaceId}`.

- **put / putMany:** If `workspaceId` changes, the implementation removes the id from the old workspace manifest and adds it to the new one, in the same `set` as the record and global manifest when possible.
- **delete:** Removes the id from global and relevant workspace manifests, then removes the record key (see atomicity below).

**Categories** (product shape): treat “cached set of entities” as fields on the **category record** (e.g. `entityIds`), not as extra metadata inside the global `ids:categories` manifest.

**Entities:** Use one `entities` collection with a discriminant field (e.g. `kind`) on the record; optional secondary manifests per kind are a future optimization, not required by the adapter.

---

## Public API

Entry points:

- **`getDomainStorage()`** — singleton `ChromeLocalAdapter` for the extension.
- **`createStorageService(options)`** — new adapter instance (phase 1 still returns `ChromeLocalAdapter`).

Adapter methods (async):

| Method | Description |
|--------|-------------|
| `get(collection, id)` | Single record or `null`. |
| `getMany(collection, ids)` | Parallel order to `ids`; missing keys → `null` entries. Reads in chunks of 500 keys. |
| `listIds(collection, workspaceId?)` | Ids from global manifest, or workspace manifest when `workspaceId` is passed. |
| `put(collection, record)` | Writes record + updates manifest(s) in **one** `storage.local.set`. |
| `putMany(collection, records)` | Batched record + manifest updates in **one** `storage.local.set`. |
| `delete(collection, id)` | Updates manifests first, then `storage.local.remove` for the record key. |

Full JSDoc for `DomainRecord`, `StorageAdapter`, and atomicity notes: [`storageService.js`](../../src/services/domainStorage/storageService.js).

---

## Atomicity and limits

- **put / putMany:** Record key and all touched manifest keys are written together in a single `chrome.storage.local.set` object so manifests and documents do not disagree mid-write.
- **delete:** Two steps — `set` manifest updates, then `remove` the record — so `listIds` will not point at a deleted id before the record row is removed (brief orphan record if the process stops between steps is possible; manifests are the listing source of truth after step one).
- **Quota:** [`manifest.json`](../../manifest.json) includes `unlimitedStorage` so domain data is not capped at the default ~10 MB total for `storage.local`. Large single values still pay JSON parse/stringify cost; keep individual records reasonably sized.

---

## Future: Firestore adapter

A second implementation of the same `StorageAdapter` contract can back paid / signed-in users. Feature code should depend on `getDomainStorage()` / a factory that selects the adapter from settings (e.g. cloud sync + auth), not on `ChromeLocalAdapter` directly.

---

## Code references

| Area | File |
|------|------|
| Schema version, prefix, collection names | [`src/services/domainStorage/constants.js`](../../src/services/domainStorage/constants.js) |
| `recordKey`, `manifestKey`, `metaKey` | [`src/services/domainStorage/keyHelpers.js`](../../src/services/domainStorage/keyHelpers.js) |
| `ChromeLocalAdapter`, chunk size, manifest updates | [`src/services/domainStorage/chromeLocalAdapter.js`](../../src/services/domainStorage/chromeLocalAdapter.js) |
| Facade, typedefs, exports | [`src/services/domainStorage/storageService.js`](../../src/services/domainStorage/storageService.js) |
| `unlimitedStorage` permission | [`manifest.json`](../../manifest.json) (permissions array) |
