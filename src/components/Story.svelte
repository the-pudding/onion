<script>
	import { getContext } from "svelte";
	import getCopyObjectWithBooleans from "$utils/getCopyObjectWithBooleans";
	import OnionDemo from "$components/onion/Onion.Demo.svelte";
	import OnionReport from "./onion/Onion.Report.svelte";

	const copy = getContext("copy");
</script>

<div class="title">
	<h1>{copy.hed}</h1>

	<p class="authors">
		<span>By {@html copy.author1}</span> <span>with {@html copy.author2}</span>
	</p>
</div>

{#each copy.story as { type, value }, i}
	{#if type === "Component"}
		<OnionDemo {...getCopyObjectWithBooleans(value)} />
	{:else if type === "Report"}
		<OnionReport />
	{:else if type === "image"}
		{@const { src, alt } = value}
		<img {src} {alt} />
	{:else if type === "list"}
		<ul>
			{#each value as item}
				<li>{@html item}</li>
			{/each}
		</ul>
	{:else}
		<p class={type}>{@html value}</p>
	{/if}
{/each}

<style>
	.title {
		margin: 64px auto;
	}

	h1 {
		margin-top: 0;
		line-height: 1.125;
		font-size: clamp(38px, 7.5vw, 62px);
		font-family: var(--sans);
		font-weight: bold;
	}

	.authors {
		margin-bottom: 0;
	}

	:global(.primary) {
		color: var(--color-primary);
		stroke: var(--color-primary) !important;
	}

	:global(.secondary:not(.primary)) {
		color: var(--color-secondary);
		stroke: var(--color-secondary) !important;
	}
</style>
