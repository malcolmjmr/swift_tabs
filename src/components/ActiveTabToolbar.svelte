<script>
    export let toggleExpanded = () => {};

    import { tabStore } from "../stores/tabStore";

    async function handleCreateTab() {
        await tabStore.createTab({ active: true });
    }
</script>

<div class="active-tab-toolbar">
    <div class="action-buttons">
        <button
            class="action-button"
            title="Create New"
            on:click={handleCreateTab}
        >
            <span class="icon">+</span>
        </button>
        <button class="action-button" title="Overview">
            <span class="icon">⊞</span>
        </button>
        <button class="action-button" title="Menu">
            <span class="icon">≡</span>
        </button>
        <button class="action-button" title="Assistant">
            <span class="icon">★</span>
        </button>
        <button class="action-button" on:click={toggleExpanded} title="Expand">
            <span class="icon">⋮</span>
        </button>
    </div>
</div>

<style>
    .active-tab-toolbar {
        /* Add styles for the toolbar here */
        background-color: #f8f8f8;
        padding: 5px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .action-buttons {
        display: flex;
        justify-content: space-between;
        padding: 0 8px;
    }

    .action-button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
    }

    .action-button:hover {
        background: #f0f0f0;
        color: #333;
    }
</style>
