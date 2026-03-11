<script>
    import { createEventDispatcher } from "svelte";
    import { windowTypes, outputTypes } from "./types";
    import OutputOptions from "./OutputOptions.svelte";
    import WindowOptions from "./WindowOptions.svelte";

    export let config;

    let panelView = null;
    const panelViews = {
        attachments: "attachments",
        windowType: "windowType",
        outputType: "outputType",
    };
    const dispatch = createEventDispatcher();

    function onSubmit() {
        dispatch("submit", config);
    }

    function toggleIncognito() {
        config.incognito = !config.incognito;
    }

    function onOutputTypeSelection({ detail }) {
        config.outputType = detail;
        panelView = null;
    }

    function onWindowTypeSelection({ detail }) {
        config.windowType = detail;
        panelView = null;
    }
</script>

<div class="output-controls">
    <div class="buttons">
        <button on:click={toggleIncognito}>
            <span
                class="material-symbols-rounded"
                class:incognito={config.incognito}>domino_mask</span
            >
        </button>
        <button on:click={() => (panelView = panelViews.attachments)}>
            <span class="material-symbols-rounded">attach_file</span>
        </button>
        <button on:click={() => (panelView = panelViews.windowType)}>
            <span class="material-symbols-rounded">
                {#if config.windowType === windowTypes.tab}tab
                {:else if config.windowType === windowTypes.window}web_asset
                {:else if config.windowType === windowTypes.popup}open_in_new
                {:else if config.windowType === windowTypes.attached}iframe
                {/if}
            </span>
        </button>
        <button on:click={() => (panelView = panelViews.outputType)}>
            <span class="material-symbols-rounded">
                {#if config.outputType === outputTypes.web}language
                {:else if config.outputType === outputTypes.chat}chat
                {:else if config.outputType === outputTypes.task}task
                {:else if config.outputType === outputTypes.compare}table
                {:else if config.outputType === outputTypes.research}overview
                {/if}
            </span>
        </button>

        <button on:click={onSubmit}
            ><span class="material-symbols-rounded">send</span></button
        >
    </div>
    {#if panelView}
        <div class="panel">
            {#if panelView === "attachments"}
                <div class="attachments">
                    <h1>Attachments</h1>
                </div>
            {/if}
            {#if panelView === "windowType"}
                <WindowOptions
                    bind:config
                    on:selection={onWindowTypeSelection}
                />
            {/if}
            {#if panelView === "outputType"}
                <OutputOptions
                    bind:config
                    on:selection={onOutputTypeSelection}
                />
            {/if}
        </div>
    {/if}
</div>

<style>
    .output-controls {
        display: flex;
        flex-direction: column;
        max-height: 50%;
        width: 100%;
        border-top: 1px solid #555;
        align-items: center;
        justify-content: space-between;
        padding: 0px 8px;
    }

    .buttons {
        display: flex;
        flex-direction: row;
        height: 30px;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        color: white;
    }

    .buttons button {
        background: none;
        border: none;
        cursor: pointer;
        color: white;
    }

    button .incognito {
        font-variation-settings:
            "FILL" 1,
            "wght" 100,
            "GRAD" 0,
            "opsz" 48;
    }

    .panel {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: calc(100% - 40px);
        padding: 0px;
        overflow-y: scroll;
        background-color: #444;
        overflow: hidden;
        border-radius: 12px;
    }
</style>
