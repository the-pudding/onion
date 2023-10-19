<script>
	import { numLayers, rScale } from "$stores/onion";

	$: layerArcs = Array.from({ length: $numLayers }).map((_, i) => {
		const layerRadius = $rScale(i + 1);

		return (x) => Math.sqrt(layerRadius * layerRadius - x * x);
	});
</script>

{#each layerArcs as getYOnLayerArc}
	<!-- TODO flip y axis? to make drawing more straightforward -->
	<circle r="3" cy={getYOnLayerArc(0)} />
{/each}
