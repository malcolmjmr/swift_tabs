<script>
    import { createEventDispatcher } from "svelte";

    export let input = "";

    const dispatch = createEventDispatcher();

    function handleInputChange(event) {
        dispatch("change", event.target.value);
    }
</script>

<div class="input-field">
    <input
        id="input-field"
        type="text"
        placeholder="Search, ask or plan..."
        bind:value={input}
        on:input={handleInputChange}
    />
</div>

<style>
    .input-field {
        width: 100%;
        border-top: 1px solid #555;
    }

    .input-field #input-field {
        font-size: 14px;
        width: 100%;
        min-height: 30px;
        border: none;
        outline: none;
        background-color: transparent;
        color: white;
        padding: 8px;
        font-size: 14px;
    }
</style>
