<script>
	import { getContext } from "svelte";

	/**
	 * @typedef {Object} Props
	 * @property {any} path
	 * @property {any} area
	 * @property {any} layerNum
	 * @property {any} cutNum
	 * @property {any} [subPieceIndex]
	 * @property {boolean} [highlight]
	 * @property {boolean} [primary]
	 * @property {boolean} [secondary]
	 * @property {number} explodedX
	 * @property {number} explodedY
	 */

	/** @type {Props} */
	let {
		path,
		area,
		layerNum,
		cutNum,
		subPieceIndex = undefined,
		highlight = false,
		primary = false,
		secondary = false,
		explodedX,
		explodedY
	} = $props();

	const d = path.pathData;
	const subpiece = subPieceIndex !== undefined;
	const svgPadding = 1;

	const onionStore = getContext("onionStore");
	let { cutType, cutTargetDepthPercentage, meanArea, standardDeviation } =
		$derived($onionStore);

	const explodeStore = getContext("explodeStore");
	const colorScaleStore = getContext("colorScaleStore");
</script>

<!-- {#if subpiece}
		{@debug path, d, area}
	{/if} -->
<path
	{d}
	style={$explodeStore
		? `fill: ${$colorScaleStore(
				Math.abs(area - meanArea) / standardDeviation
			)}; transform: translate(${explodedX}px, ${explodedY}px)`
		: undefined}
	class:highlight
	class:primary={highlight && primary}
	class:secondary={highlight && secondary}
	class:thin={!$explodeStore &&
		secondary &&
		cutType === "radial" &&
		cutTargetDepthPercentage === 0}
	class:subpiece
	data-area={area}
	data-subpiece-index={subPieceIndex}
/>

<style>
	path {
		fill: none;
		stroke: transparent;
		transition:
			stroke var(--duration-transform) var(--duration-transform),
			transform var(--duration-transform);

		&.highlight {
			stroke-width: 4px;
		}

		&.thin {
			stroke-width: 2px;
		}

		&.subpiece {
			stroke: var(--color-primary);
		}
	}

	:global(figure:not(.explode) .subpiece) {
		stroke-width: 2px;
	}

	:global(figure.explode path) {
		stroke: var(--color-fg);
		transition:
			stroke var(--duration-fade),
			transform var(--duration-transform) var(--duration-fade);
	}
</style>
