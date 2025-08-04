<script>
	import { getContext, setContext } from "svelte";
	import { quantile } from "d3";
	import Intro from "./Intro.svelte";
	import Story from "./Story.svelte";
	import Conclusion from "./Conclusion.svelte";
	import Appendix from "./Appendix.svelte";
	// import Footer from "$components/Footer.svelte";

	const data = getContext("data");

	// determine the quartiles we'll use to label RSD as very low, low, high, very high
	const standardDeviations = Object.values(data);
	const min = Math.min(...standardDeviations);
	const q1 = quantile(standardDeviations, 0.25);
	const median = quantile(standardDeviations, 0.5);
	const q3 = quantile(standardDeviations, 0.75);
	const max = Math.max(...standardDeviations);

	setContext("rsdBuckets", {
		min,
		q1,
		median,
		q3,
		max
	});
</script>

<Intro />
<Story />
<Conclusion />
<Appendix />

<!-- <Footer /> -->
