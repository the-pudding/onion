<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} width
	 * @property {any} height
	 * @property {boolean} [isBottom]
	 * @property {boolean} [isHalfWidth]
	 */

	/** @type {Props} */
	let {
		width,
		height,
		isBottom = false,
		isHalfWidth = false
	} = $props();

	let y = isBottom ? height : 0;
</script>

<line
	x1={-width / 2}
	y1={y}
	x2={width / 2}
	y2={y}
	class:half-width={isHalfWidth}
/>

<style>
	line {
		stroke-width: var(--axis-thickness);

		&.half-width {
			stroke-width: calc(var(--axis-thickness) / 2);
		}
	}
</style>
