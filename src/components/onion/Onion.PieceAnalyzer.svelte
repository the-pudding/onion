<script>
	import {
		cutAngleScale,
		cutNumbers,
		cutWidthScale,
		layerRadii,
		numCuts,
		yScale
	} from "$stores/onion";
	import ALL_VERTICAL_AREAS from "$data/onion-piece-areas.json";
	import {
		getRadialCutArea,
		getVerticalCutArea,
		polarToCartesian
	} from "$utils/math";

	// $: layerArcs = $layerRadii.map(
	// 	(layerRadius) => (x) =>
	// 		$yScale(Math.sqrt(layerRadius ** 2 - x ** 2))
	// );

	// TODO uncomment vertical
	// $: pieceAreas = ALL_VERTICAL_AREAS[$numCuts];

	// pieceAreas is a 2D array whose major index corresponds to cutNumbers
	// the minor index (for pieceSlice array) corresponds to piece index within a slice of pieces,
	//   counted from the cut target outward
	$: pieceAreas = $cutNumbers.map((i) => ({
		cutAngle: $cutAngleScale(i),
		pieceSlice: []
	}));

	// TODO move this to generate-onion-data.js
	// reactively calculate piece areas
	$: {
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

		console.log({ pieceAreas });
	}
</script>

<!-- TODO uncomment vertical -->
<!-- {#each pieceAreas as { cutX, pieceColumn }}
	{#each pieceColumn as { layerRadius, pieceArea }}
		<text x={cutX} y={$yScale(layerRadius)}>{Math.trunc(pieceArea)}</text>
	{/each}
{/each} -->

<!-- radial -->
{#each pieceAreas as { cutAngle, pieceSlice }}
	{#each pieceSlice as { layerRadius, pieceArea }}
		{@const [x, y] = polarToCartesian(layerRadius, cutAngle)}

		<text {x} y={$yScale(y)}>{Math.trunc(pieceArea)}</text>
	{/each}
{/each}

<!-- plot points at each intersection of cut and layer boundary -->
<!-- {#each $cutNumbers as i}
	{@const cutX = $cutWidthScale(i)}

	{#each layerArcs.filter((_, i) => $layerRadii[i] >= cutX) as getYOnLayerArc}
		{@const cutY = getYOnLayerArc(cutX)}

		<circle r="3" cx={cutX} cy={cutY} />
	{/each}

	{#if !$layerRadii.includes(cutX)}
		<circle r="3" cx={cutX} cy={$yScale(0)} />
	{/if} 
{/each} -->
