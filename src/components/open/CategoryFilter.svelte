<script>
    import { createEventDispatcher } from "svelte";
    export let categories = [];
    export let selectedCategory = null;

    const dispatch = createEventDispatcher();

    function handleCategorySelect(category) {
        dispatch("select", { category });
    }
</script>

<div class="category-filter">
    <h3>Category</h3>
    <div class="category-list">
        {#each categories as category (category.id)}
            <button
                class="category-item"
                on:click={() => handleCategorySelect(category.id)}
                >{category.name}</button
            >
        {/each}
    </div>
</div>

<style>
    .category-filter {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .category-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .category-item {
        display: flex;
    }
</style>
