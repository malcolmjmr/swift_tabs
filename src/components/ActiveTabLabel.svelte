<script>
    import { onMount } from "svelte";
    export let tab;

    let titleIsInFocus = false;
    let urlIsInFocus = false;
    let hostName = new URL(tab.url).hostname;
    let urlFieldContent = hostName;
    let editingUrl = false;
    onMount(() => {});

    function handleUrlFieldFocus() {
        urlIsInFocus = true;
    }

    function handleUrlFieldBlur() {
        urlIsInFocus = false;
    }
</script>

<div class="active-tab-label">
    <div class="tab-info">
        <div class="tab-title">
            {tab.title}
        </div>
        {#if !editingUrl}
            <div
                class="tab-host-name"
                contenteditable="true"
                bind:innerText={urlFieldContent}
                on:mouseenter={handleUrlFieldFocus}
                on:mouseleave={handleUrlFieldBlur}
                on:blur={handleUrlFieldBlur}
            ></div>
        {/if}
    </div>
</div>

<style>
    .active-tab-label {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: flex-start;
        border-radius: 12px;
        padding: 4px;
        margin: 10px 10px 0px 10px;
        background-color: #333;
        color: white;
    }
    .menu-button {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background-color: #333;
    }
    .tab-info {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border-radius: 8px;
        padding: 4px;
        margin: 2px;
    }
    .tab-title {
        color: white;
    }
    .tab-host-name {
        color: white;
        opacity: 0.5;
    }
</style>
