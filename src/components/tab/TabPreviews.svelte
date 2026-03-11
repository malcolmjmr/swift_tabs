<script>
	import {
		tabStore,
		currentWindowTabs,
		activeTabId,
	} from "../../stores/tabStore";
	import { onMount } from "svelte";
	onMount(() => {
		tabStore.init();
	});

	function handleClick(tab) {
		tabStore.activateTab(tab.id);
	}

	function handleKeyDown(event, tab) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			tabStore.activateTab(tab.id);
		}
	}
</script>

<div class="tab-previews">
	{#each $currentWindowTabs as tab (tab.id)}
		<div
			class="tab-preview"
			class:active={tab.id === $activeTabId}
			on:click={() => handleClick(tab)}
			on:keydown={(e) => handleKeyDown(e, tab)}
		>
			<div class="tab-preview-icon">
				{#if tab.favIconUrl}
					<img src={tab.favIconUrl} alt="" />
				{:else}
					<span class="favicon-fallback" title={tab.title}>
						{tab.title ? tab.title.charAt(0).toUpperCase() : "?"}
					</span>
				{/if}
			</div>
			<span class="tab-preview-title">{tab.title || "Untitled"}</span>
		</div>
	{/each}
</div>

<style>
	.tab-previews {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tab-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 80px;
		width: 50px;
		min-width: 0;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: #333;
		color: white;
		cursor: pointer;
		text-align: center;
		transition:
			background 0.15s,
			box-shadow 0.15s;
	}

	.tab-preview:hover {
		background: var(--preview-bg-hover, #3a3a3e);
	}

	.tab-preview:focus-visible {
		outline: 2px solid #555;
		outline-offset: 2px;
	}

	.tab-preview.active {
		background: #555;
		color: var(--preview-fg-active, #fff);
	}

	.tab-preview-icon {
		flex-shrink: 0;
		width: 15px;
		height: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tab-preview-icon img {
		width: 15px;
		height: 15px;
		object-fit: contain;
	}

	.favicon-fallback {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		background: var(--preview-fallback-bg, #505055);
		border-radius: 4px;
		color: inherit;
	}

	.tab-preview-title {
		font-size: 12px;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		max-lines: 3;
		max-width: 100%;
	}
</style>
