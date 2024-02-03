<script>
	export let width;
	export let height;
	export let isBottom = false;

	let y = isBottom ? height : 0;
</script>

<path d="M {-width / 2} {y} h {width}" />

<style>
	path {
		stroke-width: 2;
	}
</style>
