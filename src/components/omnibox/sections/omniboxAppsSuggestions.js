/**
 * LLM-backed suggestions for omnibox app/folder creation (Gemini when configured).
 */
import {
    generateContentPlain,
    getGeminiApiKey,
    parseJsonLoose,
} from "../../../services/geminiClient.js";
import { normalizeDomain } from "../../../services/apps/appsModel.js";

const FALLBACK_FOLDERS = [
    "Work",
    "Personal",
    "Reading",
    "Tools",
    "Finance",
    "Health",
];

const FALLBACK_APPS = [
    { label: "GitHub", domain: "github.com" },
    { label: "Wikipedia", domain: "wikipedia.org" },
    { label: "Hacker News", domain: "news.ycombinator.com" },
    { label: "Google Calendar", domain: "calendar.google.com" },
    { label: "Notion", domain: "notion.so" },
    { label: "Reddit", domain: "reddit.com" },
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
    return FALLBACK_FOLDERS.filter((s) => !lower.has(s.toLowerCase())).slice(
        0,
        6,
    );
}

/**
 * @param {object[]} apps
 * @returns {{ label: string, domain: string }[]}
 */
function heuristicAppEntries(apps) {
    const have = new Set(
        apps
            .map((a) => normalizeDomain(a.domain || ""))
            .filter(Boolean),
    );
    return FALLBACK_APPS.filter((s) => !have.has(s.domain)).slice(0, 6);
}

/**
 * @param {string[]} existingFolderTitles
 * @returns {Promise<string[]>}
 */
export async function suggestFolderNames(existingFolderTitles) {
    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction:
                'Reply with JSON only: {"suggestions":["name1","name2"]}. ' +
                "Up to 6 short folder names (1–3 words each). No duplicates of existing names.",
            userText:
                "Existing folder names:\n" +
                JSON.stringify(existingFolderTitles.slice(0, 40)) +
                "\nSuggest new folder names that complement this organization.",
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            const seen = new Set(
                existingFolderTitles.map((s) => s.toLowerCase()),
            );
            const out = [];
            for (const s of j.suggestions) {
                if (typeof s !== "string") continue;
                const t = s.trim();
                if (!t || t.length > 48) continue;
                const k = t.toLowerCase();
                if (seen.has(k)) continue;
                seen.add(k);
                out.push(t);
                if (out.length >= 8) break;
            }
            if (out.length) return out;
        }
    } catch {
        /* use heuristic */
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
 * @param {{
 *   allRegistryApps: object[],
 *   folderContext: FolderAppContext | null,
 * }} opts
 * @returns {Promise<{ label: string, domain: string }[]>}
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
            "\n\nSuggest web apps (sites) that fit this folder. " +
            "Do not suggest domains the user already has anywhere in their library.";
    } else {
        userText =
            "The user's complete app library (every saved app — domain and title):\n" +
            JSON.stringify(fullLibrarySummary(all)) +
            "\n\nSuggest apps they might want to add next. " +
            "Do not suggest domains they already have.";
    }

    try {
        const key = await getGeminiApiKey();
        const { text } = await generateContentPlain(key, {
            systemInstruction:
                'Reply with JSON only: {"suggestions":[{"label":"Site","domain":"example.com"}]}. ' +
                "Up to 6 entries. Use real, well-known sites. Domains must be registrable hostnames (no paths). " +
                "Do not include domains the user already has.",
            userText,
        });
        const j = /** @type {{ suggestions?: unknown }} */ (parseJsonLoose(text));
        if (Array.isArray(j?.suggestions)) {
            /** @type {{ label: string, domain: string }[]} */
            const out = [];
            for (const row of j.suggestions) {
                if (!row || typeof row !== "object") continue;
                const o = /** @type {Record<string, unknown>} */ (row);
                const domain = normalizeDomain(String(o.domain || ""));
                const label = String(o.label || domain || "").trim();
                if (!domain || !label) continue;
                if (have.has(domain)) continue;
                have.add(domain);
                out.push({ label, domain });
                if (out.length >= 8) break;
            }
            if (out.length) return out;
        }
    } catch {
        /* heuristic */
    }
    return heuristicAppEntries(all);
}
