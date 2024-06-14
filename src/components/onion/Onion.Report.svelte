<script>
	import { scaleLinear } from "d3";
	import Select from "$components/helpers/Select.svelte";
	import SortTable from "$components/helpers/SortTable.svelte";
	import { pluralize } from "$utils/pluralize";

	const diagramSize = 32;
	const diagramPadding = 4;
	const halfDiagramSize = diagramSize / 2;
	const diagramExtent = halfDiagramSize - diagramPadding;
	const radialTargetPosition = diagramPadding / 2;

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
		const mainCutTypeMap = { v: "vertical", r: "radial" };

		const mainCutType = storageKey[storageKey.indexOf("c") + 2]; // v | r
		const cutTargetDepthPercentage = +storageKey.substring(
			storageKey.indexOf(mainCutType) + 2,
			storageKey.indexOf("%")
		); // 0-100
		const numHorizontalCuts = +storageKey[storageKey.indexOf("h") - 1]; // 0 | 1 | 2
		const horizontalCutScale = scaleLinear()
			.domain([0, numHorizontalCuts])
			.range([1 / (numHorizontalCuts + 1), 1]);
		const isRadial = mainCutType === "r";
		const title = `${numCuts} ${mainCutTypeMap[mainCutType]} ${pluralize(
			"cut",
			numCuts
		)}, ${
			isRadial ? `${cutTargetDepthPercentage}% depth, ` : ""
		}${numHorizontalCuts} horizontal ${pluralize("cut", numHorizontalCuts)}`;

		r.cuttingDiagram = `<svg viewBox="${-halfDiagramSize} ${-halfDiagramSize} ${diagramSize} ${diagramSize}" width="${diagramSize}">
			<style>
				rect {
					fill: rgba(239, 239, 239, 1);
				}

				.cut {
					stroke-dasharray: 2;
				}
			</style>

			<title>${title}</title>

			<rect x="${-halfDiagramSize}" y="${-halfDiagramSize}" width="${diagramSize}" height="${diagramSize}" />

			${
				isRadial
					? `
							<!-- TODO is showing cutting board + vertical cut helpful? -->
							<!-- <line x1="${-diagramExtent}" y1="${-diagramExtent}" x2="${diagramExtent}" y2="${-diagramExtent}" />
							<line x1="0" y1="${-diagramExtent}" x2="0" y2="${radialTargetPosition}" class="cut" /> -->
							<line x1="${diagramExtent}" y1="${-diagramExtent}" x2="0" y2="${radialTargetPosition}" class="cut" />

							<circle r="1.5" cy="${radialTargetPosition}" />

							<text y=${diagramExtent} text-anchor="middle" font-size="8">
								${cutTargetDepthPercentage}%
							</text>
						`
					: `<line x1="0" y1="${-diagramExtent}" x2="0" y2="${diagramExtent}" class="cut" />`
			}

			${
				numHorizontalCuts
					? Array.from({ length: numHorizontalCuts }).map((_, h) => {
							const y =
								-diagramExtent + horizontalCutScale(h) * 2 * diagramExtent;
							return `<line x1="${-diagramExtent}" y1="${y}" x2="${diagramExtent}" y2="${y}" class="cut" />`;
					  })
					: ""
			}
		</svg>`;

		return r;
	});
</script>

<Select label="number of layers" bind:value={numLayers} {options} />

<SortTable {rows} {columns} />
