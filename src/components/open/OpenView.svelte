<script>
    /*
        TODO:
        - load (recent spaces, sites, searches, bookmarks, tasks, chats, resource categories)
        - create list items (open, delete)
        - attachment view
        - submit
    */

    import { onMount } from "svelte";
    import InputField from "./InputField.svelte";
    import CategoryFilter from "./CategoryFilter.svelte";
    import { chromeService } from "../../services/chromeApi";
    import OutputControls from "./OutputControls.svelte";
    import { windowTypes, outputTypes } from "./types";

    onMount(() => {
        load();
    });

    let config = {
        incognito: false,
        attachments: null,
        windowType: windowTypes.tab,
        outputType: outputTypes.web,
        // thinking?
    };

    async function load() {
        bookmarks = await chromeService.getBookmarks();
        tabs = await chromeService.getTabs();
        history = await chromeService.getHistory();
        searchHistory = filterSearchHistory(history);
    }

    function filterSearchHistory(history) {
        return history.filter(
            (item) => item.url.includes("/search") || item.url.includes("q="),
        );
    }

    let bookmarks = [];
    let tabs = [];
    let history = [];
    let searchHistory = [];

    let visibleItems = [];
    let selectedCategory = null;
    const categories = {
        bookmarks: "Bookmarks",
        tabs: "Tabs",
        history: "History",
        searchHistory: "Search History",
    };
    let input = "";

    function updateVisibleItems() {
        let search = input.toLowerCase();
        let results = [];
        if (selectedCategory == categories.bookmarks) {
            results = bookmarks;
        } else if (selectedCategory == categories.tabs) {
            results = tabs;
        } else if (selectedCategory == categories.history) {
            results = history;
        } else if (selectedCategory == categories.searchHistory) {
            results = searchHistory;
        } else {
            results = [...bookmarks, ...tabs, ...history, ...searchHistory];
        }
        visibleItems = results.filter((item) =>
            item.title.toLowerCase().includes(search),
        );
    }

    function handleCategorySelect(category) {
        selectedCategory = category;
        updateVisibleItems();
    }
    function handleInputChange(input) {
        updateVisibleItems();
    }
</script>

<div class="add-view" class:incognito={config.incognito}>
    <div class="container">
        {#if input.length > 0}
            {#if visibleItems.length > 0}
                <div class="results">
                    {#each visibleItems as item (item.id)}
                        <div class="result-item">
                            {item.title}
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="empty-state">
                    <p>No results found</p>
                </div>
            {/if}
        {:else}
            <div class="recent-categories">
                <h3>Recent Categories</h3>
            </div>
        {/if}
    </div>
    {#if input.length > 0}
        <CategoryFilter
            bind:selectedCategory
            on:select={handleCategorySelect}
        />
    {/if}
    <InputField bind:input on:change={handleInputChange} />
    <OutputControls bind:config />
</div>

<style>
    .add-view {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #444;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        color: white;
    }

    .add-view.incognito {
        background-color: #222;
    }

    .container {
        flex-grow: 1;
        width: 100%;
    }
</style>
