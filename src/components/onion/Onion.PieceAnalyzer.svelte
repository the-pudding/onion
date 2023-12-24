<script>
	import {
		cutAngleScale,
		cutNumbers,
		cutWidthScale,
		layerRadii,
		numCuts,
		radius,
		yScale
	} from "$stores/onion";
	import ALL_VERTICAL_AREAS from "$data/onion-piece-areas.json";
	import {
		getAreaUnderLine,
		getRadialCutArea,
		getVerticalCutArea,
		polarToCartesian
	} from "$utils/math";

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
			  $layerRadii.map(() => []);

	// TODO move this to generate-onion-data.js
	// reactively calculate radial piece areas
	$: if (cutType === "radial" && cutTargetDepth === 0) {
		$layerRadii.forEach((layerRadius, layerNum) => {
			const layerWithPieces = pieceAreas[layerNum];

			$cutNumbers.forEach((cutNum) => {
				const cutAngle = $cutAngleScale(cutNum);

				if (layerRadius > 0) {
					const nextCutAngle = $cutAngleScale(cutNum + 1);
					const pieceArea = getRadialCutArea({
						...(layerNum > 0 && { radius1: $layerRadii[layerNum - 1] }),
						radius2: layerRadius,
						theta1: cutAngle,
						theta2: nextCutAngle
					});

					layerWithPieces.push({ cutAngle, pieceArea });
				}
			});
		});
	}

	// layerPieceData is a variable specific to this component (Onion.PieceAnalyzer), separate from pieceAreas,
	//   used to graphically debug/verify values
	// count total number of pieces for each layer
	// TODO should layerRadii be `slice(1)`ed everywhere?
	$: layerPieceData = $layerRadii.slice(1).map((layerRadius, layerNum) => {
		const layerArcFunction = layerArcs.slice(1)[layerNum];
		const pieces = [{ xOfLeftCutIntersection: 0 }];

		// $cutNumbers is reversed so that we can count cuts from vertical towards horizontal
		// TODO selectively reversing like this is likely to cause issues later
		$cutNumbers
			.slice(1)
			.reverse()
			.forEach((cutNum) => {
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

	// calculate areas for each piece
	$: layerPieceData.forEach((layerWithPieces, layerNum, layers) => {
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
			// TODO write this area to pieceAreas
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

	// $: console.log({ layerPieceData });
	// $: console.log({ pieceAreas });
</script>

{#if cutType === "vertical"}
	{#each pieceAreas as { cutX, pieceColumn }}
		{#each pieceColumn as { layerRadius, pieceArea }}
			<text x={cutX} y={$yScale(layerRadius)}>{Math.round(pieceArea)}</text>
		{/each}
	{/each}

	<!-- plot points at each intersection of cut and layer boundary -->
	<!-- {#each $cutNumbers as cutNum}
		{@const cutX = $cutWidthScale(cutNum)}

		{#each layerArcs.filter((_, layerNum) => $layerRadii[layerNum] >= cutX) as getYOnLayerArc}
			{@const cutY = $yScale(getYOnLayerArc(cutX))}

			<circle r="3" cx={cutX} cy={cutY} />
		{/each}

		{#if !$layerRadii.includes(cutX)}
			<circle r="3" cx={cutX} cy={$yScale(0)} />
		{/if}
	{/each} -->
{:else if cutType === "radial"}
	<!-- counting piece numbers -->
	{#each layerPieceData as { layerRadius, layerArcFunction, pieces }}
		{@const numPieces = pieces.length}

		<text x="-100" y={$yScale(layerRadius)} alignment-baseline="middle">
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		<!-- plot points at each intersection of cut and layer boundary -->
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

			<!-- {@debug pieces} -->

			<!-- <text
				{x}
				y={$yScale(0 + pieceNum * 5)}
				font-size="x-small"
				class="x-range"
			>
				[{Math.round(xRange[0])}, {Math.round(xRange[1])}]
			</text> -->
			{@const markerY = $yScale(layerArcFunction(xOfLeftCutIntersection))}

			<!-- <line
				x1={xRange[0]}
				y1={markerY}
				x2={xRange[1]}
				y2={markerY}
				font-size="x-small"
				class="x-range-marker"
			/> -->
		{/each}
	{/each}

	<!-- {#if cutTargetDepth === 0}
		{#each pieceAreas as layerWithPieces, layerNum}
			{@const layerRadius = $layerRadii[layerNum]}

			{#each layerWithPieces as { cutAngle, area }}
				{@const [x, y] = polarToCartesian(layerRadius, cutAngle)}

				<text {x} y={$yScale(y)} class="area-label">{Math.round(area)}</text>
			{/each}
		{/each}
	{/if} -->
{/if}

<style>
	/*.x-range-marker {
		stroke: red;
		stroke-width: 2;
	}*/
</style>
