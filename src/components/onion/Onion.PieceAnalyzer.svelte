<script>
	import { getContext } from "svelte";
	import OnionPiece from "$components/onion/Onion.Piece.svelte";

	export let yScale;
	export let highlightExtremes;

	const onionStore = getContext("onionStore");
	$: ({
		cutTargetDepthPercentage,
		cutType,
		layerArcs,
		layerRadii,
		numHorizontalCuts,
		verticalAreas,
		radialAreas
	} = $onionStore);
	// TODO refactor to use flattenVerticalAreas/flattenRadialAreas?
	$: verticalPieces = verticalAreas
		.map(({ cutX, pieceColumn }, cutNum) =>
			pieceColumn.map((piece, layerNumInColumn) => ({
				...piece,
				cutX,
				cutNum,
				layerNumInColumn
			}))
		)
		.flat(2);
	$: radialPieces = radialAreas
		.map(({ layerRadius, pieces }, layerNum) =>
			pieces.map((piece) => ({ ...piece, layerRadius, layerNum }))
		)
		.flat(2);

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];
</script>

{#if cutType === "vertical"}
	{#each verticalPieces as { layerRadius, pieceArea, yRange, subPieces, cutX, cutNum, layerNumInColumn }}
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
			layerNum={layerNumInColumn +
				layerRadii.findLastIndex((r) => r <= cutX) +
				1}
			{cutNum}
			{subPieces}
			highlight={highlightExtremes}
			primary={isInCenterColumn}
			secondary={isBottomPiece}
		/>
	{/each}
{:else if cutType === "radial"}
	{#each radialAreas as { layerRadius, pieces }, layerNum}
		{@const numPieces = pieces.length}
		{@const isInnermostLayer = layerNum === 0}
		{@const isOutermostLayer = layerNum === radialAreas.length - 1}

		<!-- <text
			x="-10"
			y={yScale(layerRadius)}
			text-anchor="end"
			alignment-baseline="middle"
		>
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text> -->

		{#each pieces as { xOfLeftCutIntersection, xRange, area, yRange, subPieces, cutNum }, pieceNum}
			{@const x = xOfLeftCutIntersection}
			{@const layerArcFunction = layerArcs[layerNum]}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = yScale(y)}
			{@const isBottomPiece =
				cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

			<OnionPiece
				{layerNum}
				{cutNum}
				{subPieces}
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
	{/each}
{/if}
