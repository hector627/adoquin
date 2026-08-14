export type GridOptions = Partial<{
	gap: number;
	minColumns: number;
	columnWidth: number;
	minContainerWidth: number;
	onlyInternalGap: boolean;
}>;

export type PrevLayoutState = {
	width: number;
	gridHeight: number;
	docHeight: number;
	isLocked: boolean;
};

type PositionItem = {
	child: HTMLElement;
	x: number;
	y: number;
};

export type LayoutResult = {
	positions: PositionItem[];
	maxContainerHeight: number;
	colWidth: number;
	paddingX: number;
	marginX: number;
};
