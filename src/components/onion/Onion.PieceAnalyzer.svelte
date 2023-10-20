<script>
	import { cutNumbers, cutWidthScale, layerRadii, yScale } from "$stores/onion";

	$: layerArcs = $layerRadii.map(
		(layerRadius) => (x) =>
			$yScale(Math.sqrt(layerRadius * layerRadius - x * x))
	);
</script>

{#each $cutNumbers as i}
	{@const cutX = $cutWidthScale(i)}

	{#each layerArcs.filter((_, i) => $layerRadii[i] >= cutX) as getYOnLayerArc}
		{@const cutY = getYOnLayerArc(cutX)}

		<circle r="3" cx={cutX} cy={cutY} />
	{/each}

	{#if !$layerRadii.includes(cutX)}
		<circle r="3" cx={cutX} cy={$yScale(0)} />
	{/if}
{/each}
