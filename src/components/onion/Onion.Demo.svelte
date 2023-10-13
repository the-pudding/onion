<script>
	import { format, scaleLinear } from "d3";
	import OnionAxisX from "$components/onion/Onion.AxisX.svelte";
	import OnionAxisY from "$components/onion/Onion.AxisY.svelte";
	import Onion from "$components/onion/Onion.svelte";
	import OnionCuts from "$components/onion/Onion.Cuts.svelte";
	import ButtonSet from "$components/helpers/ButtonSet.svelte";
	import Range from "$components/helpers/Range.svelte";

	let width = 600;
	let height = width / 2;
	let numLayers = 10;
	let maxCuts = numLayers;
	let numCuts = maxCuts;
	let cutType = "vertical";
	const options = [{ value: "vertical" }, { value: "radial" }];
	let cutTargetDepthPercentage = 0;
	let debug = false;

	if (debug) {
		numLayers = 1;
		numCuts = 1;
	}

	const radiusPercentage = 0.8; // proportional to graph height
	const radius = height * radiusPercentage;

	const rScale = scaleLinear().domain([0, numLayers]).range([0, radius]);

	function formatPercentageAsNegative(n) {
		return format(".0%")(-n);
	}

	// TODO move this math into external JS file
	let verticalCutThickness = radius;
	// TODO for a single vertical cut (i.e., cutting the onion half in half),
	//   quarterOnionArea = integral of circle height from 0 to r, dx (in first quadrant)
	//   https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/28c569c5d8e79b7e1a2be1755de42d25_MIT18_01SCF10_Ses70a.pdf
	//   the expression used for quarterOnionArea here is an antiderivative F(x), and will need to have limits of integration applied as in F(b) - F(a)
	//     right now F(x) is F(verticalCutThickness) - F(0)
	$: quarterOnionArea =
		(radius * radius * Math.asin(verticalCutThickness / radius) +
			verticalCutThickness *
				Math.sqrt(
					radius * radius - verticalCutThickness * verticalCutThickness
				)) /
		2;
	$: console.log({ quarterOnionArea });
	$: console.log("quarterOnionArea should be", (Math.PI * radius * radius) / 4);
</script>

<svg {width} {height} viewBox="{-width / 2} 0 {width} {height}">
	<!-- TODO should axes be rewritten w/layercake? -->
	<OnionAxisX {width} {height} />
	<OnionAxisX {width} {height} isBottom />
	<!-- TODO responsive sizing: move y axis when screen resizes -->
	<OnionAxisY {height} />

	<Onion {height} {numLayers} {rScale} />

	<OnionCuts {cutType} {numCuts} {height} {radius} {cutTargetDepthPercentage} />
</svg>

<div class="controls">
	<p>number of cuts: {numCuts}</p>
	<Range min={1} max={maxCuts} label="number of cuts" bind:value={numCuts} />

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
