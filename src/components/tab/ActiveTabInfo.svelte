<script>
    import { onMount } from "svelte";

    export let tabs = []; // Array of tab objects, each with isActive: boolean
    export let x = 0;
    export let y = 0;

    // Function to get the correct z-index for the active tab to be on top
    function getZIndex(tab) {
        return tab.isActive ? 10 : 1;
    }

    onMount(() => {});
</script>

<div class="active-tab-info-container" style="left: {x}px; top: {y}px;">
    {#each tabs as tab (tab.id)}
        <div
            class="tab-item"
            class:active={tab.isActive}
            style="z-index: {getZIndex(tab)};"
        >
            <img
                src={tab.favIconUrl || "placeholder.png"}
                alt="Favicon"
                class="tab-favicon"
            />
            <span class="tab-title">{tab.title}</span>
            {#if tab.isActive}
                <div class="quick-actions">
                    <button>Share</button>
                    <button>Reload</button>
                    <button>Save</button>
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .active-tab-info-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%); /* Center the widget on mouse click */
        background-color: rgba(255, 255, 255, 0.95);
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }

    .tab-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 6px;
        background-color: #f9f9f9;
        width: 250px;
        box-sizing: border-box;
        transition: all 0.2s ease-in-out;
        position: relative;
    }

    .tab-item.active {
        background-color: #e0f2f7; /* Highlight active tab */
        border: 2px solid #007bff;
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .tab-favicon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .tab-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
        font-size: 0.9em;
    }

    .tab-item.active .tab-title {
        font-weight: bold;
        font-size: 1em;
    }

    .quick-actions {
        display: flex;
        gap: 5px;
    }

    .quick-actions button {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 0.8em;
    }

    .quick-actions button:hover {
        background-color: #0056b3;
    }
</style>
