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
		verticalAreas,
		radialAreas
	} = $onionStore);

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];
</script>

{#if cutType === "vertical"}
	{#each verticalAreas as { cutX, pieceColumn }, cutNum}
		<!-- <text x={cutX} y={yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text> -->

		{#each pieceColumn as { layerRadius, pieceArea, yRange, subPieces }, layerNumInColumn}
			<!-- {@debug pieceColumn} -->
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

			<OnionPiece
				layerNum={layerNumInColumn +
					layerRadii.findLastIndex((r) => r <= cutX) +
					1}
				{cutNum}
				highlight={highlightExtremes}
				primary={highlightExtremes && isInCenterColumn}
				secondary={highlightExtremes && isBottomPiece}
			/>
		{/each}
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

		{#each pieces as { xOfLeftCutIntersection, xRange, area, yRange, subPieces }, pieceNum}
			{@const x = xOfLeftCutIntersection}
			{@const layerArcFunction = layerArcs[layerNum]}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = yScale(y)}
			{@const isBottomPiece =
				cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

			{#if highlightExtremes && ((cutTargetDepthPercentage === 0 && (isInnermostLayer || isOutermostLayer)) || isBottomPiece)}
				<!-- <text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
				</text> -->
				<!-- TODO highlight piece outline instead of displaying area -->
				<text
					{x}
					y={yNormalized}
					font-size="x-small"
					class:primary={isOutermostLayer || isBottomPiece}
					class:secondary={isInnermostLayer}
				>
					{Math.round(area)}
				</text>
			{/if}

			<!-- <circle cx={x} cy={yNormalized} r="2" fill="red" /> -->

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
