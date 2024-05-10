<script>
	import { getContext } from "svelte";
	import WIP from "$components/helpers/WIP.svelte";
	import Intro from "./Intro.svelte";
	import Story from "./Story.svelte";
	import Conclustion from "./Conclustion.svelte";
	import Appendix from "./Appendix.svelte";
	// import Footer from "$components/Footer.svelte";

	const copy = getContext("copy");
	// const data = getContext("data");

	console.log({ copy });
</script>

<WIP />
<Intro />
<Story />
<Conclustion />
<Appendix />

<!-- <Footer /> -->

<style global>
	:root {
		--text-size: var(--24px);
		--color-primary: var(--color-purple);
		--color-secondary: var(--color-green);
	}

	#content {
		max-width: 600px;
		margin-inline: auto;
	}

	/* TODO Inter font */

	.text {
		font-size: var(--text-size);
	}

	.small {
		font-size: var(--14px);
	}
</style>
