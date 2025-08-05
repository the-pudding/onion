<script>
	import { run } from "svelte/legacy";

	import { getContext, setContext } from "svelte";
	import { interpolateHcl, scaleLinear, scaleSequential } from "d3";
	import OnionPiece from "$components/onion/Onion.Piece.svelte";
	import { writable } from "svelte/store";
	import { EXPLODED_GAP } from "$utils/constants";
	import { compareRadialPieceAreasDescending } from "$utils/math";

	let {
		yScale,
		highlightExtremes,
		showRadialTarget,
		viewBoxHeight = $bindable()
	} = $props();

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
		(minArea,
			maxArea,
			($explodeXScaleStore = scaleLinear()
				.domain([minArea, maxArea])
				.range([-radius, radius])));
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
		(minStandardDeviations,
			maxStandardDeviations,
			($colorScaleStore = scaleSequential()
				.domain([
					0,
					Math.max(maxStandardDeviations, Math.abs(minStandardDeviations))
				])
				.interpolator(interpolateHcl("#2B7679", "#891555"))));
	});
	setContext("colorScaleStore", colorScaleStore);

	// y-range is blue if piece is intersected by only one horizontal cut
	// y-range is cyan if piece is intersected by both horizontal cuts
	const yRangeColors = ["black", undefined, "blue", "cyan"];

	const svgWidth = getContext("width");
	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");
	const explodeStore = getContext("explodeStore");

	// create a data structure arranges pieces in rows for exploded view
	// ^this will be mapped over in template--whether exploded or not--so that pieces animate smoothly
	let inlineLayoutPieces = $derived(
		(cutType === "vertical" ? verticalPieces : radialPieces).reduce(
			(rows, piece) => {
				const lastRow = rows[rows.length - 1];
				const layerNum =
					piece.layerNum ??
					piece.layerNumInColumn +
						layerRadii.findLastIndex((r) => r <= piece.cutX) +
						1;
				const isSubpiece = piece.subPieceIndex !== undefined;
				const layerPath = $layerPathStore[layerNum];
				const cutPath = $cutPathStore[piece.cutNum];
				const piecePath = layerPath.intersect(cutPath);
				const subPiecePath = piecePath.intersect(
					$horizontalCutPathStore[piece.subPieceIndex]
				);
				const ownPath = isSubpiece ? subPiecePath : piecePath;
				piece.path = ownPath;
				let { width, height } = ownPath.strokeBounds;
				// TODO should these dimensions be set in onion.js instead?
				piece.width = width;
				piece.height = height;
				piece.explodedX =
					width / 2 - ownPath.position.x - svgWidth / 2 + EXPLODED_GAP;

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

				let explodedY =
					height / 2 - ownPath.position.y + rows.at(-1).explodedRowY;

				// shift lower subpieces upward
				if (isSubpiece) {
					for (let i = piece.subPieceIndex; i < numHorizontalCuts; i++) {
						const upperSubPiecePath = ownPath.intersect(
							$horizontalCutPathStore[i + 1]
						);
						explodedY -= upperSubPiecePath.strokeBounds.height;
					}
				}

				piece.explodedY = explodedY;

				return rows;
			},
			[]
		)
	);

	// TODO might make more sense to set viewBoxHeight.target in OnionDemo,
	//   which would eliminate need for showRadialTarget prop here
	$effect(() => {
		// TODO import this value from constants file
		const defaultWidth = 300;

		viewBoxHeight.target = showRadialTarget
			? defaultWidth * (5 / 3)
			: $explodeStore
				? // increase viewBoxHeight to fit up to last row, including its tallest piece
					Math.max(
						inlineLayoutPieces.at(-1).explodedRowY +
							Math.max(
								...inlineLayoutPieces.at(-1).pieces.map((piece) => piece.height)
							) +
							EXPLODED_GAP,
						defaultWidth
					)
				: defaultWidth;
	});
</script>

<!-- TODO draw scale/ticks for exploded view? -->
{#each inlineLayoutPieces as { pieces, explodedRowY }}
	{#if cutType === "vertical"}
		{#each pieces as { path, pieceArea, subPieceIndex, cutX, cutNum, layerNumInColumn, explodedX, explodedY }}
			{@const isInCenterColumn = cutNum === 0}
			{@const isBottomPiece = layerNumInColumn === 0}

			<OnionPiece
				{path}
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
				{explodedY}
			/>
		{/each}
	{:else if cutType === "radial"}
		{#each pieces as { path, area, subPieceIndex, cutNum, layerNum, numPieces, isInnermostLayer, isOutermostLayer, pieceNum, explodedX, explodedY }}
			{@const isBottomPiece =
				cutTargetDepthPercentage !== 0 && pieceNum === numPieces - 1}

			<OnionPiece
				{path}
				{area}
				{layerNum}
				{cutNum}
				{subPieceIndex}
				highlight={highlightExtremes}
				primary={(cutTargetDepthPercentage === 0 && isOutermostLayer) ||
					isBottomPiece}
				secondary={cutTargetDepthPercentage === 0 && isInnermostLayer}
				{explodedX}
				{explodedY}
			/>
		{/each}
	{/if}
{/each}
