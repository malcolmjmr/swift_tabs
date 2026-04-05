/**
 * Gemini REST API with Google Search grounding.
 * @see https://ai.google.dev/gemini-api/docs/google-search
 */

const GEMINI_MODEL = "gemini-flash-lite-latest";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** @type {{ items: Array<{ headline: string, searchQuery: string }>, fetchedAt: number } | null} */
let newsListCache = null;

/** @type {{ items: Array<{ headline: string, searchQuery: string }>, fetchedAt: number } | null} */
let trendingListCache = null;

const NEWS_LIST_TTL_MS = 8 * 60 * 1000;
const TRENDING_LIST_TTL_MS = 8 * 60 * 1000;

export function getCachedNewsList() {
    if (!newsListCache) return null;
    if (Date.now() - newsListCache.fetchedAt > NEWS_LIST_TTL_MS) {
        newsListCache = null;
        return null;
    }
    return newsListCache.items;
}

export function invalidateNewsListCache() {
    newsListCache = null;
}

export function getCachedTrendingList() {
    if (!trendingListCache) return null;
    if (Date.now() - trendingListCache.fetchedAt > TRENDING_LIST_TTL_MS) {
        trendingListCache = null;
        return null;
    }
    return trendingListCache.items;
}

export function invalidateTrendingListCache() {
    trendingListCache = null;
}

/**
 * @returns {Promise<string>}
 */
export function getGeminiApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["settings"], (data) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            const key = data.settings?.apiKeys?.geminiApiKey?.trim();
            if (!key) {
                reject(new Error("missing_api_key"));
                return;
            }
            resolve(key);
        });
    });
}

function stripJsonFences(text) {
    let t = text.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
    if (fence) t = fence[1].trim();
    return t;
}

/**
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsonLoose(text) {
    const t = stripJsonFences(text);
    return JSON.parse(t);
}

/**
 * @param {string} apiKey
 * @param {{ systemInstruction?: string, userText: string }} opts
 * @returns {Promise<{ text: string, raw: object }>}
 */
export async function generateWithGoogleSearch(apiKey, opts) {
    const url = `${BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: opts.userText }],
            },
        ],
        tools: [{ google_search: {} }],
    };

    if (opts.systemInstruction) {
        body.systemInstruction = {
            parts: [{ text: opts.systemInstruction }],
        };
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const raw = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg =
            raw?.error?.message ||
            `Gemini API error (${res.status})`;
        throw new Error(msg);
    }

    const parts = raw?.candidates?.[0]?.content?.parts;
    const text =
        Array.isArray(parts) && parts.length
            ? parts.map((p) => p.text || "").join("")
            : "";

    if (!text && raw?.candidates?.[0]?.finishReason === "SAFETY") {
        throw new Error("Response blocked by safety settings.");
    }

    return { text, raw };
}

/**
 * Plain generateContent (no tools). For planner JSON and other non-search flows.
 *
 * @param {string} apiKey
 * @param {{ systemInstruction?: string, userText: string }} opts
 * @returns {Promise<{ text: string, raw: object }>}
 */
export async function generateContentPlain(apiKey, opts) {
    const url = `${BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: opts.userText }],
            },
        ],
    };

    if (opts.systemInstruction) {
        body.systemInstruction = {
            parts: [{ text: opts.systemInstruction }],
        };
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const raw = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg =
            raw?.error?.message ||
            `Gemini API error (${res.status})`;
        throw new Error(msg);
    }

    const parts = raw?.candidates?.[0]?.content?.parts;
    const text =
        Array.isArray(parts) && parts.length
            ? parts.map((p) => p.text || "").join("")
            : "";

    if (!text && raw?.candidates?.[0]?.finishReason === "SAFETY") {
        throw new Error("Response blocked by safety settings.");
    }

    return { text, raw };
}

/**
 * @param {object} raw
 * @returns {string}
 */
function formatGroundingFooter(raw) {
    const meta = raw?.candidates?.[0]?.groundingMetadata;
    const chunks = meta?.groundingChunks;
    if (!Array.isArray(chunks) || !chunks.length) return "";

    const lines = ["\n\nSources:"];
    for (const ch of chunks) {
        const web = ch?.web;
        if (!web?.uri) continue;
        const title = web.title || web.uri;
        lines.push(`- ${title}: ${web.uri}`);
    }
    return lines.length > 1 ? lines.join("\n") : "";
}

/**
 * @returns {Promise<Array<{ headline: string, searchQuery: string }>>}
 */
export async function fetchTopNewsEvents() {
    const cached = getCachedNewsList();
    if (cached) return cached;

    const apiKey = await getGeminiApiKey();

    const systemInstruction =
        "You are a news editor. Use Google Search to find current major world and national news. " +
        "Rank by real-world importance (not entertainment). Output must be valid JSON only, no markdown.";

    const userText =
        "Return a JSON array of exactly 10 objects. Each object must have " +
        '"headline" (short factual title) and "searchQuery" (a concise Google search query for that story). ' +
        "No other keys. No wrapper object. No markdown fences.";

    const { text, raw } = await generateWithGoogleSearch(apiKey, {
        systemInstruction,
        userText,
    });

    let parsed;
    try {
        parsed = parseJsonLoose(text);
    } catch {
        throw new Error("Could not parse news list from the model. Try again.");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Model did not return a news array.");
    }

    const items = parsed.slice(0, 10).map((row, i) => {
        const headline =
            typeof row.headline === "string" && row.headline.trim()
                ? row.headline.trim()
                : `Story ${i + 1}`;
        const searchQuery =
            typeof row.searchQuery === "string" && row.searchQuery.trim()
                ? row.searchQuery.trim()
                : headline;
        return { headline, searchQuery };
    });

    newsListCache = { items, fetchedAt: Date.now() };
    return items;
}

/**
 * @param {{ headline: string, searchQuery?: string }} event
 * @returns {Promise<string>}
 */
export async function fetchNewsEventDetail(event) {
    const apiKey = await getGeminiApiKey();

    const systemInstruction =
        "You are a careful news summarizer. Use Google Search for fresh facts. " +
        "Be concise and factual. If sources conflict, say so. Plain text only, no JSON.";

    const userText =
        `Summarize this news story for a reader who saw only the headline.\n\n` +
        `Headline: ${event.headline}\n` +
        (event.searchQuery
            ? `Suggested search context: ${event.searchQuery}\n`
            : "") +
        "\nProvide: (1) What happened, (2) Who is involved, (3) Why it matters, (4) Latest known status. " +
        "Use short paragraphs. End with a \"Sources:\" bullet list of outlet names only if clear from search.";

    const { text, raw } = await generateWithGoogleSearch(apiKey, {
        systemInstruction,
        userText,
    });

    const footer = formatGroundingFooter(raw);
    return (text || "No summary returned.") + footer;
}

/**
 * Trending topics via search-backed synthesis (no direct X/Reddit APIs).
 * Grounding reflects what search surfaces about Google Trends, X, Reddit, etc.
 *
 * @returns {Promise<Array<{ headline: string, searchQuery: string }>>}
 */
export async function fetchTopTrendingTopics() {
    const cached = getCachedTrendingList();
    if (cached) return cached;

    const apiKey = await getGeminiApiKey();

    const systemInstruction =
        "You synthesize what is trending online right now. Use Google Search to find " +
        "current buzz across: Google Trends-style topics, widely discussed threads on X (Twitter), " +
        "and major subreddit / Reddit front-page stories. Mix sources; dedupe overlapping stories. " +
        "Output valid JSON only, no markdown.";

    const userText =
        "Return a JSON array of exactly 10 objects. Each object must have " +
        '"headline" (short label for the trend) and "searchQuery" (a Google search query to learn more). ' +
        "Cover a mix of categories (news, culture, tech, sports) when search results allow. " +
        "No other keys. No wrapper. No markdown fences.";

    const { text } = await generateWithGoogleSearch(apiKey, {
        systemInstruction,
        userText,
    });

    let parsed;
    try {
        parsed = parseJsonLoose(text);
    } catch {
        throw new Error(
            "Could not parse trending list from the model. Try again.",
        );
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Model did not return a trending array.");
    }

    const items = parsed.slice(0, 10).map((row, i) => {
        const headline =
            typeof row.headline === "string" && row.headline.trim()
                ? row.headline.trim()
                : `Trend ${i + 1}`;
        const searchQuery =
            typeof row.searchQuery === "string" && row.searchQuery.trim()
                ? row.searchQuery.trim()
                : headline;
        return { headline, searchQuery };
    });

    trendingListCache = { items, fetchedAt: Date.now() };
    return items;
}

/**
 * @param {{ headline: string, searchQuery?: string }} topic
 * @returns {Promise<string>}
 */
export async function fetchTrendingTopicDetail(topic) {
    const apiKey = await getGeminiApiKey();

    const systemInstruction =
        "You explain trending topics clearly. Use Google Search for what people are saying " +
        "and recent context (including social platforms when search surfaces them). " +
        "Plain text only, no JSON.";

    const userText =
        `Explain this trending topic for someone who only saw the title.\n\n` +
        `Topic: ${topic.headline}\n` +
        (topic.searchQuery
            ? `Search context: ${topic.searchQuery}\n`
            : "") +
        "\nCover: (1) What it is, (2) Why it is trending now, (3) Main angles or debates, " +
        "(4) Notable platforms or communities if search indicates (e.g. X, Reddit). " +
        "Short paragraphs. If uncertain, say what is unclear.";

    const { text, raw } = await generateWithGoogleSearch(apiKey, {
        systemInstruction,
        userText,
    });

    const footer = formatGroundingFooter(raw);
    return (text || "No summary returned.") + footer;
}
