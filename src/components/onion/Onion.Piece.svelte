<script>
	export let layerNum;
	export let cutSectionPath;

	// TODO is mask approach suitable for exploded piece view?
	// if not, will have to find piece path from where layerPath intersects cutSectionPath
	//   using a library like clipper.js
	//   https://jsclipper.sourceforge.net/6.1.3.1/index.html
</script>

<path
	class="piece"
	d={cutSectionPath}
	mask="url(#onion-layer-{layerNum})"
	fill="mediumpurple"
/>
