<script>
    import { windowTypes } from "./types";
    import OptionsContainer from "./OptionsContainer.svelte";

    export let config;

    let options = [
        {
            label: "Tab",
            value: windowTypes.tab,
            icon: "tab",
        },
        {
            label: "Window",
            value: windowTypes.window,
            icon: "web_asset",
        },

        {
            label: "Pop Up",
            value: windowTypes.popup,
            icon: "open_in_new",
        },

        {
            label: "Attached",
            value: windowTypes.attached,
            icon: "iframe",
        },
    ];
</script>

<OptionsContainer
    title="Window Types"
    {options}
    selectedOption={config.windowType}
    on:selection
/>
