<script>
	import { getContext } from "svelte";

	export let layerNum;
	export let cutNum;
	export let highlight = false;
	export let primary = false;
	export let secondary = false;

	const onionStore = getContext("onionStore");
	$: ({ cutType, cutTargetDepthPercentage } = $onionStore);

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
	class:thin={secondary &&
		cutType === "radial" &&
		cutTargetDepthPercentage === 0}
/>

<style>
	path {
		fill: none;

		&.highlight {
			stroke-width: 4px;
		}

		&.thin {
			stroke-width: 2px;
		}
	}
</style>
