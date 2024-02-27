<script>
	import { deviation, mean } from "d3";
	import {
		cutTargetDepthPercentage,
		cutType,
		layerArcs,
		layerRadii,
		numCuts,
		storageKey,
		yScale
	} from "$stores/onion";
	import {
		flattenRadialAreas,
		flattenVerticalAreas,
		getRadialCutAreas,
		getVerticalAreas
	} from "$utils/math";

	export let highlightExtremes;

	let verticalPieceAreas, radialPieceAreas;

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];

	function calculateAreas() {
		if ($cutType === "vertical") {
			verticalPieceAreas = getVerticalAreas();
		} else if ($cutType === "radial") {
			radialPieceAreas = getRadialCutAreas();
		}
	}

	// re-calculate areas when controls change
	// ($storageKey is derived from control settings)
	$: $storageKey, calculateAreas();

	$: allAreas =
		$cutType === "vertical"
			? flattenVerticalAreas(verticalPieceAreas)
			: flattenRadialAreas(radialPieceAreas);

	$: standardDeviation = deviation(allAreas);

	// TODO generate graphs based on multiple parameters
	$: meanArea = mean(allAreas);
	$: console.log({
		$cutType,
		$numCuts,
		$cutTargetDepthPercentage,
		meanArea,
		standardDeviationPercentage: ((standardDeviation / meanArea) * 100).toFixed(
			2
		)
	});
</script>

{#if $cutType === "vertical"}
	{#each verticalPieceAreas as { cutX, pieceColumn }, cutNum}
		<!-- <text x={cutX} y={$yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text> -->

		{#each pieceColumn as { layerRadius, pieceArea, yRange, subPieces }, layerNum}
			<!-- {@debug pieceColumn} -->

			{@const layerArcFunction = $layerArcs.filter(
				(_, arcNum) => $layerRadii[arcNum] > cutX
			)[layerNum]}
			{@const y = layerArcFunction(cutX)}
			{@const cutY = $yScale(y)}

			<!-- <text x={cutX} y={cutY} font-size="xx-small">
				({Math.round(cutX)},{Math.round(y)})
			</text> -->
			<!-- <circle r="2" cx={cutX} cy={cutY} fill="red" />
			<text
				x={cutX}
				y={cutY}
				font-size="xx-small"
				alignment-baseline="hanging"
				fill={yRangeColors[subPieces.length]}
			>
				y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}]
				{subPieces.length ? JSON.stringify(subPieces.map(Math.round)) : ""}
			</text> -->

			{#if highlightExtremes}
				{@const isInCenterColumn = cutNum === 0}
				{@const isBottomPiece = layerNum === 0}

				{#if isInCenterColumn || isBottomPiece}
					<!-- TODO highlight piece outline instead of displaying area -->
					<text
						x={cutX}
						y={cutY}
						font-size="x-small"
						class:primary={isInCenterColumn}
						class:secondary={isBottomPiece}
					>
						{Math.round(pieceArea)}
					</text>
				{/if}
			{/if}
		{/each}
	{/each}
{:else if $cutType === "radial"}
	{#each radialPieceAreas as { layerRadius, pieces }, layerNum}
		{@const numPieces = pieces.length}

		<text
			x="-10"
			y={$yScale(layerRadius)}
			text-anchor="end"
			alignment-baseline="middle"
		>
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		{#each pieces as { xOfLeftCutIntersection, xRange, area, yRange, subPieces }}
			{@const x = xOfLeftCutIntersection}
			{@const layerArcFunction = $layerArcs[layerNum]}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = $yScale(y)}

			<!-- <text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
			</text> -->
			<text {x} y={yNormalized} font-size="x-small">
				{Math.round(area)}
			</text>

			<circle cx={x} cy={yNormalized} r="2" fill="red" />

			<text
				{x}
				y={yNormalized}
				font-size="xx-small"
				alignment-baseline="hanging"
				fill={yRangeColors[subPieces.length]}
			>
				<!-- y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}] -->
				{subPieces.length ? JSON.stringify(subPieces.map(Math.round)) : ""}
			</text>

			<!-- {@const markerY = $yScale(layerArcFunction(xOfLeftCutIntersection))} -->
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
	{/each}
{/if}
