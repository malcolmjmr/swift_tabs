<script>
    import { createEventDispatcher } from "svelte";

    export let title;
    export let options;
    export let selectedOption;

    const dispatch = createEventDispatcher();
</script>

<div class="options-container">
    <div class="header">{title}</div>
    <div class="container">
        {#each options as option, index}
            <button
                class="option"
                class:active={selectedOption === option.value}
                on:click={() => dispatch("selection", option.value)}
            >
                <span class="label">{option.label}</span>
                <span class="material-symbols-rounded">{option.icon}</span>
            </button>
            {#if index < options.length - 1}
                <div class="divider"></div>
            {/if}
        {/each}
    </div>
</div>

<style>
    .options-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .header {
        font-size: 14px;
        font-weight: 500;
        color: white;
        padding: 5px 8px 0px 8px;
    }

    .container {
        display: flex;
        flex-direction: column;
        width: calc(100% - 16px);
        border-radius: 12px;
        background-color: #333;
        margin: 5px;
        margin-bottom: 20px;
        overflow: hidden;
    }

    .option {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 5px 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        background: none;
        width: 100%;
        font-size: 14px;
        opacity: 0.5;
        color: white;
    }

    .option:hover {
        background-color: #555;
        opacity: 1;
    }

    .option.active {
        opacity: 1;
    }

    .divider {
        height: 1px;
        background-color: #555;
        width: 100%;
    }
</style>
