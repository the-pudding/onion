<script>
	import Select from "$components/helpers/Select.svelte";
	import SortTable from "$components/helpers/SortTable.svelte";

	const diagramSize = 32;

	// TODO can these be imported from another file?
	let numLayers = 7;
	const options = [
		{ value: 7 },
		{ value: 8 },
		{ value: 9 },
		{ value: 10 },
		{ value: 11 },
		{ value: 12 },
		{ value: 13 }
	];

	const columns = [
		{ label: "Cuts", prop: "numCuts", sort: true, type: "number" },
		{ label: "Method", prop: "cuttingDiagram", sort: false, type: "string" },
		{
			label: "Standard Deviation",
			prop: "standardDeviation",
			sort: false,
			type: "number"
		}
	];

	// TODO import this from onion-report.js
	// TODO get rows for all numLayers values
	const rowData = [
		{ numCuts: 1, storageKey: "7l:1c:v:2h", standardDeviation: 47.25 },
		{ numCuts: 2, storageKey: "7l:2c:r:48%d:0h", standardDeviation: 48.156 },
		{ numCuts: 3, storageKey: "7l:3c:r:49%d:0h", standardDeviation: 43.65 }
	];
	const rows = rowData.map((r) => {
		// build an SVG string to render in table
		const { numCuts, storageKey } = r;

		const mainCutType = storageKey[storageKey.indexOf("c") + 2]; // v | r
		const cutTargetDepthPercentage = +storageKey.substring(
			storageKey.indexOf(mainCutType) + 2,
			storageKey.indexOf("%")
		); // 0-100
		const numHorizontalCuts = storageKey[storageKey.indexOf("h") - 1]; // 0 | 1 | 2
		const isVertical = mainCutType === "v";
		const title = `${numCuts} ${isVertical ? "vertical" : "radial"} cut${
			numCuts === 1 ? "" : "s"
		}, ${
			isVertical ? "" : `${cutTargetDepthPercentage}% depth, `
		}${numHorizontalCuts} horizontal cut${numHorizontalCuts === 1 ? "" : "s"}`;

		// TODO add dotted cut lines + depth labels
		r.cuttingDiagram = `<svg viewBox="0 0 ${diagramSize} ${diagramSize}" width="${diagramSize}">
			<style>
				rect {
					fill: rgba(239, 239, 239, 1);
				}
			</style>

			<title>${title}</title>

			<rect width="${diagramSize}" height="${diagramSize}" />
		</svg>`;

		return r;
	});
</script>

<Select label="number of layers" bind:value={numLayers} {options} />

<SortTable {rows} {columns} />
