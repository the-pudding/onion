import { expect, test } from "vitest";
import { getVerticalCutArea } from "$utils/math";

const radius = 1;

test("calculates 0-width cut area", () => {
	const area = getVerticalCutArea(radius, 0, 0);

	expect(area).toBe(0);
});

test("calculates integral equal to quarter onion area", () => {
	const integralArea = getVerticalCutArea(radius, 0, radius);
	const geometricArea = (Math.PI * radius * radius) / 4;

	expect(integralArea).toBe(geometricArea);
});

test("limits of integration work as expected", () => {
	const totalArea = getVerticalCutArea(radius, 0, radius);
	const leftArea = getVerticalCutArea(radius, 0, radius / 2);
	const rightArea = getVerticalCutArea(radius, radius / 2, radius);

	expect(leftArea + rightArea).toBe(totalArea);
});

// $numLayers = 2
// $numCuts = 3
// proportions between areas scaled up by doubling radius should be 4x
test("geometric similarity with 2 layers and 3 cuts", () => {
	const innerRadius = radius / 2;
	const expectedAreaScaleFactor = 4;
	const leftCut = radius / 3;
	const rightCut = radius * (2 / 3);

	const innerCircularSegmentAreaLeft = getVerticalCutArea(
		innerRadius,
		0,
		leftCut
	);
	const innerCircularSegmentAreaRight = getVerticalCutArea(
		innerRadius,
		leftCut,
		rightCut
	);
	const outerCircularSegmentAreaLeft = getVerticalCutArea(radius, 0, rightCut);
	const outerCircularSegmentAreaRight = getVerticalCutArea(
		radius,
		rightCut,
		radius
	);

	expect(outerCircularSegmentAreaLeft / innerCircularSegmentAreaLeft).toBe(
		expectedAreaScaleFactor
	);
	expect(outerCircularSegmentAreaRight / innerCircularSegmentAreaRight).toBe(
		expectedAreaScaleFactor
	);
});
