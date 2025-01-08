<script>
	import { getContext, setContext } from "svelte";
	import { interpolateHcl, scaleLinear, scaleSequential } from "d3";
	import OnionPiece from "$components/onion/Onion.Piece.svelte";
	import { writable } from "svelte/store";

	export let yScale;
	export let highlightExtremes;

	const onionStore = getContext("onionStore");
	$: ({
		radius,
		cutTargetDepthPercentage,
		cutType,
		layerArcs,
		layerRadii,
		numHorizontalCuts,
		verticalAreas,
		radialAreas,
		meanArea,
		standardDeviation
	} = $onionStore);
	$: verticalPieces = verticalAreas
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
		.sort((a, b) => b.pieceArea - a.pieceArea);
	$: radialPieces = radialAreas
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
							pieceArea: subPieceArea,
							subPieceIndex: horizontalCutPathNum
					  }))
					: pieceForSVG;
			})
		)
		.sort((a, b) => b.area - a.area);

	const explodeXScaleStore = writable();
	$: minArea =
		cutType === "vertical"
			? verticalPieces.at(-1).pieceArea
			: radialPieces.at(-1).area;
	$: maxArea =
		cutType === "vertical" ? verticalPieces[0].pieceArea : radialPieces[0].area;
	$: minArea,
		maxArea,
		($explodeXScaleStore = scaleLinear()
			.domain([minArea, maxArea])
			.range([-radius, radius]));
	setContext("explodeXScaleStore", explodeXScaleStore);

	const colorScaleStore = writable();
	$: minStandardDeviations = (minArea - meanArea) / standardDeviation;
	$: maxStandardDeviations = (maxArea - meanArea) / standardDeviation;
	// pieces with areas closer to average are more purple;
	//   pieces with areas further from average are more orange
	// TODO purple/orange are just placeholder colors
	$: minStandardDeviations,
		maxStandardDeviations,
		($colorScaleStore = scaleSequential()
			.domain([
				0,
				Math.max(maxStandardDeviations, Math.abs(minStandardDeviations))
			])
			.interpolator(interpolateHcl("purple", "orange")));
	setContext("colorScaleStore", colorScaleStore);

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];
</script>

<!-- TODO draw scale/ticks for exploded view? -->
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

		<OnionPiece
			area={pieceArea}
			layerNum={layerNumInColumn +
				layerRadii.findLastIndex((r) => r <= cutX) +
				1}
			{cutNum}
			{subPieceIndex}
			highlight={highlightExtremes}
			primary={isInCenterColumn}
			secondary={isBottomPiece}
		/>
	{/each}
{:else if cutType === "radial"}
	{#each radialPieces as { xOfLeftCutIntersection, xRange, area, yRange, subPieceIndex, cutNum, layerRadius, layerNum, numPieces, isInnermostLayer, isOutermostLayer, pieceNum }}
		{@const x = xOfLeftCutIntersection}
		{@const layerArcFunction = layerArcs[layerNum]}
		{@const y = layerArcFunction(x)}
		{@const yNormalized = yScale(y)}
		{@const isBottomPiece =
			cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

		<OnionPiece
			{area}
			{layerNum}
			{cutNum}
			{subPieceIndex}
			highlight={highlightExtremes}
			primary={(cutTargetDepthPercentage === 0 && isOutermostLayer) ||
				isBottomPiece}
			secondary={cutTargetDepthPercentage === 0 && isInnermostLayer}
		/>

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
