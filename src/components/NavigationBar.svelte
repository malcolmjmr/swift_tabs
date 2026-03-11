<script>
    import { onMount } from "svelte";
    import { chromeService } from "../services/chromeApi";

    export let showMenu = false;
    export let showTabsView = false;
    export let showResourceView = false;

    function handleCreateTab() {
        chromeService.createTab({ active: true });
    }
</script>

<div class="navigation-bar">
    <div class="navigation-bar-item">
        <span class="material-symbols-rounded">arrow_back</span>
    </div>
    <div class="navigation-bar-item">
        <span class="material-symbols-rounded">arrow_forward</span>
    </div>
    <div class="navigation-bar-item" on:click={handleCreateTab}>
        <span
            class="material-symbols-rounded"
            style="font-variation-settings: 'FILL' 1;">add_circle</span
        >
    </div>

    <div
        class="navigation-bar-item"
        on:click={() => (showTabsView = !showTabsView)}
    >
        <span class="material-symbols-rounded">select_window_2</span>
    </div>
    <div class="navigation-bar-item" on:click={() => (showMenu = !showMenu)}>
        <span class="material-symbols-rounded">more_horiz</span>
    </div>
</div>

<style>
    .navigation-bar {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        gap: 5px;
    }
    .navigation-bar-item {
        padding: 5px;
        border-radius: 5px;
    }
    .navigation-bar-item span {
        cursor: pointer;
        font-size: 30px;
        color: #fff;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 48;
    }
</style>
