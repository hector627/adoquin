import type { GridOptions, LayoutResult, PrevLayoutState } from "./types";
import { calcLayoutPositions } from "./utils/calcLayout";
import { midebounce } from "./utils/debounce";

const libraryName: string = "Adoquin";

export class Adoquinado {
	private readonly $grid: HTMLElement;
	private readonly $parentGrid: HTMLElement;
	private readonly options: Required<GridOptions>;

	private childHeights: Map<HTMLElement, number> = new Map();
	private isReflowPending: boolean = false;
	private isInitialRender: boolean = true;
	private containerWidth: number;

	private prevLayoutState: PrevLayoutState;

	private containerObserver: ResizeObserver | null = null;
	private childObserver: ResizeObserver | null = null;

	constructor(container: string | HTMLElement, options: GridOptions = {}) {
		const targetElement = typeof container === "string" ? document.getElementById(container) : container;

		// Validate children container
		if (!targetElement || !(targetElement instanceof HTMLElement)) {
			throw new Error(`[${libraryName}]: Element container not found`);
		}

		this.$grid = targetElement;

		// Validate parent of children container
		if (this.$grid.parentElement) {
			this.$parentGrid = this.$grid.parentElement;
		} else throw new Error(`[${libraryName}]: Element container must have a parent`);

		// Assign default values using Required<T>
		this.options = {
			gap: options.gap ?? 16,
			minColumns: options.minColumns ?? 2,
			columnWidth: options.columnWidth ?? 225,
			minContainerWidth: options.minContainerWidth ?? 268,
			onlyInternalGap: options.onlyInternalGap ?? true
		};

		this.containerWidth = 0;

		this.prevLayoutState = {
			width: 0,
			gridHeight: 0,
			docHeight: 0,
			isLocked: false
		};
	}

	/**
	 * PUBLIC METHOD: Initialize the library and enable DOM observation
	 * */
	init() {
		this.$grid.style.position = "relative";

		this.$grid.style.opacity = "0";
		this.$grid.style.transition = "opacity .2s ease-in-out";

		this.#defineObservers();

		// Register initial Children
		const initalChildren = Array.from(this.$grid.children) as HTMLElement[];
		this.#observeItems(initalChildren);
	}

	/**
	 * PRIVATE METHOD: Configurate ResizeObservers
	 * */
	#defineObservers() {
		// container Observer
		this.containerObserver = new ResizeObserver(entries => {
			this.#debounceReflow(entries);
		});

		this.containerObserver.observe(this.$parentGrid);

		// Children Observer (it's an individual observer)
		this.childObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
			let hasHeightChanged = false;

			for (const entry of entries) {
				const card = entry.target as HTMLElement;

				const newHeight = entry.borderBoxSize?.[0] ? entry.borderBoxSize[0].blockSize : entry.contentRect.height;

				const currentStoredHeight = this.childHeights.get(card) || 0;

				if (Math.abs(newHeight - currentStoredHeight) >= 1) {
					this.childHeights.set(card, newHeight);
					hasHeightChanged = true;
				}
			}

			// If element height change reorder the layout
			if (hasHeightChanged) {
				this.#scheduleReflow();
			}
		});
	}

	/**
	 * PRIVATE METHOD: Prevent multiple observations in a short period of time
	 * */
	#debounceReflow = midebounce(obj => this.#handleContainerResize(obj));

	/**
	 * PRIVATE METHOD: Manage ResizeObserver for parent of container children
	 * */
	#handleContainerResize(entries: ResizeObserverEntry[]): void {
		for (const entry of entries) {
			const newWidth = entry.contentRect.width;

			// If the container witdh change at least 1px reorder the Layout
			if (Math.abs(newWidth - this.containerWidth) >= 1) {
				this.containerWidth = newWidth;

				this.#scheduleReflow();
			}
		}
	}

	/**
	 * PRIVATE METHOD: Register an array of elements in the individual observe
	 * */
	#observeItems(children: HTMLElement[]): void {
		for (const child of children) {
			// Get and store heights of new elements
			const initialHeights = child.getBoundingClientRect().height;
			this.childHeights.set(child, initialHeights);

			this.childObserver?.observe(child);
		}
	}

	/**
	 * PRIVATE METHOD: Apply coords and styles to the DOM Elements
	 * */
	#applyTransforms(result: LayoutResult, finalGridHeight: number): void {
		const { positions, colWidth } = result;

		// Assign min-width to the container to cover the entire width of the child elements on small screens
		if (this.containerWidth < this.options.minContainerWidth) {
			let spaceInline = (result.marginX + result.paddingX) / 2,
				minRequiredWidth = this.options.minContainerWidth + spaceInline;

			this.$grid.style.minWidth = `${minRequiredWidth}px`;
		}

		for (const { child, x, y } of positions) {
			// Apply basic styles just one first time
			if (child.style.position !== "absolute") {
				child.style.position = "absolute";
				child.style.top = "0";
				child.style.left = "0";
				child.style.willChange = "transform";
			}

			child.style.width = `${colWidth}px`;

			child.style.transform = `translate3d(${x}px, ${y}px, 0)`;

			// Ignore transition if it's the first render
			if (!this.isInitialRender && !child.style.transition) {
				child.style.transition = "transform 0.3s";
			}
		}

		// Assign height to the parent container to prevent images/videos downloaded pushing the content
		this.$grid.style.height = `${finalGridHeight}px`;

		if (this.isInitialRender) {
			this.isInitialRender = false;

			// Show grid if we are in the first render
			requestAnimationFrame(() => {
				this.$grid.style.opacity = "1";
			});
		}
	}

	/**
	 * PRIVATE METHOD: Coordinate the reordering with requestAnimationFrame and loop prevention
	 * */
	#scheduleReflow() {
		if (this.isReflowPending) return;
		this.isReflowPending = true;

		requestAnimationFrame(() => {
			const viewportHeight = window.innerHeight;

			// Calc positions
			const result = calcLayoutPositions(this.containerWidth, this.$parentGrid, this.childHeights, this.options);

			// Diference between the prev and current width of the container (Positive = container shrank)
			const widthDiff = this.prevLayoutState.width - this.containerWidth;
			const isScrollbarJump = widthDiff >= 10 && widthDiff <= 25;

			// Prev state had an scrollbar?
			const prevHadScrollbar = this.prevLayoutState.docHeight > viewportHeight;

			// prev frame was locked?
			const wasLocked = this.prevLayoutState.isLocked || false;

			// Rules:
			// If page had scrollbar and its width dropped because of the bar (10-25px): LOCK IMMEDIATELY
			// If we were already locked the layout and the user hasn't manually changed the window (|widthDiff| < 10): Maintein the lock
			const shouldLock = (prevHadScrollbar && isScrollbarJump) || (wasLocked && Math.abs(widthDiff) < 10);

			let finalGridHeight = result.maxContainerHeight;

			if (shouldLock) {
				finalGridHeight = this.prevLayoutState.gridHeight;
			}

			// 5. Apply to the DOM
			this.#applyTransforms(result, finalGridHeight);

			this.prevLayoutState = {
				width: this.containerWidth,
				gridHeight: finalGridHeight,
				docHeight: document.documentElement.scrollHeight,
				isLocked: shouldLock
			};

			this.isReflowPending = false;
		});
	}

	/**
	 * PUBLIC METHOD: Add more elements to the grid to be observed (e.g. infinite scroll)
	 */
	append(newItems: HTMLElement[] | NodeListOf<HTMLElement> | HTMLCollection) {
		if (!newItems) {
			throw new Error(`${libraryName}: No elements were provided`);
		}

		const children = Array.from(newItems) as HTMLElement[];

		children.forEach(child => {
			this.$grid.appendChild(child);
		});

		this.#observeItems(children);
		this.#scheduleReflow();
	}

	/**
	 * PUBLIC METHOD: Manual Reordering of the Layout
	 */
	update() {
		this.#scheduleReflow();
	}

	/**
	 * PUBLIC METHOD: Destroy instance and memory cleaning
	 */
	destroy() {
		// Disconnet observers
		if (this.containerObserver) this.containerObserver.disconnect();
		if (this.childObserver) this.childObserver.disconnect();

		const children = Array.from(this.$grid.children) as HTMLElement[];

		// Clear styles of children
		children.forEach(child => {
			child.style.position = "";
			child.style.top = "";
			child.style.left = "";
			child.style.width = "";
			child.style.transform = "";
			child.style.transition = "";
			child.style.willChange = "";
		});

		// Clear container styles
		this.$grid.style.height = "";
		this.$grid.style.position = "";
		this.$grid.style.opacity = "";
		this.$grid.style.transition = "";

		// Clear heights Map
		this.childHeights.clear();
	}
}
