<script>
	import { getContext } from "svelte";
	import WIP from "$components/helpers/WIP.svelte";
	import Intro from "./Intro.svelte";
	import Story from "./Story.svelte";
	import OnionDemo from "$components/onion/Onion.Demo.svelte";
	import OnionRadialStandardDeviationGraph from "$components/onion/Onion.RadialStandardDeviationGraph.svelte";
	import OnionStandardDeviationGraph from "$components/onion/Onion.StandardDeviationGraph.svelte";
	// import Footer from "$components/Footer.svelte";

	const copy = getContext("copy");
	// const data = getContext("data");

	console.log({ copy });
</script>

<WIP />
<Intro />
<Story />

<!-- <OnionDemo /> -->

<!-- TODO will we show these misc graphs? -->
<!-- <h2>standard deviation in piece size</h2>

<h3>radial cuts, from cut target depth 0-100% of onion radius</h3>
<OnionRadialStandardDeviationGraph />

<h3>vertical cuts</h3>
<OnionStandardDeviationGraph /> -->

<!-- <Footer /> -->

<style global>
	:root {
		--text-size: var(--24px);
	}

	/* TODO Inter font */

	.text {
		font-size: var(--text-size);
	}

	.small {
		font-size: var(--14px);
	}
</style>
