import { describe, expect, test } from "vitest";
import {
	getAreaUnderLine,
	getRadialCutAreaPolar,
	getRadialCutAreas,
	getVerticalCutArea
} from "$utils/math";
import { numCuts, numLayers, width } from "$stores/onion";

const radius = 1;
const quarterCircleArea = (Math.PI * radius ** 2) / 4;
const areaScaleFactorWhenRadiusIsDoubled = 4;

function setTestRadius(testRadius) {
	// height is 50% of width
	// radius is 80% of height
	width.set(testRadius / 0.8 / 0.5);
}

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

describe("radial cuts aimed at center", () => {
	test("calculates 0-angle-width cut area", () => {
		const area = getRadialCutAreaPolar({ radius2: radius, theta2: 0 });

		expect(area).toBe(0);
	});

	test("calculates integral equal to quarter onion area", () => {
		const integralArea = getRadialCutAreaPolar({
			radius2: radius,
			theta2: Math.PI / 2
		});

		expect(integralArea).toBe(quarterCircleArea);
	});

	test("limits of integration work as expected", () => {
		const rightArea = getRadialCutAreaPolar({
			radius2: radius,
			theta2: Math.PI / 4
		});
		const leftArea = getRadialCutAreaPolar({
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

		const innerArea = getRadialCutAreaPolar({
			radius2: innerRadius,
			theta2: diagonalCutAngle
		});
		const outerArea = getRadialCutAreaPolar({
			radius2: radius,
			theta2: diagonalCutAngle
		});

		expect(outerArea / innerArea).toBe(areaScaleFactorWhenRadiusIsDoubled);
	});
});

describe("getAreaUnderLine", () => {
	test("slope and y-intercept are 0", () => {
		const slope = 0;
		const yIntercept = 0;

		expect(getAreaUnderLine({ slope, yIntercept, x1: 0, x2: 1 })).toBe(0);
		expect(getAreaUnderLine({ slope, yIntercept, x1: 1, x2: 2 })).toBe(0);
	});

	test("slope is 0", () => {
		const slope = 0;
		const yIntercept = 1;

		expect(getAreaUnderLine({ slope, yIntercept, x1: 0, x2: 1 })).toBe(1);
		expect(getAreaUnderLine({ slope, yIntercept, x1: 1, x2: 2 })).toBe(1);
	});

	test("y-intercept is zero", () => {
		const slope = 1;
		const yIntercept = 0;

		expect(getAreaUnderLine({ slope, yIntercept, x1: 0, x2: 1 })).toBe(1 / 2);
		expect(getAreaUnderLine({ slope, yIntercept, x1: 1, x2: 2 })).toBe(3 / 2);
	});

	test("y-intercept is negative", () => {
		const slope = 1;
		const yIntercept = -1;

		expect(getAreaUnderLine({ slope, yIntercept, x1: 0, x2: 1 })).toBe(-1 / 2);
		expect(getAreaUnderLine({ slope, yIntercept, x1: 1, x2: 2 })).toBe(1 / 2);
	});
});

describe("radial cuts aimed below center", () => {
	describe("aimed at center, but calculated with piecewise integrals", () => {
		const testLayerRadii = [3, 6, 9];
		setTestRadius(9);
		const testLayers = testLayerRadii.length;
		const testCuts = 3;
		numLayers.set(testLayers);
		numCuts.set(testCuts);
		const areas = getRadialCutAreas();

		const expectedAreas = testLayerRadii.map((radius, layerNum) =>
			getRadialCutAreaPolar({
				...(layerNum > 0 && { radius1: testLayerRadii[layerNum - 1] }),
				radius2: radius,
				theta2: Math.PI / 6
			})
		);

		const testCoordinates = Array.from({ length: testLayers })
			.map((_, layerNum) =>
				Array.from({ length: testCuts }).map((_, pieceNum) => ({
					layerNum,
					pieceNum
				}))
			)
			.flat();

		test.each(testCoordinates)(
			"layer $layerNum, piece $pieceNum",
			({ layerNum, pieceNum }) => {
				// 13 digits after the decimal point is pretty darn close
				// any difference past that is likely due to rounding errors
				expect(areas[layerNum].pieces[pieceNum].area).toBeCloseTo(
					expectedAreas[layerNum],
					13
				);
			}
		);
	});
});
