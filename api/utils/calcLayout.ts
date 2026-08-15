import type { GridOptions, LayoutResult } from "../types.js";

export function calcLayoutPositions(containerWidth: number, $parentGrid: HTMLElement, childHeights: Map<HTMLElement, number>, options: Required<GridOptions>): LayoutResult {
	const styles = window.getComputedStyle($parentGrid),
		paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight),
		marginX = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);

	// Get right container width
	const effectiveWidth = Math.max(options.minContainerWidth, containerWidth);

	// Calc columns per width
	const columns = Math.max(options.minColumns, Math.floor((containerWidth + options.gap) / (options.columnWidth + options.gap)));

	// Calc child width
	const totalGap = options.onlyInternalGap ? (columns - 1) * options.gap : (columns + 1) * options.gap;
	const childWidth = (effectiveWidth - totalGap) / columns;

	// Create array of columns heights
	const columnHeights = new Array(columns).fill(0);

	// initial x and y positions
	let x,
		y,
		initialXOffset = options.onlyInternalGap ? 0 : options.gap;

	const childPositions = [];

	for (const [child, height] of childHeights) {
		let minColIndex = 0;
		let minColHeight = columnHeights[0];

		for (let col = 1; col < columns; col++) {
			if (columnHeights[col] < minColHeight) {
				minColHeight = columnHeights[col];
				minColIndex = col;
			}
		}

		x = initialXOffset + minColIndex * (childWidth + options.gap);
		y = minColHeight;

		childPositions.push({
			child,
			x,
			y
		});

		columnHeights[minColIndex] += height + options.gap;
	}

	const maxContainerHeight = Math.max(...columnHeights);

	return {
		positions: childPositions,
		maxContainerHeight,
		colWidth: childWidth,
		paddingX,
		marginX
	};
}
