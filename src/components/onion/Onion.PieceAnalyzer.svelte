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
	import { getRadialCutArea, polarToCartesian } from "$utils/math";

	export let cutType;
	export let cutTargetDepth;

	$: layerArcs = $layerRadii.map(
		(layerRadius) => (x) => Math.sqrt(layerRadius ** 2 - x ** 2)
	);

	$: pieceAreas =
		cutType === "vertical"
			? ALL_VERTICAL_AREAS[$numCuts]
			: // with radial cuts, pieceAreas is a 2D array whose major index corresponds to cutNumbers
			  // the minor index (for pieceSlice array) corresponds to piece index within a slice of pieces,
			  //   counted from the cut target outward
			  $cutNumbers.map((i) => ({
					cutAngle: $cutAngleScale(i),
					pieceSlice: []
			  }));

	// TODO move this to generate-onion-data.js
	// reactively calculate radial piece areas
	$: if (cutType === "radial" && cutTargetDepth === 0) {
		$cutNumbers.forEach((i) => {
			const { cutAngle, pieceSlice } = pieceAreas[i];

			$layerRadii.forEach((layerRadius, j) => {
				if (layerRadius > 0) {
					const nextCutAngle = $cutAngleScale(i + 1);
					const pieceArea = getRadialCutArea({
						...(j > 0 && { radius1: $layerRadii[j - 1] }),
						radius2: layerRadius,
						theta1: cutAngle,
						theta2: nextCutAngle
					});

					pieceSlice.push({ layerRadius, pieceArea });
				}
			});
		});
	}

	// TODO should layerRadii be `slice(1)`ed everywhere?
	$: pieceNums = $layerRadii.slice(1).map((layerRadius, layerNum) => {
		const layerArcFunction = layerArcs.slice(1)[layerNum];
		const xsOfIntersection = [0];

		$cutNumbers.slice(1).forEach((cutNum) => {
			const theta = $cutAngleScale(cutNum);
			const m =
				(cutTargetDepth + $radius * Math.sin(theta)) /
				($radius * Math.cos(theta));
			const cutLineFunction = (x) => m * x - cutTargetDepth;
			const discriminant =
				cutTargetDepth ** 2 * m ** 2 -
				(m ** 2 + 1) * (cutTargetDepth ** 2 - layerRadius ** 2);

			if (discriminant > 0) {
				// x is where layerArcFunction(x) === cutLineFunction(x) (quadratic formula)
				const x = (cutTargetDepth * m + Math.sqrt(discriminant)) / (m ** 2 + 1);

				if (x > 0 && cutLineFunction(x) > 0) {
					xsOfIntersection.push(x);
				}
			}
		});

		return { layerRadius, layerArcFunction, xsOfIntersection };
	});

	// $: console.log({ pieceNums });
	// $: console.log({ pieceAreas });
</script>

{#if cutType === "vertical"}
	{#each pieceAreas as { cutX, pieceColumn }}
		{#each pieceColumn as { layerRadius, pieceArea }}
			<text x={cutX} y={$yScale(layerRadius)}>{Math.round(pieceArea)}</text>
		{/each}
	{/each}

	<!-- plot points at each intersection of cut and layer boundary -->
	<!-- {#each $cutNumbers as i}
		{@const cutX = $cutWidthScale(i)}

		{#each layerArcs.filter((_, i) => $layerRadii[i] >= cutX) as getYOnLayerArc}
			{@const cutY = $yScale(getYOnLayerArc(cutX))}

			<circle r="3" cx={cutX} cy={cutY} />
		{/each}

		{#if !$layerRadii.includes(cutX)}
			<circle r="3" cx={cutX} cy={$yScale(0)} />
		{/if}
	{/each} -->
{:else if cutType === "radial"}
	<!-- counting piece numbers -->
	{#each pieceNums as { layerRadius, layerArcFunction, xsOfIntersection }}
		{@const numPieces = xsOfIntersection.length}

		<text x="-100" y={$yScale(layerRadius)} alignment-baseline="middle">
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		<!-- plot points at each intersection of cut and layer boundary -->
		<!-- {#each xsOfIntersection as x}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = $yScale(y)}

			<text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
			</text>
			<circle cx={x} cy={yNormalized} r="2" />
		{/each} -->
	{/each}

	{#if cutTargetDepth === 0}
		{#each pieceAreas as { cutAngle, pieceSlice }}
			{#each pieceSlice as { layerRadius, pieceArea }}
				{@const [x, y] = polarToCartesian(layerRadius, cutAngle)}

				<text {x} y={$yScale(y)}>{Math.round(pieceArea)}</text>
			{/each}
		{/each}
	{/if}
{/if}
