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
	$: ({ cutType, cutTargetDepthPercentage, meanArea, standardDeviation } =
		$onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
	$: subPiecePaths = $horizontalCutPathStore.map((horizontalCutPath) =>
		piecePath.intersect(horizontalCutPath)
	);
	$: ({ width, height } = piecePath.strokeBounds);

	const explodeStore = getContext("explodeStore");

	const colorScaleStore = getContext("colorScaleStore");
</script>

<svg
	viewBox={$explodeStore ? `0 0 ${width} ${height}` : undefined}
	width={$explodeStore ? width : undefined}
>
	{#if subPieces.length}
		{#each subPiecePaths as subPiecePath}
			<!-- TODO show subpieces in exploded view -->
			<path d={subPiecePath.pathData} class="subpiece" />
		{/each}
	{:else}
		<path
			d={piecePath.pathData}
			style={$explodeStore
				? `stroke: ${$colorScaleStore(
						Math.abs(area - meanArea) / standardDeviation
				  )}; transform: translate(${width / 2 - piecePath.position.x}px, ${
						height / 2 - piecePath.position.y
				  }px)`
				: undefined}
			class:highlight
			class:primary={highlight && primary}
			class:secondary={highlight && secondary}
			class:thin={secondary &&
				cutType === "radial" &&
				cutTargetDepthPercentage === 0}
		/>
	{/if}
</svg>

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
