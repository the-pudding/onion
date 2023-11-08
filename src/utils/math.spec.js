import { describe, expect, test } from "vitest";
import { getRadialCutArea, getVerticalCutArea } from "$utils/math";

const radius = 1;
const quarterCircleArea = (Math.PI * radius ** 2) / 4;
const areaScaleFactorWhenRadiusIsDoubled = 4;

describe("vertical cuts", () => {
	test("calculates 0-width cut area", () => {
		const area = getVerticalCutArea(radius, 0, 0);

		expect(area).toBe(0);
	});

	test("calculates integral equal to quarter onion area", () => {
		const integralArea = getVerticalCutArea(radius, 0, radius);

		expect(integralArea).toBe(quarterCircleArea);
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
		const outerCircularSegmentAreaLeft = getVerticalCutArea(
			radius,
			0,
			rightCut
		);
		const outerCircularSegmentAreaRight = getVerticalCutArea(
			radius,
			rightCut,
			radius
		);

		expect(outerCircularSegmentAreaLeft / innerCircularSegmentAreaLeft).toBe(
			areaScaleFactorWhenRadiusIsDoubled
		);
		expect(outerCircularSegmentAreaRight / innerCircularSegmentAreaRight).toBe(
			areaScaleFactorWhenRadiusIsDoubled
		);
	});
});

describe("radial cuts", () => {
	test("calculates 0-angle-width cut area", () => {
		const area = getRadialCutArea({ radius2: radius, theta2: 0 });

		expect(area).toBe(0);
	});

	test("calculates integral equal to quarter onion area", () => {
		const integralArea = getRadialCutArea({
			radius2: radius,
			theta2: Math.PI / 2
		});

		expect(integralArea).toBe(quarterCircleArea);
	});

	test("limits of integration work as expected", () => {
		const rightArea = getRadialCutArea({
			radius2: radius,
			theta2: Math.PI / 4
		});
		const leftArea = getRadialCutArea({
			radius2: radius,
			theta1: Math.PI / 4,
			theta2: Math.PI / 2
		});

		expect(rightArea).toBe(leftArea);
	});

	// $numLayers = 2
	// $numCuts = 2
	// proportions between areas scaled up by doubling radius should be 4x
	test("geometric similarity with 2 layers and 2 cuts", () => {
		const innerRadius = radius / 2;
		const diagonalCutAngle = Math.PI / 4;

		const innerArea = getRadialCutArea({
			radius2: innerRadius,
			theta2: diagonalCutAngle
		});
		const outerArea = getRadialCutArea({
			radius2: radius,
			theta2: diagonalCutAngle
		});

		expect(outerArea / innerArea).toBe(areaScaleFactorWhenRadiusIsDoubled);
	});
});
