/** @typedef {{ id: string, label: string, icon: string }} OmniboxSectionMeta */

/** @type {OmniboxSectionMeta[]} */
export const SECTIONS = [
    { id: "apps", label: "Apps", icon: "apps" },
    { id: "schedule", label: "Schedule", icon: "event" },
    //{ id: "tabs", label: "Tabs", icon: "tab" },
    //{ id: "tasks", label: "Tasks", icon: "task_alt" },
    { id: "history", label: "History", icon: "history" },
    { id: "news", label: "News", icon: "newspaper" },
    { id: "trending", label: "Trending", icon: "trending_up" },
    { id: "reading", label: "Reading", icon: "menu_book" },
    { id: "highlights", label: "Highlights", icon: "highlight" },
    //{ id: "shopping", label: "Shopping", icon: "shopping_bag" },
    //{ id: "learning", label: "Learning", icon: "school" },
    //{ id: "data", label: "Data", icon: "database" },

    { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
    { id: "files", label: "Files", icon: "folder" },
];

export const PLACEHOLDER_SECTION_IDS = new Set([
    "tasks",
    "shopping",
    "learning",
    "data",
]);

/** First section in SECTIONS (tabs chip is not in the carousel). */
export const DEFAULT_SECTION_ID = "apps";

export const DEFAULT_SECTION_INDEX = Math.max(
    0,
    SECTIONS.findIndex((s) => s.id === DEFAULT_SECTION_ID),
);
