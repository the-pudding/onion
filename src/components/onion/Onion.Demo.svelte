<script>
	import { run } from "svelte/legacy";

	import { writable } from "svelte/store";
	import { setContext } from "svelte";
	import { interpolateHcl, scaleLinear, scaleSequential } from "d3";
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
	import OnionPiece from "$components/onion/Onion.Piece.svelte";
	import ButtonSet from "$components/helpers/ButtonSet.svelte";
	import Range from "$components/helpers/Range.svelte";
	import Toggle from "$components/helpers/Toggle.svelte";

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [showCuts]
	 * @property {boolean} [highlightExtremes]
	 * @property {boolean} [showControls]
	 * @property {boolean} [controlLayers]
	 * @property {boolean} [controlCutType]
	 * @property {boolean} [controlRadialDepth]
	 * @property {boolean} [controlHorizontalCuts]
	 * @property {string} [caption]
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
		caption = "",
		cutType = $bindable("vertical"),
		cutTargetDepthPercentage = $bindable(0),
		toggleExplode = false,
		showStandardDeviation = false,
		showRadialTarget = false
	} = $props();

	const width = 600;
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
	let {
		cutTargetDepth,
		layerArcs,
		layerRadii,
		verticalAreas,
		radialAreas,
		meanArea,
		standardDeviation
	} = $derived($onionStore);

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

	let verticalPieces = $derived(
		verticalAreas
			.flatMap(({ cutX, pieceColumn }, cutNum) =>
				pieceColumn.flatMap((piece, layerNumInColumn) => {
					const pieceForSVG = {
						...piece,
						cutX,
						cutNum,
						layerNumInColumn
					};

					return piece.subPieces.length
						? piece.subPieces.map(({ subPieceArea, horizontalCutPathNum }) => ({
								...pieceForSVG,
								pieceArea: subPieceArea,
								subPieceIndex: horizontalCutPathNum
						  }))
						: pieceForSVG;
				})
			)
			.sort((a, b) => b.pieceArea - a.pieceArea)
	);
	let radialPieces = $derived(
		radialAreas
			.flatMap(({ layerRadius, pieces }, layerNum) =>
				pieces.flatMap((piece, pieceNum) => {
					const pieceForSVG = {
						...piece,
						layerRadius,
						layerNum,
						numPieces: pieces.length,
						isInnermostLayer: layerNum === 0,
						isOutermostLayer: layerNum === radialAreas.length - 1,
						pieceNum
					};

					return piece.subPieces.length
						? piece.subPieces.map(({ subPieceArea, horizontalCutPathNum }) => ({
								...pieceForSVG,
								area: subPieceArea,
								subPieceIndex: horizontalCutPathNum
						  }))
						: pieceForSVG;
				})
			)
			.sort((a, b) => b.area - a.area)
	);

	let minArea = $derived(
		cutType === "vertical"
			? verticalPieces.at(-1).pieceArea
			: radialPieces.at(-1).area
	);
	let maxArea = $derived(
		cutType === "vertical" ? verticalPieces[0].pieceArea : radialPieces[0].area
	);
	let minStandardDeviations = $derived(
		(minArea - meanArea) / standardDeviation
	);
	let maxStandardDeviations = $derived(
		(maxArea - meanArea) / standardDeviation
	);
	let colorScale = scaleSequential()
		.domain([
			0,
			Math.max(maxStandardDeviations, Math.abs(minStandardDeviations))
		])
		.interpolator(interpolateHcl("purple", "orange"));
</script>

<!-- TODO delete Onion.PieceAnalyzer.svelte -->
{#snippet pieceAnalyzer()}
	{#if cutType === "vertical"}
		{#each verticalPieces as { layerRadius, pieceArea, yRange, subPieceIndex, cutX, cutNum, layerNumInColumn }}
			{@const isInCenterColumn = cutNum === 0}
			{@const isBottomPiece = layerNumInColumn === 0}
			{@const columnArcFunctions = layerArcs.filter(
				(_, arcNum) => layerRadii[arcNum] > cutX
			)}
			{@const layerArcFunction =
				columnArcFunctions[layerNumInColumn] ?? columnArcFunctions[0]}
			{@const y = layerArcFunction(cutX)}
			{@const cutY = yScale(y)}

			<!-- <text x={cutX} y={cutY} font-size="xx-small">
			({Math.round(cutX)},{Math.round(y)})
		</text> -->
			<!-- <circle r="2" cx={cutX} cy={cutY} fill="red" /> -->

			<!-- {#if numHorizontalCuts && subPieces.length}
			<text
				x={cutX}
				y={cutY}
				font-size="xx-small"
				alignment-baseline="hanging"
				fill={yRangeColors[subPieces.length]}
			>
				y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}]
				{JSON.stringify(subPieces.map(Math.round))}
			</text>
		{/if} -->

			{@render piece({
				area: pieceArea,
				layerNum:
					layerNumInColumn + layerRadii.findLastIndex((r) => r <= cutX) + 1,
				cutNum,
				subPieceIndex,
				highlight: highlightExtremes,
				primary: isInCenterColumn,
				secondary: isBottomPiece
			})}
		{/each}
	{:else if cutType === "radial"}
		{#each radialPieces as { xOfLeftCutIntersection, xRange, area, yRange, subPieceIndex, cutNum, layerRadius, layerNum, numPieces, isInnermostLayer, isOutermostLayer, pieceNum }}
			{@const x = xOfLeftCutIntersection}
			{@const layerArcFunction = layerArcs[layerNum]}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = yScale(y)}
			{@const isBottomPiece =
				cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

			{@render piece({
				area,
				layerNum,
				cutNum,
				subPieceIndex,
				highlight: highlightExtremes,
				primary:
					(cutTargetDepthPercentage === 0 && isOutermostLayer) || isBottomPiece,
				secondary: cutTargetDepthPercentage === 0 && isInnermostLayer
			})}

			<!-- <text {x} y={yNormalized} font-size="x-small">
		({Math.round(x)}, {Math.round(y)})
		</text> -->
			<!-- <text {x} y={yNormalized} font-size="x-small">
		{Math.round(area)}
	</text> -->

			<!-- <circle cx={x} cy={yNormalized} r="2" fill="red" /> -->

			<!-- {#if numHorizontalCuts && subPieces.length}
		<text
			{x}
			y={yNormalized}
			font-size="xx-small"
			alignment-baseline="hanging"
			fill={yRangeColors[subPieces.length]}
		>
			y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}]
			{JSON.stringify(subPieces.map(Math.round))}
		</text>
	{/if} -->

			<!-- {@const markerY = yScale(layerArcFunction(xOfLeftCutIntersection))} -->
			<!-- <text {x} y={markerY} font-size="x-small">
		[{Math.round(xRange[0])}, {Math.round(xRange[1])}]
	</text> -->

			<!-- <line
		x1={xRange[0]}
		y1={markerY}
		x2={xRange[1]}
		y2={markerY}
		stroke-width="2"
		style="stroke: red"
	/> -->
		{/each}
	{/if}
{/snippet}

<!-- TODO delete Onion.Piece.svelte -->
{#snippet piece({
	area,
	layerNum,
	cutNum,
	subPieceIndex = undefined,
	highlight = false,
	primary = false,
	secondary = false
})}
	{@const subpiece = subPieceIndex !== undefined}
	{@const svgPadding = 1}
	{@const layerPath = $layerPathStore[layerNum]}
	{@const cutPath = $cutPathStore[cutNum]}
	{@const piecePath = layerPath.intersect(cutPath)}
	{@const subPiecePath = piecePath.intersect(
		$horizontalCutPathStore[subPieceIndex]
	)}
	{@const { width, height } = piecePath.strokeBounds}
	{@const d = (subpiece ? subPiecePath : piecePath).pathData}

	<!-- TODO can we prevent highlighted pieces next to y-axis from being truncated on the left? -->
	<!--   (involves setting viewBox when $explodeStore === false) -->
	<!--   (requires us to manually position each piece's SVG element) -->
	<svg
		viewBox={$explodeStore
			? `${-svgPadding} ${-svgPadding} ${width + 2 * svgPadding} ${
					height + 2 * svgPadding
			  }`
			: undefined}
		width={$explodeStore ? width : undefined}
	>
		<!-- {#if subpiece}
		{@debug piecePath, subPiecePath, d, area}
	{/if} -->
		<path
			{d}
			style={$explodeStore
				? `stroke: ${colorScale(
						Math.abs(area - meanArea) / standardDeviation
				  )}; transform: translate(${width / 2 - piecePath.position.x}px, ${
						height / 2 - piecePath.position.y
				  }px)`
				: undefined}
			class:highlight
			class:primary={highlight && primary}
			class:secondary={highlight && secondary}
			class:thin={!$explodeStore &&
				secondary &&
				cutType === "radial" &&
				cutTargetDepthPercentage === 0}
			class:subpiece
			data-area={area}
		/>
	</svg>
{/snippet}

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

	{#if explode === "off"}
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

			{#key $onionStore}
				{@render pieceAnalyzer()}
			{/key}
		</svg>
	{:else if explode === "on"}
		{#key $onionStore}
			{@render pieceAnalyzer()}
		{/key}
	{/if}

	{#if showControls}
		<div class="controls bottom">
			{#if controlLayers}
				<p>number of layers: {numLayers}</p>
				<Range
					min={MIN_LAYERS}
					max={MAX_LAYERS}
					label="number of layers"
					bind:value={numLayers}
				/>
			{/if}

			<p>number of cuts: {numCuts}</p>
			<Range
				min={MIN_CUTS}
				max={MAX_CUTS}
				label="number of cuts"
				bind:value={numCuts}
			/>

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
					min={MIN_HORIZONTAL_CUTS}
					max={MAX_HORIZONTAL_CUTS}
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

	path {
		fill: none;
		stroke: transparent;
		transition:
			stroke 200ms 200ms,
			transform 200ms;

		&.highlight {
			stroke-width: 4px;
		}

		&.thin {
			stroke-width: 2px;
		}

		&.subpiece {
			stroke: blue;
		}
	}

	:global(figure:not(.explode) .subpiece) {
		stroke-width: 2px;
	}

	:global(figure.explode path) {
		stroke: black;
		transition:
			stroke 200ms,
			transform 200ms;
	}
</style>
