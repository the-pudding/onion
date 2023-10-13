<script>
	export let width;
	export let height;
	export let isBottom = false;

	let y = isBottom ? height : 0;
</script>

<line x1={-width / 2} y1={y} x2={width / 2} y2={y} />

<style>
	line {
		stroke-width: 2;
	}
</style>
