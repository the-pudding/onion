import { format } from "d3";

export function formatPercentage(n) {
	return format(".0%")(n);
}

export function polarToCartesian(r, theta) {
	return [r * Math.sin(theta), r * Math.cos(theta)];
}

// https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/28c569c5d8e79b7e1a2be1755de42d25_MIT18_01SCF10_Ses70a.pdf
// following a similar derivation to the paper above,
// getVerticalCutArea returns the area of a vertical slice of a quarter circle in the first quadrant,
//   starting from x = 0
//   i.e., integral of sqrt(radius ** 2 - x ** 2)dx, from x1 to x2
// the antiderivative of this is (-1/2 * r ** 2) * (theta - sin(theta) * cos(theta)),
// where theta is arccos(x/r)
export function getVerticalCutArea(radius, x1, x2) {
	// acos' domain is [-1, 1], so acos of anything > 1 will return NaN
	x2 = Math.min(x2, radius);

	function getTheta(x) {
		return Math.acos(x / radius);
	}

	function getAntiderivative(theta) {
		return (-1 / 2) * radius ** 2 * (theta - Math.sin(theta) * Math.cos(theta));
	}

	return getAntiderivative(getTheta(x2)) - getAntiderivative(getTheta(x1));
}

export function getVerticalCutAreaAboveHorizontalLine({
	layerRadius,
	cutY,
	cutX,
	nextCutX
}) {
	const xWhereHorizontalCutIntersectsThisLayer = Math.sqrt(
		layerRadius ** 2 - cutY ** 2
	);
	const xUpperBound = Math.min(
		xWhereHorizontalCutIntersectsThisLayer,
		nextCutX
	);

	return (
		getVerticalCutArea(layerRadius, cutX, xUpperBound) -
		(xUpperBound - cutX) * cutY
	);
}

// getRadialCutArea returns the area of a radial slice in the first quadrant
//   i.e., double integral: (r dr, from radius1 to radius2) d theta, from theta1 to theta2
// only applies if cutTargetDepth === 0
export function getRadialCutAreaPolar({
	radius1 = 0,
	radius2,
	theta1 = 0,
	theta2
}) {
	return (1 / 2) * (radius2 ** 2 - radius1 ** 2) * (theta2 - theta1);
}

// discriminant is obtained from quadratic formula,
//   when setting circle function equal to line function to find intersection
export function doesLineIntersectCircleAboveXAxis({
	slope,
	yIntercept,
	radius
}) {
	const discriminant =
		yIntercept ** 2 * slope ** 2 -
		(slope ** 2 + 1) * (yIntercept ** 2 - radius ** 2);

	return { discriminant, doesIntersect: discriminant > 0 };
}

// getAreaUnderLine returns the area under a line defined by y = mx + b
export function getAreaUnderLine({ slope, yIntercept, x1, x2 }) {
	return (1 / 2) * slope * (x2 ** 2 - x1 ** 2) + yIntercept * (x2 - x1);
}

// calculating yRange with Math.sqrt is prone to rounding errors
// e.g., yRange[1] may be evaluated as 80.00000000000003, for the last (rightmost) piece of
//   the middle layer given { numLayers: 3, numCuts: 3, cutType: "radial", cutTargetDepth: 0 };
//   without this function, 80 will be considered to be within yRange, which should be exclusive
export function isInRange(n, min, max) {
	const tolerance = 3e-14;

	return n > min && n - min > tolerance && n < max && max - n > tolerance;
}

// verticalAreas is returned by Onion.verticalAreas
export function flattenVerticalAreas(verticalAreas) {
	return verticalAreas
		.map(({ pieceColumn }) =>
			pieceColumn.map(({ pieceArea, subPieces }) =>
				subPieces.length
					? subPieces.map(({ subPieceArea }) => subPieceArea)
					: pieceArea
			)
		)
		.flat(2);
}

// radialAreas is returned by Onion.radialAreas
export function flattenRadialAreas(radialAreas) {
	return radialAreas
		.map(({ pieces }) =>
			pieces.map(({ area, subPieces }) => (subPieces.length ? subPieces : area))
		)
		.flat(2);
}

// adding/subtracting integrals to obtain areas means our precision is off by a little;
// rounding areas to 10 decimal places before comparing them makes the exploded sort order more visually appealing
// (for pieces with equal areas, i.e., cutTargetDepth === 0, left-to-right order is preserved)
export function compareRadialPieceAreasDescending(a, b) {
	const numDecimalPlaces = 10;
	return +b.area.toFixed(numDecimalPlaces) - +a.area.toFixed(numDecimalPlaces);
}
