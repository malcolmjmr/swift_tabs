/**
 * LLM-backed suggestions for omnibox app/folder creation (Gemini when configured).
 */
import {
    generateContentPlain,
    getGeminiApiKey,
    parseJsonLoose,
} from "../../../services/geminiClient.js";
import { normalizeDomain } from "../../../services/apps/appsModel.js";

/** Target count for LLM and parsed suggestion lists. */
const SUGGESTION_COUNT = 10;

const FALLBACK_FOLDERS = [
    "Work",
    "Personal",
    "Reading",
    "Tools",
    "Finance",
    "Health",
];

const FALLBACK_APPS = [
    {
        label: "GitHub",
        domain: "github.com",
        description: "Host code, review changes, and collaborate on software projects.",
    },
    {
        label: "Wikipedia",
        domain: "wikipedia.org",
        description: "Community-built reference articles on almost any topic.",
    },
    {
        label: "Hacker News",
        domain: "news.ycombinator.com",
        description: "Tech and startup discussion with a focus on substance over hype.",
    },
    {
        label: "Google Calendar",
        domain: "calendar.google.com",
        description: "Schedule events, reminders, and shared calendars in one place.",
    },
    {
        label: "Notion",
        domain: "notion.so",
        description: "Notes, wikis, and lightweight databases in a single workspace.",
    },
    {
        label: "Reddit",
        domain: "reddit.com",
        description: "Topic-based communities for news, Q&A, and niche interests.",
    },
];

/**
 * @param {import('../../../services/apps/appsModel.js').AppHomeLayout | object} layout
 * @returns {string[]}
 */
export function collectFolderTitlesFromLayout(layout) {
    /** @type {string[]} */
    const out = [];
    /** @param {object[]} items */
    function walk(items) {
        for (const it of items || []) {
            if (it.kind === "folder") {
                const t = (it.title || "").trim();
                if (t) out.push(t);
                walk(it.items || []);
            }
        }
    }
    walk(layout?.items || []);
    return out;
}

/**
 * @param {string[]} existing
 * @returns {string[]}
 */
function heuristicFolderNames(existing) {
    const lower = new Set(existing.map((s) => s.toLowerCase()));
    return FALLBACK_FOLDERS.filter((s) => !lower.has(s.toLowerCase()))
        .slice(0, SUGGESTION_COUNT)
        .map((name) => ({
            name,
            description: "",
        }));
}

/**
 * @param {object[]} apps
 * @returns {{ label: string, domain: string, description?: string }[]}
 */
function heuristicAppEntries(apps) {
    const have = new Set(
        apps
            .map((a) => normalizeDomain(a.domain || ""))
            .filter(Boolean),
    );
    return FALLBACK_APPS.filter((s) => !have.has(s.domain)).slice(
        0,
        SUGGESTION_COUNT,
    );
}

/** @param {unknown} v */
function clampSuggestionDescription(v) {
    const t = typeof v === "string" ? v.trim() : "";
    if (!t) return "";
    return t.length > 280 ? `${t.slice(0, 277)}…` : t;
}

/**
 * @param {string} text
 * @returns {number}
 */
export function countInputWords(text) {
    const t = (text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
}

/**
 * Parse folder suggestion rows from model JSON (shared shape with suggestFolderNames).
 *
 * @param {unknown} rows
 * @param {Set<string>} seenLower
 * @returns {{ name: string, description?: string }[]}
 */
function parseFolderSuggestionRows(rows, seenLower) {
    if (!Array.isArray(rows)) return [];
    /** @type {{ name: string, description?: string }[]} */
    const out = [];
    for (const item of rows) {
        let name = "";
        let description = "";
        if (typeof item === "string") {
            name = item.trim();
        } else if (item && typeof item === "object") {
            const o = /** @type {Record<string, unknown>} */ (item);
            name = String(o.name ?? o.title ?? "").trim();
            description = clampSuggestionDescription(o.description);
        }
        if (!name || name.length > 48) continue;
        const k = name.toLowerCase();
        if (seenLower.has(k)) continue;
        seenLower.add(k);
        out.push(description ? { name, description } : { name });
        if (out.length >= SUGGESTION_COUNT) break;
    }
    return out;
}

/**
 * @param {string[]} existingFolderTitles
 * @returns {Promise<{ name: string, description?: string }[]>}
 */
export async function suggestFolderNames(existingFolderTitles) {
    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction:
                'Reply with JSON only: {"suggestions":[{"name":"Short Name","description":"One sentence."}]}. ' +
                `Return exactly ${SUGGESTION_COUNT} suggestions when you can (fewer only if you cannot find enough distinct ideas). ` +
                "Each name: 1–3 words. Each description: one concise sentence that states the folder's purpose and organizational value " +
                "(what belongs there and why it helps the user), not just repeating the name. " +
                "Do not duplicate or closely paraphrase existing folder names from the user context.",
            userText:
                "Existing folder names:\n" +
                JSON.stringify(existingFolderTitles.slice(0, 40)) +
                "\n\nSuggest new folder names that complement this organization. " +
                "Every suggestion must include both name and description as specified.",
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            const seen = new Set(
                existingFolderTitles.map((s) => s.toLowerCase()),
            );
            const out = parseFolderSuggestionRows(j.suggestions, seen);
            if (out.length) return out;
        }
    } catch {
        /* use heuristic */
    }
    return heuristicFolderNames(existingFolderTitles);
}

/**
 * Folder name suggestions derived from a free-text organizing goal (3+ words in UI).
 *
 * @param {string} goalText
 * @param {string[]} existingFolderTitles
 * @returns {Promise<{ name: string, description?: string }[]>}
 */
export async function suggestFolderNamesFromGoal(goalText, existingFolderTitles) {
    const goal = (goalText || "").trim();
    if (!goal) return [];

    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction:
                'Reply with JSON only: {"suggestions":[{"name":"Short Name","description":"One sentence."}]}. ' +
                `Return exactly ${SUGGESTION_COUNT} suggestions when you can (fewer only if you cannot find enough distinct ideas). ` +
                "The user stated a goal in natural language (not a folder title). " +
                "Propose concrete folder names (1–3 words each) that would help them pursue that goal. " +
                "Each description: one sentence linking the folder to their goal and its organizational value. " +
                "Do not duplicate or closely paraphrase existing folder names from the context.",
            userText:
                "User goal:\n" +
                JSON.stringify(goal) +
                "\n\nExisting folder names:\n" +
                JSON.stringify(existingFolderTitles.slice(0, 40)) +
                "\n\nSuggest folders tailored to this goal. Every row must include name and description.",
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            const seen = new Set(
                existingFolderTitles.map((s) => s.toLowerCase()),
            );
            const out = parseFolderSuggestionRows(j.suggestions, seen);
            if (out.length) return out;
        }
    } catch {
        /* fall through */
    }
    return heuristicFolderNames(existingFolderTitles);
}

/**
 * @typedef {{ title: string, appsInFolder: { domain: string, title: string }[] }} FolderAppContext
 */

/**
 * Build a stable JSON summary for every app in the registry (library-wide).
 *
 * @param {object[]} apps
 */
function fullLibrarySummary(apps) {
    return apps.map((a) => ({
        domain: a.domain || "",
        title: a.displayTitle || a.title || "",
    }));
}

/**
 * @param {unknown[]} rows
 * @param {Set<string>} haveDomains normalized domains already owned
 * @returns {{ label: string, domain: string, description?: string }[]}
 */
function parseAppSuggestionRows(rows, haveDomains) {
    if (!Array.isArray(rows)) return [];
    /** @type {{ label: string, domain: string, description?: string }[]} */
    const out = [];
    for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const o = /** @type {Record<string, unknown>} */ (row);
        const domain = normalizeDomain(String(o.domain || ""));
        const label = String(o.label || domain || "").trim();
        const description = clampSuggestionDescription(o.description);
        if (!domain || !label) continue;
        if (haveDomains.has(domain)) continue;
        haveDomains.add(domain);
        out.push(
            description ? { label, domain, description } : { label, domain },
        );
        if (out.length >= SUGGESTION_COUNT) break;
    }
    return out;
}

/**
 * @param {{
 *   allRegistryApps: object[],
 *   folderContext: FolderAppContext | null,
 * }} opts
 * @returns {Promise<{ label: string, domain: string, description?: string }[]>}
 */
export async function suggestAppEntries(opts) {
    const all = Array.isArray(opts?.allRegistryApps)
        ? opts.allRegistryApps
        : [];
    const folderContext = opts?.folderContext ?? null;

    const have = new Set(
        all.map((a) => normalizeDomain(a.domain || "")).filter(Boolean),
    );

    /** @type {string} */
    let userText;
    if (folderContext) {
        userText =
            `The user is adding an app inside the folder named ${JSON.stringify(folderContext.title)}.\n` +
            "Apps already in this folder (domain and title for each):\n" +
            JSON.stringify(folderContext.appsInFolder) +
            "\n\nSuggest web apps (sites) that fit this folder's theme. " +
            "Do not suggest domains the user already has anywhere in their library. " +
            "Bias toward distinctive, high-quality options—including hidden gems and niche tools—not only the most famous sites.";
    } else {
        userText =
            "The user's complete app library (every saved app — domain and title):\n" +
            JSON.stringify(fullLibrarySummary(all)) +
            "\n\nSuggest apps they might want to add next. " +
            "Do not suggest domains they already have. " +
            "Bias toward lesser-known, excellent sites and tools that fit their library, not a list dominated by obvious megabrands.";
    }

    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction:
                'Reply with JSON only: {"suggestions":[{"label":"Display name","domain":"example.com","description":"One sentence value proposition."}]}. ' +
                `Return exactly ${SUGGESTION_COUNT} suggestions when you can (fewer only if you cannot find enough suitable, non-duplicate domains). ` +
                "Each description: one concise sentence describing what the site or app offers and why it is useful (value proposition). " +
                "Domains must be real registrable hostnames only (no URL paths or query strings). " +
                "Actively include hidden gems: unique, high-quality web apps and sites that are genuinely worthwhile even if they are not the most popular or mainstream. " +
                "Mix in thoughtful niche tools, specialized communities, and strong smaller products; avoid suggesting only the same few household-name giants. " +
                "Do not include domains the user already has in their library.",
            userText,
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            const out = parseAppSuggestionRows(j.suggestions, have);
            if (out.length) return out;
        }
    } catch {
        /* heuristic */
    }
    return heuristicAppEntries(all);
}

const APP_GOAL_SYSTEM_INSTRUCTION =
    'Reply with JSON only: {"suggestions":[{"label":"Display name","domain":"example.com","description":"One sentence value proposition."}]}. ' +
    `Return exactly ${SUGGESTION_COUNT} suggestions when you can (fewer only if you cannot find enough suitable, non-duplicate domains). ` +
    "The user described what they want in natural language (a goal or job-to-be-done), not a site name. " +
    "Suggest real web apps and sites that best serve that stated intent. " +
    "Each description: one concise sentence on value proposition relative to the user's goal. " +
    "Domains must be real registrable hostnames only (no URL paths). " +
    "Prioritize distinctive, high-quality options—including hidden gems and niche tools—not only the most popular brands. " +
    "Do not include domains the user already has in their library.";

/**
 * App suggestions from a free-text goal (3+ words in UI). Same options shape as suggestAppEntries.
 *
 * @param {{
 *   goal: string,
 *   allRegistryApps: object[],
 *   folderContext: FolderAppContext | null,
 * }} opts
 * @returns {Promise<{ label: string, domain: string, description?: string }[]>}
 */
export async function suggestAppEntriesFromGoal(opts) {
    const goal = (opts?.goal || "").trim();
    if (!goal) return [];

    const all = Array.isArray(opts?.allRegistryApps)
        ? opts.allRegistryApps
        : [];
    const folderContext = opts?.folderContext ?? null;

    const have = new Set(
        all.map((a) => normalizeDomain(a.domain || "")).filter(Boolean),
    );

    /** @type {string} */
    let userText;
    if (folderContext) {
        userText =
            "User goal (what they want to accomplish):\n" +
            JSON.stringify(goal) +
            "\n\nThey are adding an app inside the folder named " +
            JSON.stringify(folderContext.title) +
            ".\nApps already in this folder:\n" +
            JSON.stringify(folderContext.appsInFolder) +
            "\n\nSuggest sites that serve the goal and fit this folder. " +
            "Do not suggest domains they already have anywhere in their library.";
    } else {
        userText =
            "User goal (what they want to accomplish):\n" +
            JSON.stringify(goal) +
            "\n\nTheir complete app library (domain and title):\n" +
            JSON.stringify(fullLibrarySummary(all)) +
            "\n\nSuggest sites that serve this goal and complement their library. " +
            "Do not suggest domains they already have.";
    }

    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction: APP_GOAL_SYSTEM_INSTRUCTION,
            userText,
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            const out = parseAppSuggestionRows(j.suggestions, have);
            if (out.length) return out;
        }
    } catch {
        /* heuristic */
    }
    return heuristicAppEntries(all);
}
