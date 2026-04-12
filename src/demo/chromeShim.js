/**
 * Demo page: polyfill minimal chrome.runtime + chrome.storage so App.svelte
 * navigation-mode messaging and settings/recent-actions storage work without an extension host.
 */

const storageLocal = /** @type {Record<string, unknown>} */ ({});

/** @type {Set<(message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => void>} */
const runtimeMessageListeners = new Set();

function storageGetNormalized(keys) {
    if (keys == null) {
        return { ...storageLocal };
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const k of keyList) {
        if (Object.prototype.hasOwnProperty.call(storageLocal, k)) {
            out[k] = storageLocal[k];
        }
    }
    return out;
}

function installRuntime() {
    const runtime = {
        id: "swift-tabs-demo",
        /** @param {string} p */
        getURL(p) {
            return typeof p === "string" ? p : "";
        },
        /**
         * @param {unknown} message
         * @param {unknown} [optionsOrCallback]
         * @param {((response?: unknown) => void) | undefined} [maybeCallback]
         */
        sendMessage(message, optionsOrCallback, maybeCallback) {
            const cb =
                typeof optionsOrCallback === "function"
                    ? optionsOrCallback
                    : maybeCallback;
            queueMicrotask(() => {
                try {
                    const rt = window.chrome?.runtime;
                    if (rt && "lastError" in rt) {
                        try {
                            delete rt.lastError;
                        } catch {
                            /* ignore */
                        }
                    }
                    if (
                        message &&
                        typeof message === "object" &&
                        message.type === "NAVIGATION_MODE"
                    ) {
                        window.__swiftTabsDemoInNavMode =
                            message.isInNavigationMode === true;
                    }
                    for (const fn of runtimeMessageListeners) {
                        fn(message, {}, () => {});
                    }
                    if (typeof cb === "function") {
                        cb(undefined);
                    }
                } catch (e) {
                    console.error("[demo shim] sendMessage listener error", e);
                    if (typeof cb === "function") {
                        cb(undefined);
                    }
                }
            });
        },
        onMessage: {
            /** @param {(message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => void} fn */
            addListener(fn) {
                runtimeMessageListeners.add(fn);
            },
            /** @param {(message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => void} fn */
            removeListener(fn) {
                runtimeMessageListeners.delete(fn);
            },
        },
    };
    Object.defineProperty(runtime, "lastError", {
        configurable: true,
        enumerable: true,
        get() {
            return undefined;
        },
        set() {},
    });
    return runtime;
}

function installStorageLocal() {
    return {
        /**
         * @param {string | string[] | Record<string, unknown> | null} keys
         * @param {(data: Record<string, unknown>) => void} [callback]
         */
        get(keys, callback) {
            const data = storageGetNormalized(keys);
            if (typeof callback === "function") {
                queueMicrotask(() => callback(data));
                return undefined;
            }
            return Promise.resolve(data);
        },
        /**
         * @param {Record<string, unknown>} items
         * @param {() => void} [callback]
         */
        set(items, callback) {
            if (items && typeof items === "object") {
                Object.assign(storageLocal, items);
            }
            if (typeof callback === "function") {
                queueMicrotask(() => callback());
                return;
            }
            return Promise.resolve();
        },
    };
}

export function installDemoChromeShim() {
    if (typeof window === "undefined") return;

    const prev = window.chrome;
    window.chrome = {
        ...(prev && typeof prev === "object" ? prev : {}),
        runtime: installRuntime(),
        storage: {
            ...(prev?.storage && typeof prev.storage === "object"
                ? prev.storage
                : {}),
            local: installStorageLocal(),
        },
    };
}
