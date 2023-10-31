<script>
	import { numCuts, yScale } from "$stores/onion";
	import ALL_VERTICAL_AREAS from "$data/onion-piece-areas.json";

	// $: layerArcs = $layerRadii.map(
	// 	(layerRadius) => (x) =>
	// 		$yScale(Math.sqrt(layerRadius * layerRadius - x * x))
	// );

	$: pieceAreas = ALL_VERTICAL_AREAS[$numCuts];
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
