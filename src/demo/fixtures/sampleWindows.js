/**
 * Initial windows/tabs for the landing-page demo (Chrome-shaped objects).
 * One window mixing work, media, personal, newsletters, and social tabs
 * (multiple real-world browsing contexts in a single window).
 * @returns {chrome.windows.Window[]}
 */
export function createSampleWindows() {
    const fav = (host) =>
        `https://www.google.com/s2/favicons?domain=${host}&sz=32`;

    const WID = 1;

    /** @type {chrome.windows.Window[]} */
    const w = [
        {
            id: WID,
            focused: true,
            state: "normal",
            type: "normal",
            incognito: false,
            tabs: [
                // —— Work ——
                {
                    id: 101,
                    index: 0,
                    windowId: WID,
                    title: "swift_tabs — Pull requests",
                    url: "https://github.com/malcolmjmr/swift_tabs/pulls",
                    active: true,
                    pinned: false,
                    favIconUrl: fav("github.com"),
                },
                {
                    id: 102,
                    index: 1,
                    windowId: WID,
                    title: "Linear — ST-204 Demo polish",
                    url: "https://linear.app/example/issue/ST-204",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("linear.app"),
                },
                {
                    id: 103,
                    index: 2,
                    windowId: WID,
                    title: "Notion — Q2 planning",
                    url: "https://www.notion.so/workspace/Q2-planning",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("notion.so"),
                },
                {
                    id: 104,
                    index: 3,
                    windowId: WID,
                    title: "Google Docs — RFC: tab model",
                    url: "https://docs.google.com/document/d/example/edit",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("docs.google.com"),
                },
                {
                    id: 105,
                    index: 4,
                    windowId: WID,
                    title: "Slack — #release",
                    url: "https://app.slack.com/client/T012345/C-release",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("slack.com"),
                },
                // —— YouTube ——
                {
                    id: 106,
                    index: 5,
                    windowId: WID,
                    title: "YouTube — Subscriptions",
                    url: "https://www.youtube.com/feed/subscriptions",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("youtube.com"),
                },
                {
                    id: 107,
                    index: 6,
                    windowId: WID,
                    title: "YouTube — Web platform playlist",
                    url: "https://www.youtube.com/playlist?list=WL",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("youtube.com"),
                },
                {
                    id: 108,
                    index: 7,
                    windowId: WID,
                    title: "YouTube — History",
                    url: "https://www.youtube.com/feed/history",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("youtube.com"),
                },
                // —— Personal ——
                {
                    id: 109,
                    index: 8,
                    windowId: WID,
                    title: "Google Calendar — April",
                    url: "https://calendar.google.com/calendar/u/0/r/month",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("google.com"),
                },
                {
                    id: 110,
                    index: 9,
                    windowId: WID,
                    title: "Mint — Accounts",
                    url: "https://mint.intuit.com/overview",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("intuit.com"),
                },
                {
                    id: 111,
                    index: 10,
                    windowId: WID,
                    title: "OpenStreetMap — Neighborhood",
                    url: "https://www.openstreetmap.org/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("openstreetmap.org"),
                },
                {
                    id: 112,
                    index: 11,
                    windowId: WID,
                    title: "Recipe — cast-iron sourdough",
                    url: "https://www.justtherecipe.com/sourdough",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("example-recipes.test"),
                },
                // —— Newsletters ——
                {
                    id: 113,
                    index: 12,
                    windowId: WID,
                    title: "Stratechery — Weekly Article",
                    url: "https://stratechery.com/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("stratechery.com"),
                },
                {
                    id: 114,
                    index: 13,
                    windowId: WID,
                    title: "Substack — Dense Discovery",
                    url: "https://dense.substack.com/p/latest",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("substack.com"),
                },
                {
                    id: 115,
                    index: 14,
                    windowId: WID,
                    title: "The Browser — Today",
                    url: "https://thebrowser.com/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("thebrowser.com"),
                },
                // —— Social ——
                {
                    id: 116,
                    index: 15,
                    windowId: WID,
                    title: "X / Home",
                    url: "https://x.com/home",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("x.com"),
                },
                {
                    id: 117,
                    index: 16,
                    windowId: WID,
                    title: "Instagram",
                    url: "https://www.instagram.com/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("instagram.com"),
                },
                {
                    id: 118,
                    index: 17,
                    windowId: WID,
                    title: "Reddit — r/browsers",
                    url: "https://www.reddit.com/r/browsers/",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("reddit.com"),
                },
            ],
        },
        {
            id: 2,
            focused: false,
            state: "normal",
            type: "normal",
            incognito: false,
            name: "Side project",
            tabs: [
                {
                    id: 201,
                    index: 0,
                    windowId: 2,
                    title: "Rust Book — Ownership",
                    url: "https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html",
                    active: true,
                    pinned: false,
                    favIconUrl: fav("rust-lang.org"),
                },
                {
                    id: 202,
                    index: 1,
                    windowId: 2,
                    title: "crates.io — serde",
                    url: "https://crates.io/crates/serde",
                    active: false,
                    pinned: false,
                    favIconUrl: fav("crates.io"),
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
