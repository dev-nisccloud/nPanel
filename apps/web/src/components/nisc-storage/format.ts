const DECIMAL_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
const BINARY_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

function formatWithBase(bytes: number, base: 1000 | 1024, units: readonly string[]): string {
	if (!Number.isFinite(bytes) || bytes < 0) return "-";
	if (bytes === 0) return "0 B";
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
	const value = bytes / base ** index;
	const digits = index === 0 || value >= 10 ? 0 : 1;
	return `${value.toFixed(digits)} ${units[index]}`;
}

/** Plan sizes are decimal: 50 GB is 50,000,000,000 bytes. */
export function formatPlanBytes(value: string | number): string {
	const bytes = typeof value === "number" ? value : Number(value);
	return formatWithBase(bytes, 1000, DECIMAL_UNITS);
}

/** File sizes use 1024 so a 100 MB file cap matches the plan. */
export function formatFileBytes(value: number): string {
	return formatWithBase(value, 1024, BINARY_UNITS);
}

export function bytesFromPlanGigabytes(gigabytes: number): string | null {
	if (!Number.isInteger(gigabytes) || gigabytes < 1 || gigabytes > 11000) return null;
	return String(gigabytes * 1_000_000_000);
}

export function bytesFromFileMegabytes(megabytes: number): string | null {
	if (!Number.isInteger(megabytes) || megabytes < 1 || megabytes > 5120) return null;
	return String(megabytes * 1024 * 1024);
}

export function gigabytesFromPlanBytes(value: string): number {
	const bytes = Number(value);
	if (!Number.isFinite(bytes) || bytes <= 0) return 1;
	return Math.min(11000, Math.max(1, Math.round(bytes / 1_000_000_000)));
}

export function megabytesFromFileBytes(value: string): number {
	const bytes = Number(value);
	if (!Number.isFinite(bytes) || bytes <= 0) return 1;
	return Math.min(5120, Math.max(1, Math.round(bytes / (1024 * 1024))));
}

export function usagePercent(used: string, quota: string): number {
	const usedBytes = Number(used);
	const quotaBytes = Number(quota);
	if (!Number.isFinite(usedBytes) || !Number.isFinite(quotaBytes) || quotaBytes <= 0) return 0;
	return Math.min(100, Math.max(0, (usedBytes / quotaBytes) * 100));
}

export function parentPrefix(prefix: string): string {
	const parts = prefix.split("/").filter(Boolean);
	parts.pop();
	return parts.join("/");
}

export function prefixName(prefix: string): string {
	return prefix.split("/").filter(Boolean).pop() ?? prefix;
}

export function joinPrefix(folder: string, name: string): string {
	return folder ? `${folder}/${name}` : name;
}

const CONTENT_TYPE = /^[\w!#$&^.+-]{1,64}\/[\w!#$&^.+-]{1,120}$/;

export function contentTypeFor(file: File): string {
	const raw = file.type.trim();
	return CONTENT_TYPE.test(raw) ? raw : "application/octet-stream";
}

export function fileNameError(name: string): string | null {
	const trimmed = name.trim();
	if (!trimmed) return "Enter a name.";
	if (trimmed.length > 200) return "Use a name under 200 characters.";
	if (trimmed === "." || trimmed === "..") return "That name is not allowed.";
	if (/[\\/]/.test(trimmed) || /[\u0000-\u001f\u007f]/.test(trimmed)) return "That name is not allowed.";
	if (trimmed.startsWith("_nisc-")) return "That name is reserved.";
	return null;
}

export function errorMessage(error: unknown): string {
	return error instanceof Error && error.message ? error.message : "Something went wrong.";
}
