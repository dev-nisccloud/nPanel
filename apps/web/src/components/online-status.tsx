export function formatSignedInAt(value: string | Date | null | undefined): string {
	if (!value) return "Never";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "Never";
	return date.toLocaleString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function OnlineBadge() {
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
			<span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
			Online
		</span>
	);
}
