/**
 * Initial windows/tabs for the landing-page demo (Chrome-shaped objects).
 * @returns {chrome.windows.Window[]}
 */
export function createSampleWindows() {
    const fav = (host) =>
        `https://www.google.com/s2/favicons?domain=${host}&sz=32`;

    /** @type {chrome.windows.Window[]} */
    const w = [
        {
            id: 1,
            focused: true,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                {
                    id: 101,
                    index: 0,
                    windowId: 1,
                    title: "Swift Tabs — Overview",
                    url: "https://example.com/swift-tabs",
                    active: true,
                    pinned: false,
                    favIconUrl: fav("example.com"),
                },
                {
                    id: 102,
                    index: 1,
                    windowId: 1,
                    title: "Pull request #482 — swift_tabs",
                    url: "https://github.com/org/swift_tabs/pull/482",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("github.com"),
                },
                {
                    id: 103,
                    index: 2,
                    windowId: 1,
                    title: "Linear — Navigation polish",
                    url: "https://linear.app/team/issue/ST-120",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("linear.app"),
                },
                {
                    id: 104,
                    index: 3,
                    windowId: 1,
                    title: "Docs: interaction_navigation_mode",
                    url: "https://example.com/docs/navigation",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("example.com"),
                },
                {
                    id: 105,
                    index: 4,
                    windowId: 1,
                    title: "localhost:5173",
                    url: "http://localhost:5173/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("localhost"),
                },
            ],
        },
        {
            id: 2,
            focused: false,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                {
                    id: 201,
                    index: 0,
                    windowId: 2,
                    title: "Calendar — Week view",
                    url: "https://calendar.google.com/",
                    active: true,
                    pinned: false,
                    favIconUrl: fav("google.com"),
                },
                {
                    id: 202,
                    index: 1,
                    windowId: 2,
                    title: "Slack — #engineering",
                    url: "https://app.slack.com/client/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("slack.com"),
                },
                {
                    id: 203,
                    index: 2,
                    windowId: 2,
                    title: "Notion — Roadmap",
                    url: "https://notion.so/roadmap",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("notion.so"),
                },
            ],
        },
        {
            id: 3,
            focused: false,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                {
                    id: 301,
                    index: 0,
                    windowId: 3,
                    title: "MDN — Element.scrollIntoView",
                    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView",
                    active: true,
                    pinned: false,
                    favIconUrl: fav("developer.mozilla.org"),
                },
                {
                    id: 302,
                    index: 1,
                    windowId: 3,
                    title: "Rollup — plugin-alias",
                    url: "https://rollupjs.org/plugin-development/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("rollupjs.org"),
                },
            ],
        },
    ];
    return w;
}

export function cloneSampleWindows() {
    return /** @type {chrome.windows.Window[]} */ (
        structuredClone(createSampleWindows())
    );
}
