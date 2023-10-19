<script>
	import OnionAxisX from "$components/onion/Onion.AxisX.svelte";
	import OnionAxisY from "$components/onion/Onion.AxisY.svelte";
	import Onion from "$components/onion/Onion.svelte";
	import OnionCuts from "$components/onion/Onion.Cuts.svelte";
	import OnionPieceAnalyzer from "$components/onion/Onion.PieceAnalyzer.svelte";
	import ButtonSet from "$components/helpers/ButtonSet.svelte";
	import Range from "$components/helpers/Range.svelte";
	import { formatPercentageAsNegative } from "$utils/math";
	import { get } from "svelte/store";
	import {
		width as widthStore,
		height as heightStore,
		radius as radiusStore,
		rScale as rScaleStore,
		numLayers as numLayersStore,
		numCuts
	} from "$stores/onion";

	// TODO move these gets to each component
	const width = get(widthStore);
	const height = get(heightStore);
	const radius = get(radiusStore);
	const rScale = get(rScaleStore);
	const numLayers = get(numLayersStore);

	let maxCuts = numLayers;
	let cutType = "vertical";
	const options = [{ value: "vertical" }, { value: "radial" }];
	let cutTargetDepthPercentage = 0;
</script>

<svg {width} {height} viewBox="{-width / 2} 0 {width} {height}">
	<!-- TODO should axes be rewritten w/layercake? -->
	<OnionAxisX {width} {height} />
	<OnionAxisX {width} {height} isBottom />
	<!-- TODO responsive sizing: move y axis when screen resizes -->
	<OnionAxisY {height} />

	<Onion {height} {numLayers} {rScale} />

	<OnionCuts {cutType} {height} {radius} {cutTargetDepthPercentage} />

	<OnionPieceAnalyzer />
</svg>

<div class="controls">
	<p>number of cuts: {$numCuts}</p>
	<Range min={1} max={maxCuts} label="number of cuts" bind:value={$numCuts} />

	<ButtonSet legend="cut type" {options} bind:value={cutType} />

	<div class:hidden={cutType !== "radial"}>
		<p>
			cut target height:
			{formatPercentageAsNegative(cutTargetDepthPercentage)} of outer radius
		</p>

		<Range
			min={0}
			max={1}
			step={0.01}
			bind:value={cutTargetDepthPercentage}
			label="cut target depth percentage"
		/>
	</div>
</div>

<style>
	svg {
		margin-bottom: 2rem;
	}

	:global(line) {
		stroke: black;
	}

	:global(.cuts line) {
		stroke-dasharray: 5;
	}

	.controls {
		width: 300px;
	}

	.hidden {
		visibility: hidden;
	}
</style>
