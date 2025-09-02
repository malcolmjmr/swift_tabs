<script>
    import WindowDots from "./WindowDots.svelte";
    import { tabStore, activeWindowId } from "../stores/tabStore";

    export let toggleExpanded = () => {};

    function handleCreateTab() {
        tabStore.createTab({ active: true });
    }

    function handleWindowSelect({ detail }) {
        // Reset activeTabIndex when switching windows
        activeTabIndex = 0;
    }

    $: windows = $tabStore.windows;
</script>

<footer class="footer">
    <button class="footer-button" title="Create New" on:click={handleCreateTab}>
        <span class="icon">+</span>
    </button>
    <WindowDots
        windows={$windows}
        activeWindowId={$activeWindowId}
        on:windowSelect={handleWindowSelect}
    />
    <button class="footer-button" on:click={toggleExpanded} title="Collapse">
        <span class="icon">×</span>
    </button>
</footer>

<style>
    .footer {
        padding: 8px 12px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .footer-button {
        width: 28px;
        height: 28px;
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

    .footer-button:hover {
        background: #f0f0f0;
        color: #333;
    }

    .icon {
        font-size: 18px;
        line-height: 1;
    }
</style>
