<script>
	import { getContext } from "svelte";

	export let layerNum;
	export let cutNum;
	export let subPieces;
	export let highlight = false;
	export let primary = false;
	export let secondary = false;

	const onionStore = getContext("onionStore");
	$: ({ cutType, cutTargetDepthPercentage } = $onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
	$: subPiecePaths = $horizontalCutPathStore.map((horizontalCutPath) =>
		piecePath.intersect(horizontalCutPath)
	);
</script>

{#if subPieces.length}
	{#each subPiecePaths as subPiecePath}
		<path d={subPiecePath.pathData} class="subpiece" />
	{/each}
{:else}
	<path
		d={piecePath.pathData}
		class:highlight
		class:primary={highlight && primary}
		class:secondary={highlight && secondary}
		class:thin={secondary &&
			cutType === "radial" &&
			cutTargetDepthPercentage === 0}
	/>
{/if}

<style>
	path {
		fill: none;
		transition: stroke 200ms 200ms;

		&.highlight {
			stroke-width: 4px;
		}

		&.thin {
			stroke-width: 2px;
		}

		&.subpiece {
			stroke: blue;
			stroke-width: 2px;
		}
	}

	:global(figure.explode path) {
		stroke: black;
	}
</style>
