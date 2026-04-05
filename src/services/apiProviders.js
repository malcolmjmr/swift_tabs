/**
 * Registry of third-party API integrations. Storage keys match options.html
 * input ids: chrome.storage.local → settings.apiKeys[id].
 */
export const API_PROVIDER_CATEGORIES = {
    llm: "LLMs",
    search: "Search & discovery",
    annotations: "Annotations",
    commerce: "Commerce",
};

/** @type {Array<{ id: string; label: string; category: keyof typeof API_PROVIDER_CATEGORIES; docsUrl: string; baseUrl?: string }>} */
export const API_PROVIDERS = [
    {
        id: "geminiApiKey",
        label: "Google Gemini",
        category: "llm",
        docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
        baseUrl: "https://generativelanguage.googleapis.com",
    },
    {
        id: "kimiApiKey",
        label: "Kimi (Moonshot)",
        category: "llm",
        docsUrl: "https://platform.moonshot.cn/docs/api/chat",
        baseUrl: "https://api.moonshot.cn",
    },
    {
        id: "hypothesisApiKey",
        label: "Hypothes.is",
        category: "annotations",
        docsUrl: "https://h.readthedocs.io/en/latest/api/",
        baseUrl: "https://api.hypothes.is/api",
    },
    {
        id: "channel3ApiKey",
        label: "Channel3",
        category: "commerce",
        docsUrl: "https://docs.trychannel3.com/",
        baseUrl: "https://api.trychannel3.com",
    },
    {
        id: "braveSearchApiKey",
        label: "Brave Search",
        category: "search",
        docsUrl: "https://api.search.brave.com/app/documentation",
        baseUrl: "https://api.search.brave.com",
    },
    {
        id: "exaApiKey",
        label: "Exa",
        category: "search",
        docsUrl: "https://docs.exa.ai/reference/getting-started",
        baseUrl: "https://api.exa.ai",
    },
    {
        id: "tavilyApiKey",
        label: "Tavily",
        category: "search",
        docsUrl: "https://docs.tavily.com/documentation/api-reference/introduction",
        baseUrl: "https://api.tavily.com",
    },
];

/** @param {string} providerId */
export function getApiProvider(providerId) {
    return API_PROVIDERS.find((p) => p.id === providerId) ?? null;
}
