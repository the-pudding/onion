<script>
	import { getContext } from "svelte";
	import getCopyObjectWithBooleans from "$utils/getCopyObjectWithBooleans";
	import OnionDemo from "$components/onion/Onion.Demo.svelte";
	import OnionReport from "./onion/Onion.Report.svelte";
	import Letters from "$components/Letters.svelte";

	const copy = getContext("copy");

	let w = $state();
</script>

<svelte:window bind:innerWidth={w} />

<div class="title">
	<h1>
		Dicing an
		<Letters string="ONION" height={w / 3.5} />
		the Mathematically Optimal Way
	</h1>

	<p class="authors">
		By {@html copy.author1}
		<br />
		<small>with {@html copy.author2} and {@html copy.author3}</small>
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
	.kenji {
		width: 100px;
		margin-top: -120px;
		margin-left: -120px;
		transform: rotate(-10deg);
	}
	.title {
		margin: 64px auto;
	}

	h1 {
		margin-top: 0;
		line-height: 1.125;
		font-size: clamp(38px, 7.5vw, 54px);
		font-family: var(--sans);
		font-weight: bold;
		text-align: center;
		font-style: italic;
	}

	.authors {
		margin-bottom: 0;
		font-family: var(--sans);
		font-size: var(--18px);
		text-align: center;
	}

	:global(.primary) {
		color: var(--onion-teal);
		stroke: var(--onion-teal) !important;
	}

	:global(.secondary:not(.primary)) {
		color: var(--onion-pink-dark);
		stroke: var(--onion-pink-dark) !important;
	}
</style>
