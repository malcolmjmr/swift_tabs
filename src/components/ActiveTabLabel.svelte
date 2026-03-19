<script>
    import { onMount } from "svelte";
    export let tab;

    let titleIsInFocus = false;
    let urlIsInFocus = false;
    let hostName;
    let urlFieldContent;
    let editingUrl = false;
    onMount(() => {
        if (tab) updateTabInfo();
    });

    $: {
        if (tab) {
            updateTabInfo();
        }
    }

    function updateTabInfo() {
        hostName = tab.url ? new URL(tab.url).hostname : "";
        urlFieldContent = hostName;
    }

    function handleUrlFieldFocus() {
        urlIsInFocus = true;
    }

    function handleUrlFieldBlur() {
        urlIsInFocus = false;
    }
</script>

<div class="active-tab-label">
    <div class="tab-favicon">
        <img src={tab.favIconUrl} alt="Favicon" />
    </div>
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
        align-items: center;
        justify-content: flex-start;
        border-radius: 12px;
        padding: 4px 4px 0px 4px;
        margin: 0px;
        background-color: #333;
        color: white;
        /* min-height: 30px;
        width: calc(100% - 8px); */
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
        color: white;
        font-family: system-ui;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.2;
    }
    .tab-title {
        color: white;
    }
    .tab-host-name {
        color: white;
        opacity: 0.5;
    }

    .tab-favicon {
        min-width: 30px;
        min-height: 30px;
        width: 30px;
        height: 30px;
        border-radius: 12px;
        background-color: #333;
        margin: 10px;
    }
    .tab-favicon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
</style>
