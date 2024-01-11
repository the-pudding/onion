import {
	cutAngleScale,
	cutNumbers,
	cutTargetDepth,
	cutWidthScale,
	layerArcs,
	layerRadii,
	radius
} from "../stores/onion";
import { format } from "d3";
import { get } from "svelte/store";

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

export function getVerticalAreas() {
	const $cutNumbers = get(cutNumbers);
	const $cutWidthScale = get(cutWidthScale);
	const $layerRadii = get(layerRadii);

	// with vertical cuts, pieceAreas is a 2D array whose major index corresponds to cutNumbers
	// the minor index (for pieceColumn array) corresponds to piece index within a column of pieces,
	//   counted from the bottom upward
	const pieceAreas = $cutNumbers.map((i) => ({
		cutX: $cutWidthScale(i),
		pieceColumn: []
	}));

	$cutNumbers.forEach((i) => {
		const { cutX, pieceColumn } = pieceAreas[i];

		$layerRadii.forEach((layerRadius) => {
			if (layerRadius > cutX) {
				const nextCutX = $cutWidthScale(i + 1);
				const verticalCutArea = getVerticalCutArea(layerRadius, cutX, nextCutX);
				const pieceArea = pieceColumn.length
					? verticalCutArea - pieceColumn.at(-1).verticalCutArea
					: verticalCutArea;

				pieceColumn.push({ layerRadius, verticalCutArea, pieceArea });
			}
		});
	});

	return pieceAreas;
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

// cutTargetDepth store's value gets passed as an arg when getRadialCutAreas is called,
//   so that this function can rerun when cutTargetDepth store changes
export function getRadialCutAreas() {
	const $layerRadii = get(layerRadii);
	const $cutAngleScale = get(cutAngleScale);
	const $radius = get(radius);
	const $layerArcs = get(layerArcs);
	const $cutNumbers = get(cutNumbers);
	const $cutTargetDepth = get(cutTargetDepth);

	function getCutLineFunction(slope) {
		return (x) => slope * x - $cutTargetDepth;
	}

	function getSlope(cutNum) {
		const theta = $cutAngleScale(cutNum);

		return (
			($cutTargetDepth + $radius * Math.sin(theta)) /
			($radius * Math.cos(theta))
		);
	}

	// with radial cuts, pieceAreas is a 2D array whose major index corresponds to layer number
	// the minor index corresponds to piece number

	// first, count total number of pieces for each layer
	// TODO can we calculate areas within this first pass?
	const pieceAreas = $layerRadii.map((layerRadius, layerNum) => {
		const layerArcFunction = $layerArcs[layerNum];
		const pieces = [];

		$cutNumbers.forEach((cutNum) => {
			const m = getSlope(cutNum);
			const cutLineFunction = getCutLineFunction(m);
			const { discriminant, doesIntersect } = doesLineIntersectCircleAboveXAxis(
				{
					slope: m,
					yIntercept: -$cutTargetDepth,
					radius: layerRadius
				}
			);

			if (doesIntersect) {
				const x =
					($cutTargetDepth * m + Math.sqrt(discriminant)) / (m ** 2 + 1);

				if (x > 0 && cutLineFunction(x) > 0) {
					pieces.push({
						xOfLeftCutIntersection: x,
						leftCutLineSlope: m
					});
				}
			}
		});

		return { layerRadius, layerArcFunction, pieces };
	});

	// after each layer's pieces are counted,
	// calculate areas for each piece
	pieceAreas.forEach((layerWithPieces, layerNum, layers) => {
		const isFirstLayer = layerNum === 0;
		const previousLayer = layers[layerNum - 1];

		layerWithPieces.pieces.forEach((piece, pieceNum, pieces) => {
			const isFirstPiece = pieceNum === 0;
			const isLastPiece = pieceNum === pieces.length - 1;
			const { leftCutLineSlope, xOfLeftCutIntersection } = piece;
			const xRange = [undefined, undefined];

			function getXLowerBound(_pieceNum) {
				const xWhereLeftCutIntersectsPreviousLayer =
					previousLayer?.pieces[_pieceNum]?.xOfLeftCutIntersection;
				const xWhereLeftCutIntersectsCuttingBoard =
					$cutTargetDepth / pieces[_pieceNum]?.leftCutLineSlope;

				return (
					xWhereLeftCutIntersectsPreviousLayer ??
					xWhereLeftCutIntersectsCuttingBoard
				);
			}

			// find piece's x range
			xRange[0] = xOfLeftCutIntersection;
			xRange[1] = isLastPiece
				? layerWithPieces.layerRadius
				: pieces[pieceNum + 1].xOfLeftCutIntersection;

			if (!isFirstPiece) {
				xRange[0] = getXLowerBound(pieceNum);
			}

			piece.xRange = xRange;

			// calculate piece's area by adding/subtracting integrals
			let area = getVerticalCutArea(
				layerWithPieces.layerRadius,
				piece.xOfLeftCutIntersection,
				xRange[1]
			);

			// add left cut's integral
			if (!isFirstPiece) {
				area += getAreaUnderLine({
					slope: leftCutLineSlope,
					yIntercept: -$cutTargetDepth,
					x1: xRange[0],
					x2: xOfLeftCutIntersection
				});
			}

			// subtract right cut's integral
			if (!isLastPiece) {
				const xOfRightCutIntersectionWithPreviousLayer = getXLowerBound(
					pieceNum + 1
				);

				area -= getAreaUnderLine({
					slope: pieces[pieceNum + 1].leftCutLineSlope,
					yIntercept: -$cutTargetDepth,
					x1: xOfRightCutIntersectionWithPreviousLayer,
					x2: xRange[1]
				});
			}

			// subtract previous layer's vertical cut
			const xOfLeftCutIntersectionWithPreviousLayer =
				previousLayer?.pieces[pieceNum]?.xRange[1];
			const hasPieceBelowInSlice =
				!isFirstLayer && xOfLeftCutIntersectionWithPreviousLayer > xRange[0];

			if (hasPieceBelowInSlice) {
				area -= getVerticalCutArea(
					previousLayer.layerRadius,
					previousLayer.pieces[pieceNum]?.xOfLeftCutIntersection,
					xOfLeftCutIntersectionWithPreviousLayer
				);
			}

			piece.area = area;
		});
	});

	return pieceAreas;
}
