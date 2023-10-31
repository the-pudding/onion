<script>
	import { getVerticalCutArea } from "$utils/math";
	import { cutNumbers, cutWidthScale, layerRadii, yScale } from "$stores/onion";

	// $: layerArcs = $layerRadii.map(
	// 	(layerRadius) => (x) =>
	// 		$yScale(Math.sqrt(layerRadius * layerRadius - x * x))
	// );

	// TODO load all pieceAreas from $data

	// pieceAreas is a 2D array whose major index corresponds to cutNumbers
	// the minor index (for pieceColumn array) corresponds to piece index within a column of pieces,
	//   counted from the bottom upward
	$: pieceAreas = $cutNumbers.map((i) => ({
		cutX: $cutWidthScale(i),
		pieceColumn: []
	}));

	// reactively calculate piece areas
	$: {
		$cutNumbers.forEach((i) => {
			const { cutX, pieceColumn } = pieceAreas[i];

			$layerRadii.forEach((layerRadius) => {
				if (layerRadius > cutX) {
					const nextCutX = $cutWidthScale(i + 1);
					const verticalCutArea = getVerticalCutArea(
						layerRadius,
						cutX,
						nextCutX
					);
					const pieceArea = pieceColumn.length
						? verticalCutArea - pieceColumn.at(-1).verticalCutArea
						: verticalCutArea;

					pieceColumn.push({ layerRadius, verticalCutArea, pieceArea });
				}
			});
		});

		console.log({ pieceAreas });
	}
</script>

{#each pieceAreas as { cutX, pieceColumn }}
	{#each pieceColumn as { layerRadius, pieceArea }}
		<text x={cutX} y={$yScale(layerRadius)}>{Math.trunc(pieceArea)}</text>
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
