/**
 * A file transfer must keep the signed-in page alive. The idle session
 * otherwise expires and the login redirect aborts the browser upload.
 */
let depth = 0;
const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) listener();
}

export function hasActiveTransfer() {
	return depth > 0;
}

export function holdActiveTransfer(): () => void {
	depth += 1;
	if (depth === 1) emit();
	let released = false;
	return () => {
		if (released) return;
		released = true;
		depth = Math.max(0, depth - 1);
		if (depth === 0) emit();
	};
}

export function subscribeActiveTransfer(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
