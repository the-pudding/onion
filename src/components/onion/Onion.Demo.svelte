<script>
	import OnionAxisX from "$components/onion/Onion.AxisX.svelte";
	import OnionAxisY from "$components/onion/Onion.AxisY.svelte";
	import Onion from "$components/onion/Onion.svelte";
	import OnionCuts from "$components/onion/Onion.Cuts.svelte";
	import OnionPieceAnalyzer from "$components/onion/Onion.PieceAnalyzer.svelte";
	import ButtonSet from "$components/helpers/ButtonSet.svelte";
	import Range from "$components/helpers/Range.svelte";
	import { formatPercentage } from "$utils/math";
	import { get } from "svelte/store";
	import {
		width as widthStore,
		height as heightStore,
		radius as radiusStore,
		numCuts,
		cutTargetDepthPercentage,
		numLayers,
		cutType,
		numHorizontalCuts
	} from "$stores/onion";

	export let showCuts = true;
	export let highlightExtremes = false;
	export let showControls = true;
	export let controlLayers = false;
	export let controlCutType = false;
	export let controlHorizontalCuts = false;
	export let captionId = undefined;

	// TODO move these gets to each component
	const width = get(widthStore);
	const height = get(heightStore);
	const radius = get(radiusStore);

	const options = [{ value: "vertical" }, { value: "radial" }];
</script>

<figure aria-describedby={captionId}>
	<svg {width} {height} viewBox="{-width / 2} 0 {width} {height}">
		<!-- TODO should axes be rewritten w/layercake? -->
		<OnionAxisX {width} {height} />
		<OnionAxisX {width} {height} isBottom />
		<!-- TODO responsive sizing: move y axis when screen resizes -->
		<OnionAxisY {height} />

		<Onion {height} />

		{#if showCuts}
			<OnionCuts {height} {radius} />
		{/if}

		<!-- TODO will need to adjust OnionPieceAnalyzer implementation to highlight pieces -->
		<!--   e.g., exploded view, small vs large pieces in vertical / 0-depth radial -->
		<OnionPieceAnalyzer {highlightExtremes} />
	</svg>

	{#if showControls}
		<div class="controls">
			{#if controlLayers}
				<p>number of layers: {$numLayers}</p>
				<Range
					min={7}
					max={13}
					label="number of layers"
					bind:value={$numLayers}
				/>
			{/if}

			<p>number of cuts: {$numCuts}</p>
			<Range min={1} max={10} label="number of cuts" bind:value={$numCuts} />

			{#if controlCutType}
				<ButtonSet legend="cut type" {options} bind:value={$cutType} />

				<div class:hidden={$cutType !== "radial"}>
					<p>
						cut target height:
						{formatPercentage(-$cutTargetDepthPercentage)} of outer radius
					</p>

					<Range
						min={0}
						max={1}
						step={0.01}
						bind:value={$cutTargetDepthPercentage}
						label="cut target depth percentage"
					/>
				</div>
			{/if}

			{#if controlHorizontalCuts}
				<p>horizontal cuts: {$numHorizontalCuts}</p>
				<Range
					min={0}
					max={2}
					label="horizontal cuts"
					bind:value={$numHorizontalCuts}
				/>
			{/if}
		</div>
	{/if}
</figure>

<style>
	svg {
		margin-bottom: 2rem;
	}

	:global(line) {
		stroke: black;
	}

	.controls {
		width: 300px;
	}

	.hidden {
		visibility: hidden;
	}
</style>
