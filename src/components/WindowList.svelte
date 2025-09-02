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

<div class="window-list" transition:scale={{ duration: 200, start: 0.95 }}>
    {#each windows as window (window.id)}
        <button
            class="window-item"
            class:active={window.id === activeWindowId}
            on:click={() => handleWindowClick(window.id)}
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
                        <img
                            src={tab.favIconUrl}
                            alt={tab.title}
                            class="tab-icon"
                            title={tab.title}
                        />
                    {/each}
                </div>
            {/if}
        </button>
    {/each}
</div>

<style>
    .window-list {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 300px;
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
        gap: 8px;
        padding: 12px;
        border: none;
        background: #f8f8f8;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
    }

    .window-item:hover {
        background: #f0f0f0;
    }

    .window-item.active {
        background: #e8e8e8;
    }

    .window-header {
        display: flex;
        align-items: center;
        gap: 8px;
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
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .tab-icon {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .tab-icon:hover {
        opacity: 1;
    }

    /* Custom scrollbar styles */
    .window-list::-webkit-scrollbar {
        width: 8px;
    }

    .window-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .window-list::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
    }

    .window-list::-webkit-scrollbar-thumb:hover {
        background-color: #ccc;
    }
</style>
