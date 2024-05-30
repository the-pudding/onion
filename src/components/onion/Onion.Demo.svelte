<script>
	import { writable } from "svelte/store";
	import { getContext, setContext } from "svelte";
	import { scaleLinear } from "d3";
	import paper from "paper";
	import Onion from "$utils/onion";
	import { formatPercentage, polarToCartesian } from "$utils/math";
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
	export let controlRadialDepth = false;
	export let controlHorizontalCuts = false;
	export let caption = "";
	export let cutType = "vertical";
	export let cutTargetDepthPercentage = 0;
	export let toggleExplode = false;
	export let showStandardDeviation = false;
	export let showRadialTarget = false;

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
	let explode = "off";

	// use paper without canvas
	// https://github.com/paperjs/paper.js/issues/1889#issuecomment-1323458006
	paper.setup(new paper.Size(1, 1));
	paper.view.autoUpdate = false;

	// onionStore is an instance of the Onion class, which is recreated whenever onion props change,
	//   specific to this instance of OnionDemo component
	// below, onionStore is stored in context so that child components can access up-to-date values
	// onion functions are written in the Onion class so that the generate-onion-data script can call them as well (not just Svelte components)
	const onionStore = writable(
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
	$: ({ cutTargetDepth } = $onionStore);

	// each layer path is a semi-annulus, except for the innermost layer which is a semi-disk
	const layerPathStore = writable([]);
	setContext("layerPathStore", layerPathStore);
	$: $layerPathStore = $onionStore.layerRadii.map((r) => {
		const { layerThickness } = $onionStore;
		const previousRadius = r - layerThickness;
		const d = [
			`M ${r} ${height}`,
			`A ${r} ${r} 0 0 0 ${-r} ${height}`,
			`H ${-previousRadius}`,
			`A ${previousRadius} ${previousRadius} 0 0 1 ${previousRadius} ${height}`,
			"z"
		].join(" ");

		return new paper.Path(d);
	});

	const cutPathStore = writable([]);
	setContext("cutPathStore", cutPathStore);
	$: $cutPathStore = $onionStore.cutNumbers.map((c, _, cutNumbers) => {
		let d;

		if (cutType === "vertical") {
			const { cutThickness } = $onionStore;
			const x = $onionStore.cutWidthScale(c);
			d = [
				`M ${x} ${height}`,
				"V 0",
				`h ${cutThickness}`,
				`V ${height}`,
				"z"
			].join(" ");
		}

		if (cutType === "radial") {
			// because cutAngleScale's range goes from PI/2 to 0 instead of the other way around,
			//   _c is the c's complementary index (counting from 0 to PI/2)
			const _c = cutNumbers.length - c;
			const theta = $onionStore.cutAngleScale(_c);
			const previousTheta = $onionStore.cutAngleScale(_c - 1);
			const [xIntercept, yIntercept] = polarToCartesian(radius, theta);
			const [previousXIntercept, previousYIntercept] = polarToCartesian(
				radius,
				previousTheta
			);
			d = [
				`M 0 ${yScale(-cutTargetDepth)}`,
				`L ${xIntercept * 2} ${yScale(yIntercept * 2 + cutTargetDepth)}`,
				`L ${previousXIntercept * 2} ${yScale(
					previousYIntercept * 2 + cutTargetDepth
				)}`,
				"z"
			].join(" ");
		}

		return new paper.Path(d);
	});

	const horizontalCutPathStore = writable([]);
	setContext("horizontalCutPathStore", horizontalCutPathStore);
	$: $horizontalCutPathStore = [
		// we need 2 paths if making 1 horizontal cut,
		//   and 3 paths if making 2 horizontal cuts
		...($onionStore.horizontalCutNumbers.length
			? [
					new paper.Path(
						[
							`M 0 ${yScale(radius)}`,
							`V ${yScale(
								$onionStore.horizontalCutScale(
									$onionStore.horizontalCutNumbers.length - 1
								) * radius
							)}`,
							`H ${radius}`,
							`V ${yScale(radius)}`,
							"z"
						].join(" ")
					)
			  ]
			: []),
		...$onionStore.horizontalCutNumbers.map((h) => {
			const y = $onionStore.horizontalCutScale(h) * radius;
			const yNormalized = yScale(y);
			const previousHeight = yScale(
				$onionStore.horizontalCutScale(h - 1) * radius
			);
			const d = [
				`M 0 ${previousHeight}`,
				`V ${yNormalized}`,
				`H ${radius}`,
				`V ${previousHeight}`,
				"z"
			].join(" ");

			return new paper.Path(d);
		})
	].reverse();

	const explodeStore = writable(explode === "on");
	setContext("explodeStore", explodeStore);
	$: $explodeStore = explode === "on";
</script>

<figure class:explode={explode === "on"}>
	{#if toggleExplode || showStandardDeviation}
		<div class="controls top">
			{#if toggleExplode}
				<Toggle label="explode" style="slider" bind:value={explode} />
			{/if}

			<!-- TODO are these multiline graphs more informative than a number printout? -->
			<!-- <h2>standard deviation in piece size</h2>

			<h3>radial cuts, from cut target depth 0-100% of onion radius</h3>
			<OnionRadialStandardDeviationGraph />

			<h3>vertical cuts</h3>
			<OnionStandardDeviationGraph /> -->
			{#if showStandardDeviation}
				<label class="standard-deviation">
					standard deviation
					<input
						type="number"
						readonly
						bind:value={$onionStore.standardDeviationString}
					/>
					%
				</label>
			{/if}
		</div>
	{/if}

	<svg
		viewBox="{-width / 2} 0 {width} {showRadialTarget
			? height * (5 / 3)
			: height}"
	>
		<!-- <OnionAxisX {width} {height} /> -->
		<OnionAxisX {width} {height} isBottom isHalfWidth={showRadialTarget} />
		<!-- TODO responsive sizing: move y axis when screen resizes -->
		<!-- <OnionAxisY {height} /> -->

		<OnionLayers {height} />

		{#if showCuts}
			<OnionCuts {width} {height} {yScale} />
		{/if}

		{#if showRadialTarget}
			<clipPath id="layer-mask">
				<rect {width} {height} x={-width / 2} />
			</clipPath>

			<circle
				r="10"
				cx="0"
				cy={yScale(-cutTargetDepth)}
				class="radial-target"
			/>
		{/if}

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

				<div class:hidden={!(cutType === "radial" && controlRadialDepth)}>
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

	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>

<style>
	:root {
		--demo-spacing-y: 1rem;
		--demo-spacing-x: 2rem;
		--axis-thickness: 2;
	}

	figure {
		margin-block: calc(var(--demo-spacing-y) * 4);
		padding-inline: var(--demo-spacing-x);
	}

	:global(line, circle) {
		stroke: black;
		transition: stroke 200ms;
	}

	:global(.explode :is(line, circle)) {
		stroke: transparent;
	}

	.radial-target {
		stroke: transparent;
		fill: red;
	}

	.controls {
		width: 350px;

		&.top {
			margin-bottom: var(--demo-spacing-y);

			& .standard-deviation {
				display: block;
			}
		}

		&.bottom {
			margin-top: var(--demo-spacing-y);
		}
	}

	.hidden {
		visibility: hidden;
	}
</style>
