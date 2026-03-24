/**
 * recentActionsStore.js
 * Persists recently used tab actions for quick repeat access.
 * Per docs/controllers/controllers_overview.md and docs/features/feature_tab_context_menu.md
 */

import { writable, get } from "svelte/store";

export const recentActions = writable([]);
const MAX_RECENT_ACTIONS = 8;
const STORAGE_KEY = "swift_tabs_recent_actions";

export const recentActionsStore = {
    async init() {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        recentActions.set(data[STORAGE_KEY] || []);
    },

    async addAction(action) {
        const entry = {
            id:
                action.id ||
                `${action.action || action.category}-${(action.targetId ?? action.targetName ?? "").toString().replace(/\s/g, "-")}`.toLowerCase(),
            category: action.category || "basic",
            action: action.action || action.category,
            targetType: action.targetType,
            targetName: action.targetName,
            targetId: action.targetId,
            timestamp: action.timestamp ?? Date.now(),
            useCount: (action.useCount ?? 0) + 1,
        };

        const current = get(recentActions);
        const filtered = current.filter(
            (a) =>
                !(
                    a.action === entry.action &&
                    (a.targetId === entry.targetId || a.targetName === entry.targetName) &&
                    a.targetType === entry.targetType
                ),
        );
        const updated = [entry, ...filtered].slice(0, MAX_RECENT_ACTIONS);
        recentActions.set(updated);
        await this.save();
        return entry;
    },

    getTopActions(count = 5) {
        return get(recentActions).slice(0, count);
    },

    async clear() {
        recentActions.set([]);
        await this.save();
    },

    async save() {
        const data = get(recentActions);
        await chrome.storage.local.set({ [STORAGE_KEY]: data });
    },
};
