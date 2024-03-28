<script>
	import { writable } from "svelte/store";
	import { setContext } from "svelte";
	import { scaleLinear } from "d3";
	import Onion from "$utils/onion";
	import { formatPercentage } from "$utils/math";
	import OnionAxisX from "$components/onion/Onion.AxisX.svelte";
	import OnionAxisY from "$components/onion/Onion.AxisY.svelte";
	import OnionLayers from "$components/onion/OnionLayers.svelte";
	import OnionCuts from "$components/onion/Onion.Cuts.svelte";
	import OnionPieceAnalyzer from "$components/onion/Onion.PieceAnalyzer.svelte";
	import ButtonSet from "$components/helpers/ButtonSet.svelte";
	import Range from "$components/helpers/Range.svelte";
	import Toggle from "$components/helpers/Toggle.svelte";

	export let showCuts = true;
	export let highlightExtremes = false;
	export let showControls = true;
	export let controlLayers = false;
	export let controlCutType = false;
	export let controlHorizontalCuts = false;
	export let captionId = undefined;
	export let cutType = "vertical";
	export let cutTargetDepthPercentage = 0;
	export let toggleExplode = false;
	export let showStandardDeviation = false;

	const width = 600;
	const height = width / 2;
	const radius = height * 0.8;
	// SVG drawing is flipped upside down
	// need to use yScale function to normalize every linear (y = f(x)) function's output
	const yScale = scaleLinear().domain([0, height]).range([height, 0]);
	const options = [{ value: "vertical" }, { value: "radial" }];

	let numLayers = 10;
	let numCuts = 10;
	let numHorizontalCuts = 0;
	let explode = false;

	// onionStore is an instance of the Onion class, which is recreated whenever onion props change,
	//   specific to this instance of OnionDemo component
	// below, onionStore is stored in context so that child components can access up-to-date values
	// onion functions are written in the Onion class so that the generate-onion-data script can call them as well (not just Svelte components)
	let onionStore = writable(
		new Onion({
			radius,
			numLayers,
			numCuts,
			cutType,
			cutTargetDepthPercentage,
			numHorizontalCuts
		})
	);

	setContext("onionStore", onionStore);

	$: $onionStore = new Onion({
		radius,
		numLayers,
		numCuts,
		cutType,
		cutTargetDepthPercentage,
		numHorizontalCuts
	});
</script>

<figure aria-describedby={captionId}>
	{#if toggleExplode || showStandardDeviation}
		<div class="controls top">
			{#if toggleExplode}
				<Toggle label="explode" style="slider" bind:value={explode} />
			{/if}

			{#if showStandardDeviation}
				<label class="standard-deviation">
					standard deviation
					<!-- TODO bind std dev to value in onion.js -->
					<input type="number" readonly />
				</label>
			{/if}
		</div>
	{/if}

	<!-- TODO show exploded view -->
	<svg {width} {height} viewBox="{-width / 2} 0 {width} {height}">
		<!-- TODO should axes be rewritten w/layercake? -->
		<OnionAxisX {width} {height} />
		<OnionAxisX {width} {height} isBottom />
		<!-- TODO responsive sizing: move y axis when screen resizes -->
		<OnionAxisY {height} />

		<OnionLayers {height} />

		{#if showCuts}
			<OnionCuts {width} {height} {yScale} />
		{/if}

		<!-- TODO will need to adjust OnionPieceAnalyzer implementation to highlight pieces -->
		<!--   e.g., exploded view, small vs large pieces in vertical / 0-depth radial -->
		<OnionPieceAnalyzer {yScale} {highlightExtremes} />
	</svg>

	{#if showControls}
		<div class="controls bottom">
			{#if controlLayers}
				<p>number of layers: {numLayers}</p>
				<Range
					min={7}
					max={13}
					label="number of layers"
					bind:value={numLayers}
				/>
			{/if}

			<p>number of cuts: {numCuts}</p>
			<Range min={1} max={10} label="number of cuts" bind:value={numCuts} />

			{#if controlCutType}
				<ButtonSet legend="cut type" {options} bind:value={cutType} />

				<div class:hidden={cutType !== "radial"}>
					<p>
						cut target height:
						{formatPercentage(-cutTargetDepthPercentage)} of outer radius
					</p>

					<Range
						min={0}
						max={1}
						step={0.01}
						bind:value={cutTargetDepthPercentage}
						label="cut target depth percentage"
					/>
				</div>
			{/if}

			{#if controlHorizontalCuts}
				<p>horizontal cuts: {numHorizontalCuts}</p>
				<Range
					min={0}
					max={2}
					label="horizontal cuts"
					bind:value={numHorizontalCuts}
				/>
			{/if}
		</div>
	{/if}
</figure>

<style>
	:root {
		--demo-spacing: 1rem;
	}

	figure {
		margin-block: calc(var(--demo-spacing) * 2);
	}

	:global(line) {
		stroke: black;
	}

	.controls {
		width: 350px;

		&.top {
			margin-bottom: var(--demo-spacing);

			& .standard-deviation {
				display: block;
			}
		}

		&.bottom {
			margin-top: var(--demo-spacing);
		}
	}

	.hidden {
		visibility: hidden;
	}
</style>
