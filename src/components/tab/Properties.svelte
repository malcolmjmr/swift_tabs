<script>
    export let activeTab;

    let resource;
    let index = activeTab?.journey?.index ?? 0;
    let properties = [
        {
            label: "Title",
            value: resource?.title,
        },
    ];

    onMount(() => {
        loadResource();
    });

    async function loadResource() {
        resource = activeTab?.journey?.history[index];
    }
</script>

<div class="properties">
    <div class="property-list"></div>
    <div class="visible-properties"></div>
</div>

<style>
    .properties {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        background-color: #f0f0f0;
        border-radius: 5px;
    }

    .property-list {
        display: flex;
        flex-direction: row;
        height: 20px;
        align-items: center;
        justify-content: center;
    }
</style>
