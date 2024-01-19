<script>
	import { polarToCartesian } from "$utils/math";
	import {
		cutAngleScale,
		cutWidthScale,
		yScale,
		cutNumbers,
		cutTargetDepth,
		cutType,
		horizontalCutScale,
		numHorizontalCuts,
		width,
		horizontalCutNumbers
	} from "$stores/onion";

	export let height;
	export let radius;
</script>

<g class="cuts">
	{#each $cutNumbers as i}
		{#if $cutType === "vertical"}
			{@const x = $cutWidthScale(i)}
			<line x1={x} y1="0" x2={x} y2={height} />
		{:else if $cutType === "radial"}
			{@const theta = $cutAngleScale(i + 1)}

			<!-- where cut intercepts onion's outermost layer -->
			{@const [xIntercept, yIntercept] = polarToCartesian(radius, theta)}

			<line
				x1={xIntercept * 2}
				y1={$yScale(yIntercept * 2 + $cutTargetDepth)}
				x2="0"
				y2={$yScale(-$cutTargetDepth)}
			/>
		{/if}
	{/each}

	{#each $horizontalCutNumbers as i}
		{@const y = $horizontalCutScale(i) * radius}
		{@const yNormalized = $yScale(y)}
		<line x1="0" y1={yNormalized} x2={$width / 2} y2={yNormalized} />
	{/each}
</g>

<style>
	line {
		stroke-dasharray: 5;
	}
</style>
