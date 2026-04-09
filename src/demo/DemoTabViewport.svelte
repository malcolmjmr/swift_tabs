<script>
    import { onMount } from "svelte";
    import { tabStore, tabs, activeTabId } from "../stores/tabStore.js";

    /** @param {string} s */
    function hueFromString(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h % 360;
    }

    /** @param {string | undefined} url */
    function displayHost(url) {
        if (!url?.trim()) return "";
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }

    $: activeTab =
        $tabs.find((t) => t.active) ??
        $tabs.find((t) => t.id === $activeTabId) ??
        $tabs[0] ??
        null;

    $: pageHue = hueFromString(displayHost(activeTab?.url) || activeTab?.title || "x");
    $: gradient = `linear-gradient(145deg, hsl(${pageHue}, 32%, 16%) 0%, hsl(${(pageHue + 48) % 360}, 28%, 10%) 100%)`;

    onMount(async () => {
        await tabStore.init();
    });
</script>

<div class="demo-viewport" style:--demo-page-gradient={gradient}>
    <div class="demo-viewport__chrome" aria-hidden="true">
        {#if activeTab}
            {#if activeTab.favIconUrl}
                <img
                    class="demo-viewport__favicon"
                    src={activeTab.favIconUrl}
                    alt=""
                    width="16"
                    height="16"
                />
            {:else}
                <span class="demo-viewport__favicon demo-viewport__favicon--ph" />
            {/if}
            <span class="demo-viewport__url">{activeTab.url || ""}</span>
        {:else}
            <span class="demo-viewport__url demo-viewport__url--muted">No tab</span>
        {/if}
    </div>
    <div class="demo-viewport__body">
        {#if activeTab}
            <h2 class="demo-viewport__title">{activeTab.title || "Untitled"}</h2>
            <p class="demo-viewport__hint">
                Demo preview — page content is not loaded here; switch tabs to see
                the active tab update.
            </p>
        {:else}
            <p class="demo-viewport__hint">Loading tabs…</p>
        {/if}
    </div>
</div>

<style>
    .demo-viewport {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-radius: inherit;
        background: var(--demo-page-gradient, #14161c);
        pointer-events: none;
    }

    .demo-viewport__chrome {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: rgba(0, 0, 0, 0.35);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 12px;
        color: rgba(255, 255, 255, 0.55);
    }

    .demo-viewport__favicon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        border-radius: 3px;
    }

    .demo-viewport__favicon--ph {
        background: rgba(255, 255, 255, 0.15);
    }

    .demo-viewport__url {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: ui-monospace, monospace;
    }

    .demo-viewport__url--muted {
        opacity: 0.6;
    }

    .demo-viewport__body {
        flex: 1 1 auto;
        min-height: 0;
        padding: 28px 24px 80px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        color: rgba(255, 255, 255, 0.92);
    }

    .demo-viewport__title {
        margin: 0;
        font-size: clamp(1.15rem, 2.8vw, 1.5rem);
        font-weight: 600;
        line-height: 1.25;
        letter-spacing: -0.02em;
        text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
    }

    .demo-viewport__hint {
        margin: 0;
        max-width: 28rem;
        font-size: 13px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.55);
    }
</style>
