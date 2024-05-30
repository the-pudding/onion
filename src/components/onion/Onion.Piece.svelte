<script>
	import { getContext } from "svelte";

	export let area;
	export let layerNum;
	export let cutNum;
	export let subPieces;
	export let highlight = false;
	export let primary = false;
	export let secondary = false;

	const onionStore = getContext("onionStore");
	$: ({
		radius,
		cutType,
		cutTargetDepthPercentage,
		meanArea,
		standardDeviation
	} = $onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
	$: subPiecePaths = $horizontalCutPathStore.map((horizontalCutPath) =>
		piecePath.intersect(horizontalCutPath)
	);

	const explodeStore = getContext("explodeStore");

	const explodeXScaleStore = getContext("explodeXScaleStore");

	const colorScaleStore = getContext("colorScaleStore");
</script>

{#if subPieces.length}
	{#each subPiecePaths as subPiecePath}
		<!-- TODO transform subpieces along x scale -->
		<path d={subPiecePath.pathData} class="subpiece" />
	{/each}
{:else}
	<path
		d={piecePath.pathData}
		style={$explodeStore
			? `stroke: ${$colorScaleStore(
					Math.abs(area - meanArea) / standardDeviation
			  )}; transform: translate(${
					-piecePath.bounds.center.x + $explodeXScaleStore(area)
			  }px, ${-piecePath.bounds.center.y + radius * 0.7}px)`
			: undefined}
		class:highlight
		class:primary={highlight && primary}
		class:secondary={highlight && secondary}
		class:thin={secondary &&
			cutType === "radial" &&
			cutTargetDepthPercentage === 0}
	/>
{/if}

<!-- <circle
	r="2"
	cx={piecePath.bounds.center.x}
	cy={piecePath.bounds.center.y}
	fill="red"
/> -->

<style>
	path {
		fill: none;
		stroke: transparent;
		transition:
			stroke 200ms 200ms,
			transform 200ms;

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
		transition:
			stroke 200ms,
			transform 200ms;
	}
</style>
