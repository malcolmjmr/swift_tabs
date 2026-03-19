<script>
    import ActiveTabLabel from "./ActiveTabLabel.svelte";

    export let currentWindowTabs = [];
    export let activeTabId = null;

    $: tabs = (() => {
        const sorted = [...currentWindowTabs].sort((a, b) => a.index - b.index);
        if (sorted.length === 0) return [];
        const activeIndex = sorted.findIndex((t) => t.id === activeTabId);
        const idx = activeIndex >= 0 ? activeIndex : 0;
        const len = sorted.length;
        const active = sorted[idx];
        const prev = sorted[(idx - 1 + len) % len];
        const next = sorted[(idx + 1) % len];
        const result = [];
        if (prev && prev.id !== active.id) result.push(prev);
        result.push(active);
        if (next && next.id !== active.id) result.push(next);
        return result;
    })();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Tab switching">
    <div class="modal">
        <div class="tab-list">
            {#each tabs as tab (tab.id)}
                {@const isActive = tab.id === activeTabId}
                {#if isActive}
                    <div class="tab-item active">
                        <ActiveTabLabel {tab} />
                    </div>
                {:else}
                    <div class="tab-item" class:active={tab.id === activeTabId}>
                        <div class="tab-item-icon">
                            {#if tab.favIconUrl}
                                <img src={tab.favIconUrl} alt="" />
                            {:else}
                                <span
                                    class="favicon-fallback"
                                    title={tab.title}
                                >
                                    {tab.title
                                        ? tab.title.charAt(0).toUpperCase()
                                        : "?"}
                                </span>
                            {/if}
                        </div>
                        <span class="tab-item-title"
                            >{tab.title || "Untitled"}</span
                        >
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;

        display: flex;
        align-items: flex-end;
        justify-content: flex-start;
        padding: 20px;
        z-index: 1000000;
        pointer-events: none;
    }

    .modal {
        border-radius: 12px;

        padding: 12px;
    }

    .tab-list {
        display: flex;
        flex-direction: column;
        position: relative;
        align-items: center;
        justify-content: center;
    }

    .tab-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;

        background: #333;
        color: white;
        opacity: 0.9;
        transition:
            opacity 0.15s,
            background 0.15s,
            transform 0.15s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        margin-bottom: -10px;
        transform: scale(0.9);
        transform-origin: top left;
        position: relative;
        z-index: 1;
        width: 200px;
        max-width: 200px;
        min-width: 200px;
    }

    .tab-item:first-child {
        border-radius: 8px 8px 0 0;
        margin-top: -10px;
    }

    .tab-item:last-child {
        margin-bottom: -10px;
        border-radius: 0 0 8px 8px;
    }

    .tab-item.active {
        transform: scale(1);
        transform-origin: top left;
        background: #333;
        opacity: 1;

        z-index: 2;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        width: 250px;
        max-width: 250px;
        min-width: 250px;
    }

    .tab-item-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tab-item.active .tab-item-icon {
        width: 24px;
        height: 24px;
    }

    .tab-item-icon img {
        width: 20px;
        height: 20px;
        object-fit: contain;
    }

    .tab-item.active .tab-item-icon img {
        width: 24px;
        height: 24px;
    }

    .favicon-fallback {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        background: #505055;
        border-radius: 4px;
        color: inherit;
    }

    .tab-item.active .favicon-fallback {
        width: 24px;
        height: 24px;
        font-size: 14px;
    }

    .tab-item-title {
        font-size: 14px;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tab-item.active .tab-item-title {
        font-size: 18px;
    }
</style>
