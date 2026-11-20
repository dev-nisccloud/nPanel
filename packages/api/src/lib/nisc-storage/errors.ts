export type StorageErrorCode =
	| "NOT_CONFIGURED"
	| "DENIED"
	| "NOT_FOUND"
	| "CONFLICT"
	| "LIMIT"
	| "FAILED";

export class StorageOperationError extends Error {
	constructor(
		message: string,
		readonly code: StorageErrorCode = "FAILED",
	) {
		super(message);
		this.name = "StorageOperationError";
	}
}

/** Drop anything that could be a credential before it is stored or logged. */
export function sanitizeStorageError(error: unknown): string {
	const raw = error instanceof Error ? error.message : "Object storage request failed";
	return raw
		.replace(/[A-Za-z0-9+/]{32,}={0,2}/g, "[redacted]")
		.replace(/[A-Fa-f0-9]{32,}/g, "[redacted]")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 400);
}
