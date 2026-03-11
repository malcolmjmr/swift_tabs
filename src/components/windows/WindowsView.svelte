<script>
    import { onMount } from "svelte";
    import WindowView from "./WindowView.svelte";
    import WindowsFooter from "./WindowsFooter.svelte";
    import { chromeService } from "../../services/chromeApi";
    import TabsView from "./TabsView.svelte";
    export let windows = [];
    export let activeWindowId;
    export let onWindowSelect = () => {};

    onMount(() => {
        getActiveWindow();
        //scrollToActiveWindow();
    });

    let activeWindow = null;
    async function getActiveWindow() {
        activeWindow = await chromeService.getCurrentWindow();
    }

    function handleWindowClick(windowId) {
        onWindowSelect(windowId);
    }
    async function scrollToActiveWindow() {
        activeWindowId = await chromeService.getActiveWindowId();
        const activeWindow = windows.find((w) => w.id === activeWindowId);
        if (activeWindow) {
            const windowView = document.querySelector(
                `#window-${activeWindow.id}`,
            );
            windowView.scrollIntoView({ behavior: "smooth" });
        }
    }

    $: {
        activeWindowId;
        scrollToActiveWindow();
    }
</script>

<div class="windows">
    <div class="windows-container">
        {#if activeWindow}
            <WindowView
                window={activeWindow}
                windowIndex={windows.findIndex((w) => w.id === activeWindow.id)}
            />
        {/if}
        <!-- {#each windows as window, index (window.id)}
            <WindowView {window} windowIndex={index} />
        {/each} -->
    </div>
    <WindowsFooter />
</div>

<style>
    .windows {
        background: #222;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 240px;
        height: 100%;
        overflow: hidden;
        padding: 0px;
        margin: 0px;
        display: flex;
        flex-direction: column;
        z-index: 1000;
        transition: all 0.2s;
    }
    .windows-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        overflow-x: scroll;
    }
</style>
