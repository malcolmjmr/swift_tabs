/** Version segment in all domain storage keys. Bump when layout changes. */
export const SCHEMA_VERSION = 1;

/** Prefix for domain keys; keep disjoint from `settings`, `swift_tabs_recent_actions`, etc. */
export const STORAGE_PREFIX = `st:v${SCHEMA_VERSION}`;

/**
 * Canonical collection names (URL-safe segments used in keys).
 * @readonly
 */
export const COLLECTIONS = Object.freeze([
    "apps",
    "objectives",
    "workspaces",
    "vocabulary",
    "entities",
    "categories",
    "resources",
]);

/** @type {ReadonlySet<string>} */
export const COLLECTION_SET = new Set(COLLECTIONS);
