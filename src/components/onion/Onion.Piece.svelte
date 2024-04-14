<script>
	import { getContext } from "svelte";

	export let layerNum;
	export let cutNum;

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
</script>

<path d={piecePath.pathData} />

<style>
	path {
		fill: none;
	}
</style>
