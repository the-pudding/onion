<script>
	import { getVerticalCutArea } from "$utils/math";
	import { cutNumbers, cutWidthScale, layerRadii, yScale } from "$stores/onion";

	$: layerArcs = $layerRadii.map(
		(layerRadius) => (x) =>
			$yScale(Math.sqrt(layerRadius * layerRadius - x * x))
	);
</script>

<!-- calculate area of each piece -->
{#each $cutNumbers as i}
	{@const cutX = $cutWidthScale(i)}

	{#each $layerRadii as layerRadius}
		{#if layerRadius > cutX}
			{@const nextCutX = $cutWidthScale(i + 1)}
			{@const pieceArea = getVerticalCutArea(layerRadius, cutX, nextCutX)}

			<!-- TODO to get piece areas for each layer, need to subtract piece area of layer(s) below -->

			<!-- TODO instead of writing text, store this data in a variable (or a file?) -->
			<text x={cutX} y={$yScale(layerRadius)}>{Math.trunc(pieceArea)}</text>
		{/if}
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
