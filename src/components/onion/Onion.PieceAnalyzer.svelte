<script>
	import {
		cutAngleScale,
		cutNumbers,
		layerRadii,
		numCuts,
		radius,
		yScale
	} from "$stores/onion";
	import ALL_VERTICAL_AREAS from "$data/onion-piece-areas.json";
	import { getAreaUnderLine, getVerticalCutArea } from "$utils/math";

	export let cutType;
	export let cutTargetDepth;

	function getSlope(cutNum) {
		const theta = $cutAngleScale(cutNum);

		return (
			(cutTargetDepth + $radius * Math.sin(theta)) / ($radius * Math.cos(theta))
		);
	}

	function getCutLineFunction(slope) {
		return (x) => slope * x - cutTargetDepth;
	}

	$: layerArcs = $layerRadii.map(
		(layerRadius) => (x) => Math.sqrt(layerRadius ** 2 - x ** 2)
	);

	$: pieceAreas =
		cutType === "vertical"
			? ALL_VERTICAL_AREAS[$numCuts]
			: // with radial cuts, pieceAreas is a 2D array whose major index corresponds to layer number
			  // the minor index corresponds to piece number
			  // first, count total number of pieces for each layer
			  $layerRadii.map((layerRadius, layerNum) => {
					const layerArcFunction = layerArcs[layerNum];
					const pieces = [];

					$cutNumbers.forEach((cutNum) => {
						const m = getSlope(cutNum);
						const cutLineFunction = getCutLineFunction(m);
						const discriminant =
							cutTargetDepth ** 2 * m ** 2 -
							(m ** 2 + 1) * (cutTargetDepth ** 2 - layerRadius ** 2);

						if (discriminant > 0) {
							// x is where layerArcFunction(x) === cutLineFunction(x) (quadratic formula)
							const x =
								(cutTargetDepth * m + Math.sqrt(discriminant)) / (m ** 2 + 1);

							if (x > 0 && cutLineFunction(x) > 0) {
								pieces.push({
									xOfLeftCutIntersection: x,
									leftCutLineSlope: m
								});
							}
						}
					});

					return { layerRadius, layerArcFunction, pieces };
			  });

	// after each layer's pieces are counted,
	// calculate areas for each piece
	$: if (cutType === "radial") {
		pieceAreas.forEach((layerWithPieces, layerNum, layers) => {
			const isFirstLayer = layerNum === 0;
			const previousLayer = layers[layerNum - 1];

			layerWithPieces.pieces.forEach((piece, pieceNum, pieces) => {
				const isFirstPiece = pieceNum === 0;
				const isLastPiece = pieceNum === pieces.length - 1;
				const { leftCutLineSlope, xOfLeftCutIntersection } = piece;
				const xRange = [undefined, undefined];

				function getXLowerBound(_pieceNum) {
					const xWhereLeftCutIntersectsPreviousLayer =
						previousLayer?.pieces[_pieceNum]?.xOfLeftCutIntersection;
					const xWhereLeftCutIntersectsCuttingBoard =
						cutTargetDepth / pieces[_pieceNum]?.leftCutLineSlope;

					return (
						xWhereLeftCutIntersectsPreviousLayer ??
						xWhereLeftCutIntersectsCuttingBoard
					);
				}

				// find piece's x range
				xRange[0] = xOfLeftCutIntersection;
				xRange[1] = isLastPiece
					? layerWithPieces.layerRadius
					: pieces[pieceNum + 1].xOfLeftCutIntersection;

				if (!isFirstPiece) {
					xRange[0] = getXLowerBound(pieceNum);
				}

				piece.xRange = xRange;

				// calculate piece's area by adding/subtracting integrals
				let area = getVerticalCutArea(
					layerWithPieces.layerRadius,
					piece.xOfLeftCutIntersection,
					xRange[1]
				);

				// add left cut's integral
				if (!isFirstPiece) {
					area += getAreaUnderLine({
						slope: leftCutLineSlope,
						yIntercept: -cutTargetDepth,
						x1: xRange[0],
						x2: xOfLeftCutIntersection
					});
				}

				// subtract right cut's integral
				if (!isLastPiece) {
					const xOfRightCutIntersectionWithPreviousLayer = getXLowerBound(
						pieceNum + 1
					);

					area -= getAreaUnderLine({
						slope: pieces[pieceNum + 1].leftCutLineSlope,
						yIntercept: -cutTargetDepth,
						x1: xOfRightCutIntersectionWithPreviousLayer,
						x2: xRange[1]
					});
				}

				// subtract previous layer's vertical cut
				const xOfLeftCutIntersectionWithPreviousLayer =
					previousLayer?.pieces[pieceNum]?.xRange[1];
				const hasPieceBelowInSlice =
					!isFirstLayer && xOfLeftCutIntersectionWithPreviousLayer > xRange[0];

				if (hasPieceBelowInSlice) {
					area -= getVerticalCutArea(
						previousLayer.layerRadius,
						previousLayer.pieces[pieceNum]?.xOfLeftCutIntersection,
						xOfLeftCutIntersectionWithPreviousLayer
					);
				}

				piece.area = area;
			});
		});
	}

	// $: console.log({ pieceAreas });
</script>

{#if cutType === "vertical"}
	{#each pieceAreas as { cutX, pieceColumn }}
		<text x={cutX} y={$yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text>

		{#each pieceColumn as { layerRadius, pieceArea }, layerNum}
			{@const getYOnLayerArc = layerArcs.filter(
				(_, arcNum) => $layerRadii[arcNum] > cutX
			)[layerNum]}
			{@const cutY = $yScale(getYOnLayerArc(cutX))}

			<text x={cutX} y={cutY} font-size="x-small">
				{Math.round(pieceArea)}
			</text>

			<circle r="2" cx={cutX} cy={cutY} />
		{/each}
	{/each}
{:else if cutType === "radial"}
	{#each pieceAreas as { layerRadius, layerArcFunction, pieces }}
		{@const numPieces = pieces.length}

		<text
			x="-10"
			y={$yScale(layerRadius)}
			text-anchor="end"
			alignment-baseline="middle"
		>
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		{#each pieces as { xOfLeftCutIntersection, xRange, area }, pieceNum}
			{@const x = xOfLeftCutIntersection}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = $yScale(y)}

			<!-- <text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
			</text> -->
			<text {x} y={yNormalized} font-size="x-small">
				{Math.round(area)}
			</text>

			<circle cx={x} cy={yNormalized} r="2" />

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
