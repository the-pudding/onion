import { format } from "d3";

export function formatPercentageAsNegative(n) {
	return format(".0%")(-n);
}

export function polarToCartesian(r, theta) {
	return [r * Math.sin(theta), r * Math.cos(theta)];
}

// https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/28c569c5d8e79b7e1a2be1755de42d25_MIT18_01SCF10_Ses70a.pdf
// following a similar derivation to the paper above,
// getVerticalCutArea returns the area of a vertical slice of a quarter circle in the first quadrant,
//   starting from x = 0
//   i.e., integral of sqrt(radius^2 - x^2)dx, from x1 to x2
// the antiderivative of this is (-1/2 * r^2) * (theta - sin(theta) * cos(theta)),
// where theta is arccos(x/r)
export function getVerticalCutArea(radius, x1, x2) {
	// acos' domain is [-1, 1], so acos of anything > 1 will return NaN
	x2 = Math.min(x2, radius);

	function getTheta(x) {
		return Math.acos(x / radius);
	}

	function getAntiderivative(theta) {
		return (
			(-1 / 2) * radius * radius * (theta - Math.sin(theta) * Math.cos(theta))
		);
	}

	return getAntiderivative(getTheta(x2)) - getAntiderivative(getTheta(x1));
}
