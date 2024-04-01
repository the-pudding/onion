<script>
	import { getContext } from "svelte";
	import getCopyObjectWithBooleans from "$utils/getCopyObjectWithBooleans";
	import OnionDemo from "$components/onion/Onion.Demo.svelte";

	const copy = getContext("copy");
</script>

<h1>{copy.hed}</h1>

<div class="authors">
	<span>By {@html copy.author1}</span>
	<span>With {@html copy.author2}</span>
</div>

{#each copy.story as { type, value }, i}
	{#if type === "Component"}
		<OnionDemo {...getCopyObjectWithBooleans(value)} />
	{:else}
		<p class={type}>{@html value}</p>
	{/if}
{/each}

<style>
	.authors {
		display: flex;
		flex-direction: column;
		align-items: center;

		& > :first-child {
			font-size: var(--24px);
		}

		& > :last-child {
			font-size: var(--16px);
		}
	}

	:global(.primary) {
		color: var(--color-primary);
		stroke: var(--color-primary);
	}

	:global(.secondary:not(.primary)) {
		color: var(--color-secondary);
		stroke: var(--color-secondary);
	}
</style>
