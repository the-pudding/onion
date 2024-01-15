<!-- based on LayerCake's MultiLine example -->
<!-- https://layercake.graphics/example/MultiLine -->
<script>
	import { LayerCake, Svg, Html, groupLonger, flatten } from "layercake";

	import { scaleOrdinal, timeParse, timeFormat, format } from "d3";

	import MultiLine from "$components/layercake/todo/MultiLine.svelte";
	import AxisX from "$components/layercake/AxisX.svg.svelte";
	import AxisY from "$components/layercake/AxisY.svg.svelte";
	import Labels from "$components/layercake/GroupLabels.html.svelte";
	import SharedTooltip from "$components/layercake/SharedTooltip.html.svelte";

	// TODO display onion data
	import data from "$data/fruit.csv";

	/* --------------------------------------------
	 * Set what is our x key to separate it from the other series
	 */
	const xKey = "month";
	const yKey = "value";
	const zKey = "fruit";

	const xKeyCast = timeParse("%Y-%m-%d");

	const seriesNames = Object.keys(data[0]).filter((d) => d !== xKey);
	const seriesColors = ["#ffe4b8", "#ffb3c0", "#ff7ac7", "#ff00cc"];

	/* --------------------------------------------
	 * Cast values
	 */
	data.forEach((d) => {
		d[xKey] = typeof d[xKey] === "string" ? xKeyCast(d[xKey]) : d[xKey];

		seriesNames.forEach((name) => {
			d[name] = +d[name];
		});
	});

	const formatTickX = timeFormat("%b. %e");
	const formatTickY = (d) => format(`~s`)(d);

	const groupedData = groupLonger(data, seriesNames, {
		groupTo: zKey,
		valueTo: yKey
	});
</script>

<div class="chart-container">
	<LayerCake
		padding={{ top: 7, right: 10, bottom: 20, left: 25 }}
		x={xKey}
		y={yKey}
		z={zKey}
		yDomain={[0, null]}
		zScale={scaleOrdinal()}
		zRange={seriesColors}
		flatData={flatten(groupedData, "values")}
		data={groupedData}
	>
		<Svg>
			<AxisX
				gridlines={false}
				ticks={data.map((d) => d[xKey]).sort((a, b) => a - b)}
				formatTick={formatTickX}
				snapTicks={true}
				tickMarks={true}
			/>
			<AxisY ticks={4} formatTick={formatTickY} />
			<MultiLine />
		</Svg>

		<Html>
			<Labels />
			<SharedTooltip formatTitle={formatTickX} dataset={data} />
		</Html>
	</LayerCake>
</div>

<style>
	/*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
	.chart-container {
		width: 100%;
		height: 250px;
	}
</style>
