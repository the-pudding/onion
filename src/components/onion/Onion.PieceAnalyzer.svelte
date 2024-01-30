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
		getRadialCutAreas,
		getVerticalAreas
	} from "$utils/math";
	import localStorage from "$utils/localStorage";

	let verticalPieceAreas, radialPieceAreas;

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];

	$: readOrCalculateAreas = (areaFunction) => {
		let areas = localStorage.get($storageKey);

		if (!areas) {
			areas = areaFunction();
			localStorage.set($storageKey, areas);
		}

		return areas;
	};

	$: if ($cutType === "vertical") {
		verticalPieceAreas = readOrCalculateAreas(getVerticalAreas);
	} else if ($cutType === "radial") {
		radialPieceAreas = readOrCalculateAreas(getRadialCutAreas);
	}

	$: allAreas =
		$cutType === "vertical"
			? // TODO account for subpieces from horizontal cuts
			  verticalPieceAreas
					.map(({ pieceColumn }) =>
						pieceColumn.map(({ pieceArea, subPieces }) =>
							subPieces.length ? subPieces : pieceArea
						)
					)
					.flat(2)
			: // TODO account for subpieces from horizontal cuts
			  flattenRadialAreas(radialPieceAreas);

	$: console.log({ allAreas });
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
	{#each verticalPieceAreas as { cutX, pieceColumn }}
		<text x={cutX} y={$yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text>

		{#each pieceColumn as { layerRadius, pieceArea, yRange, subPieces }, layerNum}
			<!-- {@debug pieceColumn} -->

			{@const layerArcFunction = $layerArcs.filter(
				(_, arcNum) => $layerRadii[arcNum] > cutX
			)[layerNum]}
			{@const y = layerArcFunction(cutX)}
			{@const cutY = $yScale(y)}

			<text x={cutX} y={cutY} font-size="x-small">
				{Math.round(pieceArea)}
			</text>

			<!-- <text x={cutX} y={cutY} font-size="xx-small">
				({Math.round(cutX)},{Math.round(y)})
			</text> -->
			<circle r="2" cx={cutX} cy={cutY} fill="red" />
			<text
				x={cutX}
				y={cutY}
				font-size="xx-small"
				alignment-baseline="hanging"
				fill={yRangeColors[subPieces.length]}
			>
				<!-- y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}] -->
				{subPieces.length ? JSON.stringify(subPieces.map(Math.round)) : ""}
			</text>
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

			<text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
			</text>
			<!-- <text {x} y={yNormalized} font-size="x-small">
				{Math.round(area)}
			</text> -->

			<circle cx={x} cy={yNormalized} r="2" fill="red" />

			<text
				{x}
				y={yNormalized}
				font-size="xx-small"
				alignment-baseline="hanging"
				fill={yRangeColors[subPieces]}
			>
				y &isin; [{Math.round(yRange[0])},{Math.round(yRange[1])}]
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
