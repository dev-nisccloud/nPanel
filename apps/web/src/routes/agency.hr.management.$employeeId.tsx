"use client";

import { ArrowLeft } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { AttendanceHeatmap } from "./agency.hr.management/_components/attendance-heatmap";
import { defaultAttendanceYear, ATTENDANCE_YEARS, formatPunchTime, punchStateLabel } from "./agency.hr.management/_components/punch";

function employeeName(employee: { first_name: string | null; last_name: string | null; emp_code: string }) {
	const name = [employee.first_name, employee.last_name]
		.map((part) => part?.trim() ?? "")
		.filter(Boolean)
		.join(" ");
	return name || employee.emp_code;
}

function hireLabel(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HrEmployeePage() {
	const { employeeId = "" } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const yearParam = Number(searchParams.get("year"));
	const year = ATTENDANCE_YEARS.includes(yearParam as (typeof ATTENDANCE_YEARS)[number])
		? yearParam
		: defaultAttendanceYear();
	const device = searchParams.get("device");
	const backHref = device ? `/hq/hr/management?device=${encodeURIComponent(device)}` : "/hq/hr/management";

	const employee = trpc.biotime.employees.get.useQuery(
		{ id: employeeId },
		{ enabled: employeeId.length > 0 },
	);
	const yearPunches = trpc.biotime.attendance.year.useQuery(
		{ empCode: employee.data?.emp_code ?? "", year },
		{ enabled: Boolean(employee.data?.emp_code) },
	);
	const latestPunch = trpc.biotime.attendance.latest.useQuery(
		{ empCode: employee.data?.emp_code ?? "" },
		{ enabled: Boolean(employee.data?.emp_code) },
	);

	function setYear(next: number) {
		setSearchParams(
			(current) => {
				const params = new URLSearchParams(current);
				params.set("year", String(next));
				return params;
			},
			{ replace: true },
		);
	}

	if (!employeeId) {
		return (
			<div className="@container/main px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<p className="text-sm text-muted-foreground">This employee link is missing an id.</p>
			</div>
		);
	}

	if (employee.isLoading) {
		return (
			<div className="@container/main flex justify-center px-4 py-12 md:px-6 lg:px-8">
				<Spinner size={32} />
			</div>
		);
	}

	if (employee.error || !employee.data) {
		return (
			<div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto w-full max-w-4xl">
					<Button variant="ghost" size="sm" className="mb-4 -ml-2 h-11" asChild>
						<Link to={backHref}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Management
						</Link>
					</Button>
					<p className="mb-4 text-destructive">{employee.error?.message ?? "Employee not found."}</p>
					<Button variant="outline" onClick={() => employee.refetch()}>
						Try again
					</Button>
				</div>
			</div>
		);
	}

	const person = employee.data;
	const name = employeeName(person);
	const hired = hireLabel(person.hire_date);

	return (
		<div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-4xl space-y-5">
				<div className="space-y-1">
					<Button variant="ghost" size="sm" className="-ml-2 h-11 px-2" asChild>
						<Link to={backHref}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Management
						</Link>
					</Button>
					<h1 className="text-base font-semibold tracking-tight">{name}</h1>
					<p className="text-xs text-muted-foreground">Profile and attendance recorded in BioTime Cloud.</p>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<UserAvatar name={name} email={person.email} image={null} className="h-11 w-11 shrink-0" fallbackClassName="text-sm font-medium" />
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
								<p className="truncate text-sm font-semibold">{name}</p>
								{person.dept_name ? (
									<Badge variant="outline" className="h-5 px-1.5 text-[10px]">
										{person.dept_name}
									</Badge>
								) : null}
								{person.position_name ? (
									<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
										{person.position_name}
									</Badge>
								) : null}
							</div>
							<p className="truncate text-xs text-muted-foreground">
								{person.emp_code}
								{person.email ? ` · ${person.email}` : ""}
							</p>
						</div>
					</div>
					<dl className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs sm:ml-auto sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
						{hired ? (
							<div>
								<dt className="text-muted-foreground">Hired</dt>
								<dd className="font-medium">{hired}</dd>
							</div>
						) : null}
						<div>
							<dt className="text-muted-foreground">Last check-in</dt>
							<dd className="font-medium whitespace-nowrap">
								{latestPunch.isLoading ? "Loading" : formatPunchTime(latestPunch.data?.punchTime)}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Punch state</dt>
							<dd className="font-medium">
								{latestPunch.isLoading ? "Loading" : latestPunch.data ? punchStateLabel(latestPunch.data.punchState) : "None"}
							</dd>
						</div>
					</dl>
				</div>

				<div className="flex flex-col gap-5 md:flex-row md:gap-8">
					<nav aria-label="Employee" className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:w-44 md:flex-col md:overflow-visible">
						<button
							type="button"
							className={cn("rounded-md bg-background px-3 py-1.5 text-left text-sm font-medium whitespace-nowrap text-foreground shadow-sm")}
						>
							Attendance
						</button>
					</nav>
					<div className="min-w-0 flex-1">
						{yearPunches.isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-9 w-36" />
								<Skeleton className="h-40 w-full" />
							</div>
						) : yearPunches.error ? (
							<div className="py-6">
								<p className="mb-4 text-sm text-destructive">{yearPunches.error.message}</p>
								<Button variant="outline" onClick={() => yearPunches.refetch()}>
									Try again
								</Button>
							</div>
						) : (
							<AttendanceHeatmap year={year} onYearChange={setYear} punches={yearPunches.data ?? []} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
