<script>
    import { outputTypes } from "./types";
    import OptionsContainer from "./OptionsContainer.svelte";
    export let config;

    let options = [
        {
            label: "Web",
            value: outputTypes.web,
            icon: "language",
        },
        {
            label: "Chat",
            value: outputTypes.chat,
            icon: "chat",
        },
        {
            label: "Task",
            value: outputTypes.task,
            icon: "task",
        },
        {
            label: "Compare",
            value: outputTypes.compare,
            icon: "table",
        },
        {
            label: "Research",
            value: outputTypes.research,
            icon: "overview",
        },
    ];
</script>

<OptionsContainer
    title="Output Types"
    {options}
    selectedOption={config.outputType}
    on:selection
/>
