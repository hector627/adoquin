export function midebounce<T extends (...args: any[]) => void>(fn: T, ms: number = 150) {
	let timerId: ReturnType<typeof setTimeout> | null = null;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		if (timerId !== null) {
			clearTimeout(timerId);
		}

		timerId = setTimeout(() => {
			fn.apply(this, args);
		}, ms);
	};
}
