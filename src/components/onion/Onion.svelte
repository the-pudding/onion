<script>
	import { layerRadii } from "$stores/onion";

	export let height;
</script>

<g class="onion">
	{#each $layerRadii as r}
		<path d="M {r} {height} A {r} {r} 0 0 0 {-r} {height}" />
	{/each}
</g>

<style>
	path {
		fill: none;
	}
</style>
