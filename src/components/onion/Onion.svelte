<script>
	import { layerRadii } from "$stores/onion";

	export let height;
</script>

<g class="onion">
	{#each $layerRadii as r, i}
		<path d="M {r} {height} A {r} {r} 0 0 0 {-r} {height}" fill="none" />

		{@const layerThickness = $layerRadii[0]}
		{@const previousRadius = $layerRadii[i - 1]}

		<!-- needed as a clipping mask for Onion.Piece.svelte -->
		<mask id="onion-layer-{i}">
			<path
				d="M {-r} {height} A {r} {r} 0 0 1 {r} {height} h {-layerThickness} {i ===
				0
					? ''
					: `A ${previousRadius} ${previousRadius} 0 0 0 ${-previousRadius} ${height}`} z"
				fill="white"
			/>
		</mask>
	{/each}
</g>
