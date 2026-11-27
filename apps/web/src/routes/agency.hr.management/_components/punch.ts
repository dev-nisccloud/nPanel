import { formatSignedInAt } from "@/components/online-status";

const PUNCH_STATE_LABELS: Record<string, string> = {
	"0": "Check in",
	"1": "Check out",
	"2": "Break out",
	"3": "Break in",
	"4": "Overtime in",
	"5": "Overtime out",
	"255": "Other",
};

export const ATTENDANCE_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export function defaultAttendanceYear(): number {
	const year = new Date().getFullYear();
	if (year >= ATTENDANCE_YEARS[0] && year <= ATTENDANCE_YEARS[ATTENDANCE_YEARS.length - 1]) return year;
	return ATTENDANCE_YEARS[0];
}

export function punchStateLabel(state: string | null | undefined): string {
	if (state == null || state === "") return "Unknown";
	return PUNCH_STATE_LABELS[state] ?? `State ${state}`;
}

export function formatPunchTime(value: string | null | undefined): string {
	if (!value) return "No punch";
	const date = new Date(value.replace(" ", "T"));
	if (Number.isNaN(date.getTime())) return value;
	return formatSignedInAt(date);
}

export function punchClock(value: string): string {
	const time = value.slice(11, 16);
	return time || value;
}

export function dayKey(value: string): string {
	return value.slice(0, 10);
}

export function formatDayLabel(key: string): string {
	const date = new Date(`${key}T00:00:00`);
	if (Number.isNaN(date.getTime())) return key;
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
