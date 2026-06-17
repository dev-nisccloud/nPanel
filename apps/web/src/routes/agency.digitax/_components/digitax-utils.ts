export function extractDigitaxArray<T>(data: unknown): T[] {
	if (!data) return [];
	if (Array.isArray(data)) return data as T[];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.data)) return record.data as T[];
	const result = record.result as Record<string, unknown> | undefined;
	if (result?.data && Array.isArray((result.data as Record<string, unknown>).data)) {
		return (result.data as Record<string, unknown>).data as T[];
	}
	if (result?.data && Array.isArray(result.data)) return result.data as T[];
	return [];
}

export function formatDigitaxDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "-";
	if (dateStr.length === 8) {
		const year = dateStr.substring(0, 4);
		const month = dateStr.substring(4, 6);
		const day = dateStr.substring(6, 8);
		const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10));
		return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
	}
	const date = new Date(dateStr);
	return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
}

export function getDigitaxStatusBadgeClass(status: string): string {
	const normalized = status.toUpperCase();
	const statusColors: Record<string, string> = {
		COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		RECEIVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
		PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
		FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		VALIDATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		MISMATCH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		HEAD_OFFICE: "bg-primary/10 text-primary border-primary/20",
		BRANCH: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
	};
	return statusColors[normalized] ?? "";
}
