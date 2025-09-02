<script>
    import { scale } from "svelte/transition";
    import { tabStore } from "../stores/tabStore";

    export let windows = [];
    export let activeWindowId;
    export let onWindowSelect = () => {};

    function handleWindowClick(windowId) {
        onWindowSelect(windowId);
    }
</script>

<div
    class="window-overview"
    transition:scale={{ duration: 200, start: 0.95 }}
    role="listbox"
    aria-label="Window Overview"
>
    {#each windows as window (window.id)}
        <button
            class="window-item"
            class:active={window.id === activeWindowId}
            on:click={() => handleWindowClick(window.id)}
            role="option"
            aria-selected={window.id === activeWindowId}
        >
            {#if window.tabs?.length}
                <!-- Active Tab Header -->
                <div class="window-header">
                    {#if window.tabs.find((t) => t.active)}
                        <img
                            src={window.tabs.find((t) => t.active).favIconUrl}
                            alt=""
                            class="active-tab-icon"
                        />
                        <span class="active-tab-title">
                            {window.tabs.find((t) => t.active).title}
                        </span>
                    {/if}
                </div>

                <!-- Tab Icons Grid -->
                <div class="tab-icons">
                    {#each window.tabs.filter((t) => !t.active) as tab}
                        <div class="tab-icon-wrapper" title={tab.title}>
                            <img
                                src={tab.favIconUrl}
                                alt={tab.title}
                                class="tab-icon"
                            />
                        </div>
                    {/each}
                </div>
            {/if}
        </button>
    {/each}
</div>

<style>
    .window-overview {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 320px;
        max-height: 600px;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
    }

    .window-item {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        border: none;
        background: #f8f8f8;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
    }

    .window-item:hover {
        background: #f0f0f0;
        transform: translateY(-1px);
    }

    .window-item.active {
        background: #e8e8e8;
        border-left: 3px solid #4299e1;
    }

    .window-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
    }

    .active-tab-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .active-tab-title {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tab-icons {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
        padding: 4px;
    }

    .tab-icon-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .tab-icon-wrapper:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .tab-icon {
        width: 16px;
        height: 16px;
        border-radius: 2px;
    }

    /* Custom scrollbar styles */
    .window-overview::-webkit-scrollbar {
        width: 8px;
    }

    .window-overview::-webkit-scrollbar-track {
        background: transparent;
    }

    .window-overview::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
    }

    .window-overview::-webkit-scrollbar-thumb:hover {
        background-color: #ccc;
    }
</style>
