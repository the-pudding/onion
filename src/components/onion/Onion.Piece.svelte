<script>
	import { getContext } from "svelte";

	export let layerNum;
	export let cutNum;
	export let highlight = false;
	export let primary = false;
	export let secondary = false;

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
</script>

<path
	d={piecePath.pathData}
	class:highlight
	class:primary={highlight && primary}
	class:secondary={highlight && secondary}
/>

<style>
	path {
		fill: none;

		&.highlight {
			stroke-width: 4px;
		}
	}
</style>
