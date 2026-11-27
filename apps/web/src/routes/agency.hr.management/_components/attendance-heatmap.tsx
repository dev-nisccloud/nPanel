import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ATTENDANCE_YEARS, dayKey, formatDayLabel, formatPunchTime, punchClock, punchStateLabel } from "./punch";

export type YearPunch = {
	id: number;
	punchTime: string;
	punchState: string | null;
	terminalSn: string | null;
	terminalAlias: string | null;
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function intensity(count: number): string {
	if (count <= 0) return "bg-muted";
	if (count === 1) return "bg-primary/30";
	if (count === 2) return "bg-primary/55";
	if (count <= 4) return "bg-primary/80";
	return "bg-primary";
}

function monthWeeks(year: number, month: number): (string | null)[][] {
	const first = new Date(year, month, 1);
	const days = new Date(year, month + 1, 0).getDate();
	const pad = (first.getDay() + 6) % 7;
	const cells: (string | null)[] = [];
	for (let index = 0; index < pad; index += 1) cells.push(null);
	for (let day = 1; day <= days; day += 1) {
		const monthText = String(month + 1).padStart(2, "0");
		const dayText = String(day).padStart(2, "0");
		cells.push(`${year}-${monthText}-${dayText}`);
	}
	while (cells.length % 7 !== 0) cells.push(null);
	const weeks: (string | null)[][] = [];
	for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
	return weeks;
}

function PunchList({ punches }: { punches: YearPunch[] }) {
	return (
		<ul className="max-h-80 space-y-2 overflow-y-auto">
			{punches.map((punch) => (
				<li key={punch.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
					<div className="min-w-0">
						<p className="text-sm font-medium">{formatPunchTime(punch.punchTime)}</p>
						<p className="truncate text-xs text-muted-foreground">
							{punch.terminalAlias || punch.terminalSn || "Device not recorded"}
						</p>
					</div>
					<Badge variant="outline">{punchStateLabel(punch.punchState)}</Badge>
				</li>
			))}
		</ul>
	);
}

export function AttendanceHeatmap({
	year,
	onYearChange,
	punches,
}: {
	year: number;
	onYearChange: (year: number) => void;
	punches: YearPunch[];
}) {
	const [openDay, setOpenDay] = React.useState<string | null>(null);
	const byDay = React.useMemo(() => {
		const grouped = new Map<string, YearPunch[]>();
		for (const punch of punches) {
			const key = dayKey(punch.punchTime);
			const list = grouped.get(key);
			if (list) list.push(punch);
			else grouped.set(key, [punch]);
		}
		return grouped;
	}, [punches]);
	const openPunches = openDay ? (byDay.get(openDay) ?? []) : [];

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-1">
				<label htmlFor="attendance-year" className="text-xs text-muted-foreground">
					Year
				</label>
				<Select value={String(year)} onValueChange={(value) => onYearChange(Number(value))}>
					<SelectTrigger id="attendance-year" className="h-11 w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{ATTENDANCE_YEARS.map((option) => (
							<SelectItem key={option} value={String(option)}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="-mr-px -mb-px flex flex-wrap">
				{MONTHS.map((month, monthIndex) => {
					const weeks = monthWeeks(year, monthIndex);
					return (
						<div key={month} className="min-w-[9.5rem] flex-1 basis-1/2 border-r border-b border-border px-3 py-2.5 sm:basis-1/3">
							<h3 className="mb-1.5 text-xs font-medium">{month}</h3>
							<div
								className="grid w-full gap-[3px]"
								style={{ gridTemplateColumns: `0.75rem repeat(${weeks.length}, minmax(0, 1fr))` }}
							>
								{WEEKDAY_LABELS.map((label, dayIndex) => (
									<React.Fragment key={`${month}-row-${dayIndex}`}>
										<span className="flex items-center justify-center text-[10px] text-muted-foreground">{label}</span>
										{weeks.map((week, weekIndex) => {
											const day = week[dayIndex];
											if (!day) return <span key={`${month}-${weekIndex}-${dayIndex}`} className="aspect-square w-full" />;
											const dayPunches = byDay.get(day) ?? [];
											if (dayPunches.length === 0) {
												return (
													<span
														key={day}
														className="aspect-square w-full rounded-[2px] bg-muted"
														aria-label={`${formatDayLabel(day)}, no punches`}
													/>
												);
											}
											return (
												<Tooltip key={day}>
													<TooltipTrigger asChild>
														<button
															type="button"
															className={cn("aspect-square w-full rounded-[2px]", intensity(dayPunches.length))}
															aria-label={`${formatDayLabel(day)}, ${dayPunches.length} punches`}
															onClick={() => setOpenDay(day)}
														/>
													</TooltipTrigger>
													<TooltipContent side="top" className="max-w-xs px-3 py-2 text-left">
														<p className="mb-1 font-medium">{formatDayLabel(day)}</p>
														<ul className="space-y-0.5">
															{dayPunches.map((punch) => (
																<li key={punch.id}>
																	{punchClock(punch.punchTime)} · {punchStateLabel(punch.punchState)}
																</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											);
										})}
									</React.Fragment>
								))}
							</div>
						</div>
					);
				})}
				</div>
			</div>

			<Dialog open={openDay != null} onOpenChange={(open) => !open && setOpenDay(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{openDay ? formatDayLabel(openDay) : "Punches"}</DialogTitle>
						<DialogDescription>
							{openPunches.length === 1 ? "1 punch" : `${openPunches.length} punches`}
						</DialogDescription>
					</DialogHeader>
					<PunchList punches={openPunches} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
