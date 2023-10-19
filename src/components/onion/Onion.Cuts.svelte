<script>
	import { polarToCartesian } from "$utils/math";
	import { numCuts, cutAngleScale, cutWidthScale } from "$stores/onion";

	export let cutType;
	export let height;
	export let radius;
	export let cutTargetDepthPercentage;
</script>

<g class="cuts">
	{#each { length: $numCuts } as _, i}
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
				y1={height - yIntercept * 2 - cutTargetDepthPercentage * height}
				x2="0"
				y2={height + cutTargetDepthPercentage * height}
			/>
		{/if}
	{/each}
</g>
