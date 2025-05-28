<script>
	import { run } from "svelte/legacy";

	import { getContext, setContext } from "svelte";
	import { interpolateHcl, scaleLinear, scaleSequential } from "d3";
	import OnionPiece from "$components/onion/Onion.Piece.svelte";
	import { writable } from "svelte/store";
	import { EXPLODED_GAP } from "$utils/constants";
	import { compareRadialPieceAreasDescending } from "$utils/math";

	let { yScale, highlightExtremes } = $props();

	const onionStore = getContext("onionStore");
	let {
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
	} = $derived($onionStore);
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
			.sort(compareRadialPieceAreasDescending)
	);

	const explodeXScaleStore = writable();
	let minArea = $derived(
		cutType === "vertical"
			? verticalPieces.at(-1).pieceArea
			: radialPieces.at(-1).area
	);
	let maxArea = $derived(
		cutType === "vertical" ? verticalPieces[0].pieceArea : radialPieces[0].area
	);
	run(() => {
		minArea,
			maxArea,
			($explodeXScaleStore = scaleLinear()
				.domain([minArea, maxArea])
				.range([-radius, radius]));
	});
	setContext("explodeXScaleStore", explodeXScaleStore);

	const colorScaleStore = writable();
	let minStandardDeviations = $derived(
		(minArea - meanArea) / standardDeviation
	);
	let maxStandardDeviations = $derived(
		(maxArea - meanArea) / standardDeviation
	);
	// pieces with areas closer to average are more purple;
	//   pieces with areas further from average are more orange
	// TODO purple/orange are just placeholder colors
	run(() => {
		minStandardDeviations,
			maxStandardDeviations,
			($colorScaleStore = scaleSequential()
				.domain([
					0,
					Math.max(maxStandardDeviations, Math.abs(minStandardDeviations))
				])
				.interpolator(interpolateHcl("purple", "orange")));
	});
	setContext("colorScaleStore", colorScaleStore);

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];

	const svgWidth = getContext("width");
	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	// create a data structure arranges pieces in rows for exploded view
	// ^this will be mapped over in template--whether exploded or not--so that pieces animate smoothly
	let piecesLaidOut = $derived(
		(cutType === "vertical" ? verticalPieces : radialPieces).reduce(
			(rows, piece) => {
				const lastRow = rows[rows.length - 1];
				const layerNum =
					piece.layerNum ??
					piece.layerNumInColumn +
						layerRadii.findLastIndex((r) => r <= piece.cutX) +
						1;
				const layerPath = $layerPathStore[layerNum];
				const cutPath = $cutPathStore[piece.cutNum];
				const piecePath = layerPath.intersect(cutPath);
				const subPiecePath = piecePath.intersect(
					$horizontalCutPathStore[piece.subPieceIndex]
				);
				const { width, height } = (
					piece.subPieceIndex === undefined ? piecePath : subPiecePath
				).strokeBounds;
				// TODO should these dimensions be set in onion.js instead?
				piece.width = width;
				piece.height = height;
				piece.explodedX =
					width / 2 - piecePath.position.x - svgWidth / 2 + EXPLODED_GAP;

				const lastRowWidth = rows.length ? lastRow.explodedRowWidth : 0;
				const remainingWidth = svgWidth - lastRowWidth - EXPLODED_GAP;
				const additionalWidth = width + EXPLODED_GAP;

				// if there is enough width in the last row to fit this piece, add it
				if (rows.length && additionalWidth <= remainingWidth) {
					piece.explodedX += lastRowWidth;
					lastRow.pieces.push(piece);
					lastRow.explodedRowWidth += additionalWidth;
				} else {
					// otherwise, add it to a new row
					// but first, take note of the tallest piece in the last row; the new row will sit below it
					const tallestPieceHeight = lastRow
						? Math.max(...lastRow.pieces.map((p) => p.height))
						: 0;
					const explodedRowY = rows.length
						? rows.at(-1).explodedRowY + tallestPieceHeight + EXPLODED_GAP
						: EXPLODED_GAP;

					rows.push({
						pieces: [piece],
						explodedRowY,
						explodedRowWidth: additionalWidth
					});
				}

				return rows;
			},
			[]
		)
	);
</script>

<!-- TODO draw scale/ticks for exploded view? -->
{#each piecesLaidOut as { pieces, explodedRowY }}
	{#if cutType === "vertical"}
		{#each pieces as { pieceArea, subPieceIndex, cutX, cutNum, layerNumInColumn, explodedX }, index}
			{@const isInCenterColumn = cutNum === 0}
			{@const isBottomPiece = layerNumInColumn === 0}

			<OnionPiece
				{index}
				area={pieceArea}
				layerNum={layerNumInColumn +
					layerRadii.findLastIndex((r) => r <= cutX) +
					1}
				{cutNum}
				{subPieceIndex}
				highlight={highlightExtremes}
				primary={isInCenterColumn}
				secondary={isBottomPiece}
				{explodedX}
				explodedRowY={explodedRowY ?? 0}
			/>
		{/each}
	{:else if cutType === "radial"}
		{#each pieces as { area, subPieceIndex, cutNum, layerNum, numPieces, isInnermostLayer, isOutermostLayer, pieceNum, explodedX }, index}
			{@const isBottomPiece =
				cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

			<OnionPiece
				{index}
				{area}
				{layerNum}
				{cutNum}
				{subPieceIndex}
				highlight={highlightExtremes}
				primary={(cutTargetDepthPercentage === 0 && isOutermostLayer) ||
					isBottomPiece}
				secondary={cutTargetDepthPercentage === 0 && isInnermostLayer}
				{explodedX}
				explodedRowY={explodedRowY ?? 0}
			/>
		{/each}
	{/if}
{/each}
