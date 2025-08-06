<script>
	import { run } from "svelte/legacy";

	import { writable } from "svelte/store";
	import { getContext, setContext } from "svelte";
	import { Tween } from "svelte/motion";
	import { scaleLinear } from "d3";
	import paper from "paper";
	import {
		MAX_CUTS,
		MAX_HORIZONTAL_CUTS,
		MAX_LAYERS,
		MIN_CUTS,
		MIN_HORIZONTAL_CUTS,
		MIN_LAYERS
	} from "$utils/constants";
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
	import Letters from "$components/Letters.svelte";

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [showCuts]
	 * @property {boolean} [highlightExtremes]
	 * @property {boolean} [showControls]
	 * @property {boolean} [controlLayers]
	 * @property {boolean} [controlCutType]
	 * @property {boolean} [controlRadialDepth]
	 * @property {boolean} [controlHorizontalCuts]
	 * @property {string} [cutType]
	 * @property {number} [cutTargetDepthPercentage]
	 * @property {boolean} [toggleExplode]
	 * @property {boolean} [showStandardDeviation]
	 * @property {boolean} [showRadialTarget]
	 */

	/** @type {Props} */
	let {
		showCuts = true,
		highlightExtremes = false,
		showControls = true,
		controlLayers = false,
		controlCutType = false,
		controlRadialDepth = false,
		controlHorizontalCuts = false,
		cutType = $bindable("vertical"),
		cutTargetDepthPercentage = $bindable(0),
		toggleExplode = false,
		showStandardDeviation = false,
		showRadialTarget = false,
		letters = undefined
	} = $props();
	const id = $props.id();
	let w = $state();

	const width = 600;
	setContext("width", width);
	const height = width / 2;
	const radius = height * 0.8;
	// SVG drawing is flipped upside down
	// need to use yScale function to normalize every linear (y = f(x)) function's output
	const yScale = scaleLinear().domain([0, height]).range([height, 0]);
	const options = [{ value: "vertical" }, { value: "radial" }];

	let numLayers = $state(10);
	let numCuts = $state(MAX_CUTS);
	let numHorizontalCuts = $state(MIN_HORIZONTAL_CUTS);
	let explode = $state("off");

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
	run(() => {
		$onionStore = new Onion({
			radius,
			numLayers,
			numCuts,
			cutType,
			cutTargetDepthPercentage,
			numHorizontalCuts
		});
	});
	let { cutTargetDepth } = $derived($onionStore);

	// each layer path is a semi-annulus, except for the innermost layer which is a semi-disk
	const layerPathStore = writable([]);
	setContext("layerPathStore", layerPathStore);
	run(() => {
		$layerPathStore = $onionStore.layerRadii.map((r) => {
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
	});

	const cutPathStore = writable([]);
	setContext("cutPathStore", cutPathStore);
	run(() => {
		$cutPathStore = $onionStore.cutNumbers.map((c, _, cutNumbers) => {
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
	});

	const horizontalCutPathStore = writable([]);
	setContext("horizontalCutPathStore", horizontalCutPathStore);
	run(() => {
		$horizontalCutPathStore = [
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
	});

	const explodeStore = writable(explode === "on");
	setContext("explodeStore", explodeStore);
	run(() => {
		$explodeStore = explode === "on";
	});

	let viewBoxHeight = $state(new Tween(height));

	const rsdBuckets = getContext("rsdBuckets");
	let rsdRating = $derived.by(() => {
		if ($onionStore.standardDeviation < rsdBuckets.q1) {
			return "excellent uniformity";
		} else if ($onionStore.standardDeviation < rsdBuckets.median) {
			return "good uniformity";
		} else if ($onionStore.standardDeviation < rsdBuckets.q3) {
			return "fair uniformity";
		} else {
			return "poor uniformity";
		}
	});
</script>

<svelte:window bind:innerWidth={w} />

{#if letters !== undefined}
	<Letters string={letters} height={w/8} space={"extra"} />
{/if}
<figure class:explode={explode === "on"}>
	{#if toggleExplode || showStandardDeviation}
		<div class="controls top">
			<!-- TODO are these multiline graphs more informative than a number printout? -->
			<!-- <h2>standard deviation in piece size</h2>

			<h3>radial cuts, from cut target depth 0-100% of onion radius</h3>
			<OnionRadialStandardDeviationGraph />

			<h3>vertical cuts</h3>
			<OnionStandardDeviationGraph /> -->
			<div class="top-left">
				<div class="showhide" class:visible={toggleExplode}>
					<Toggle label="explode" style="slider" bind:value={explode} />
				</div>
			</div>

			<div class="top-right">
				<div class="showhide" class:visible={showStandardDeviation}>
					<div class="std-dev-rating">
						<span class="rating {rsdRating.replace(/ /g, '')}">{rsdRating}</span>
					</div>
				</div>
				<div class="showhide" class:visible={showStandardDeviation}>
					<div class="standard-deviation-info">
						<span>std dev:</span>
						<span>{$onionStore.standardDeviationString}%</span>

						<div>
							<!-- <meter
								value={$onionStore.standardDeviation}
								min={rsdBuckets.min}
								max={rsdBuckets.max}
								low={rsdBuckets.q1}
								high={rsdBuckets.q3}
								optimum={rsdBuckets.min}
								id="{id}-meter"
							>
								{$onionStore.standardDeviationString}%
							</meter> -->
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if showControls}
		<div class="controls bottom">
			<div class="left">
				{#if controlLayers}
					<div class="control-unit">
						<span class="label">Layers</span>
						<Range
							min={MIN_LAYERS}
							max={MAX_LAYERS}
							label="number of layers"
							bind:value={numLayers}
						/>
						<span class="output">{numLayers}</span>
					</div>
				{/if}

				<div class="control-unit">
					<span class="label">Cuts (vertical)</span>
					<Range
						min={MIN_CUTS}
						max={MAX_CUTS}
						label="number of cuts"
						bind:value={numCuts}
					/>
					<span class="output">{numCuts}</span>
				</div>

				{#if controlHorizontalCuts}
					<div class="control-unit">
						<!-- <p>horizontal cuts</p> -->
						<span class="label">Cuts (horiz.)</span>
						<Range
							min={MIN_HORIZONTAL_CUTS}
							max={MAX_HORIZONTAL_CUTS}
							label="horizontal cuts"
							bind:value={numHorizontalCuts}
						/>
						<!-- <p>{numHorizontalCuts}</p> -->
						<span class="output">{numHorizontalCuts}</span>
					</div>
				{/if}
			</div>

			<div class="right">
				{#if controlCutType}
					<div class="control-unit">
						<ButtonSet legend="cut type" {options} bind:value={cutType} />
					</div>
				{/if}

				{#if controlCutType}
					<div class:hidden={!(cutType === "radial" && controlRadialDepth)}>
						<div class="control-unit">
							<!-- <p>cut target height</p> -->
							<span class="label">target height</span>

							<Range
								min={0}
								max={1}
								step={0.01}
								bind:value={cutTargetDepthPercentage}
								label="cut target depth percentage"
							/>
							<span class="output"
								>{formatPercentage(-cutTargetDepthPercentage)}</span
							>
						</div>
					</div>{/if}
			</div>
		</div>
	{/if}

	<svg viewBox="{-width / 2} 0 {width} {viewBoxHeight.current}">
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

		{#key $onionStore}
			<OnionPieceAnalyzer
				{yScale}
				{highlightExtremes}
				{showRadialTarget}
				bind:viewBoxHeight
			/>
		{/key}
	</svg>
</figure>

<style>
	figure {
		margin-block: calc(var(--demo-spacing-y) * 4);
		margin-top: calc(var(--demo-spacing-y) * 2);
		padding-inline: var(--demo-spacing-x);
		font-family: var(--sans);
	}

	figure * {
		font-size: var(--12px);
		text-transform: uppercase;
	}

	:global(line, circle) {
		stroke: var(--onion-dark);
		transition: stroke var(--duration-fade) var(--duration-transform);
	}

	:global(.explode :is(line, circle)) {
		stroke: transparent;
		transition: stroke var(--duration-fade);
	}

	.radial-target {
		stroke: transparent;
		fill: var(--color-primary);
	}

	.controls {
		&.top {
			margin-bottom: var(--demo-spacing-y);
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			/* background: var(--onion-yellow-light);
			border-radius: 4px; */
			font-weight: 700;
			border-bottom: 1px solid var(--onion-dark);
		}

		&.bottom {
			margin-top: calc(var(--demo-spacing-y) * 1);
			margin-bottom: var(--demo-spacing-y);
			display: flex;
			justify-content: space-between;
		}
	}

	.standard-deviation-info {
		width: 9em;
		text-align: right;

		> span:nth-of-type(2) {
			display: inline-block;
			width: 3.6em;
		}
	}

	.hidden {
		visibility: hidden;
	}

	span.rating {
		font-weight: bold;
		padding: 6px 8px;
		border-radius: 4px;
		height: 2.75em;
		display: inline-block;
		line-height: 1.6;
	}

	span.pooruniformity {
		background: var(--onion-pink-dark);
		color: var(--onion-cream);
	}

	span.fairuniformity {
		background: #723a80;
		color: var(--onion-cream);
	}

	span.gooduniformity {
		background: #196693;
		color: var(--onion-cream);
	}

	span.excellentuniformity {
		background: var(--onion-teal);
		color: var(--onion-cream);
	}

	.control-unit {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
	}

	.control-unit span {
		line-height: 1;
		display: inline-block;
	}

	.showhide {
		visibility: hidden;
	}

	.showhide.visible {
		visibility: visible;
	}

	.top-left {
		width: 33%;
	}

	.top-right {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 66%;
	}

	.left,
	.right {
		width: 50%;
	}

	.left {
		padding-right: 8px;
	}

	.right {
		padding-left: 8px;
		transform: translateY(-8px);
	}

	.right .control-unit {
		justify-content: flex-end;
	}
	span.label {
		margin-right: 8px;
		font-weight: 700;
	}

	.left span.output {
		display: inline-block;
		margin-left: 8px;
		font-weight: 700;
		width: 1rem;
	}

	.right span.output {
		display: inline-block;
		margin-left: 8px;
		width: 5.5em;
		text-align: right;
	}

	.left .label {
		width: 9em;
		/* text-align: right; */
	}

	@media(max-width: 620px) {
		.bottom {
			flex-direction: column;
		}
		.left, .right {
			width: 100%;
		}
		.right {
			padding: 1rem 0 0 0;
		}
		.right .control-unit {
			justify-content: flex-start;
		}
	}

	@media(max-width: 500px) {
		.controls {
			&.top {
				flex-direction: column;
				justify-content: flex-start;
				gap: 0.25rem;
			}
		}
		.top-left, .top-right {
			width: 100%;
		}
	}
</style>
