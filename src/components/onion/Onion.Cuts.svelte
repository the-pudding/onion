<script>
	import { polarToCartesian } from "$utils/math";
	import {
		cutAngleScale,
		cutWidthScale,
		yScale,
		cutNumbers
	} from "$stores/onion";

	export let cutType;
	export let height;
	export let radius;
	export let cutTargetDepth;
</script>

<g class="cuts">
	{#each $cutNumbers as i}
		{#if cutType === "vertical"}
			{@const x = $cutWidthScale(i)}
			s
			<line x1={x} y1="0" x2={x} y2={height} />
		{:else if cutType === "radial"}
			{@const theta = $cutAngleScale(i)}

			<!-- where cut intercepts onion's outermost layer -->
			{@const [xIntercept, yIntercept] = polarToCartesian(radius, theta)}

			<line
				x1={xIntercept * 2}
				y1={$yScale(yIntercept * 2 + cutTargetDepth)}
				x2="0"
				y2={$yScale(-cutTargetDepth)}
			/>
		{/if}
	{/each}
</g>

<style>
	line {
		stroke-dasharray: 5;
	}
</style>
