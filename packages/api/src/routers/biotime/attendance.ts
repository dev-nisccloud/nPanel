import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import type { BioTimeClient, BioTimeEmployee, BioTimeTransaction } from "../../lib/biotime-client";
import { runBioTime } from "./call";

const PAGE_SIZE = 500;
const MAX_PAGES = 20;

const yearInput = z.object({
	empCode: z.string().trim().min(1).max(64),
	year: z.number().int().min(2026).max(2030),
});

function employeeName(employee: BioTimeEmployee): string {
	const name = [employee.first_name, employee.last_name]
		.map((part) => (typeof part === "string" ? part.trim() : ""))
		.filter(Boolean)
		.join(" ");
	return name || employee.emp_code;
}

function punchSummary(row: BioTimeTransaction) {
	return {
		punchTime: row.punch_time,
		punchState: row.punch_state,
		terminalSn: row.terminal_sn,
		terminalAlias: row.terminal_alias,
	};
}

function belongsToTerminal(row: BioTimeTransaction, terminalSn: string): boolean {
	return !row.terminal_sn || row.terminal_sn === terminalSn;
}

function isDescending(rows: BioTimeTransaction[]): boolean {
	const first = rows[0];
	const last = rows[rows.length - 1];
	if (!first || !last || rows.length < 2) return true;
	return first.punch_time >= last.punch_time;
}

async function latestPunchByEmployee(client: BioTimeClient, terminalSn: string, empCodes: Set<string>) {
	const latest = new Map<string, BioTimeTransaction>();
	const remember = (row: BioTimeTransaction) => {
		if (!row.emp_code || !belongsToTerminal(row, terminalSn)) return;
		const previous = latest.get(row.emp_code);
		if (!previous || row.punch_time > previous.punch_time) latest.set(row.emp_code, row);
	};

	const first = await client.listTransactions({ terminalSn, page: 1, pageSize: PAGE_SIZE });
	for (const row of first.data) remember(row);
	if (!first.next || first.data.length < PAGE_SIZE || first.count <= first.data.length) return latest;

	const descending = isDescending(first.data);
	const lastPage = Math.max(1, Math.ceil(first.count / PAGE_SIZE));
	const covered = () => empCodes.size > 0 && [...empCodes].every((code) => latest.has(code));

	if (descending) {
		for (let page = 2; page <= Math.min(lastPage, MAX_PAGES); page += 1) {
			if (covered()) break;
			const result = await client.listTransactions({ terminalSn, page, pageSize: PAGE_SIZE });
			for (const row of result.data) remember(row);
			if (result.data.length === 0 || !result.next) break;
		}
		return latest;
	}

	const start = lastPage === 1 ? 1 : lastPage;
	for (let offset = 0; offset < MAX_PAGES; offset += 1) {
		const page = start - offset;
		if (page < 1) break;
		if (page !== 1) {
			const result = await client.listTransactions({ terminalSn, page, pageSize: PAGE_SIZE });
			for (const row of result.data) remember(row);
		}
		if (covered()) break;
	}
	return latest;
}

export const biotimeAttendanceRouter = router({
	roster: protectedProcedure
		.input(z.object({ terminalSn: z.string().trim().min(1).max(64) }))
		.query(({ input }) =>
			runBioTime(async (client) => {
				const employees = await client.listAllEmployees();
				const codes = new Set(employees.map((employee) => employee.emp_code).filter(Boolean));
				const latest = await latestPunchByEmployee(client, input.terminalSn, codes);
				return employees.map((employee) => {
					const punch = latest.get(employee.emp_code);
					return {
						id: String(employee.id),
						empCode: employee.emp_code,
						name: employeeName(employee),
						departmentName: employee.dept_name ?? null,
						positionName: employee.position_name ?? null,
						lastPunch: punch ? punchSummary(punch) : null,
					};
				});
			}),
		),

	latest: protectedProcedure
		.input(z.object({ empCode: z.string().trim().min(1).max(64) }))
		.query(({ input }) =>
			runBioTime(async (client) => {
				const pageSize = 50;
				const first = await client.listTransactions({ empCode: input.empCode, page: 1, pageSize });
				if (first.data.length === 0) return null;
				const pickLatest = (rows: BioTimeTransaction[]) =>
					rows.reduce((best, row) => (row.punch_time > best.punch_time ? row : best));
				if (!first.next || first.data.length < pageSize || isDescending(first.data)) {
					return punchSummary(pickLatest(first.data));
				}
				const lastPage = Math.max(1, Math.ceil(first.count / pageSize));
				const last = await client.listTransactions({ empCode: input.empCode, page: lastPage, pageSize });
				const rows = last.data.length > 0 ? last.data : first.data;
				return punchSummary(pickLatest(rows));
			}),
		),

	year: protectedProcedure.input(yearInput).query(({ input }) =>
		runBioTime(async (client) => {
			const startTime = `${input.year}-01-01 00:00:00`;
			const endTime = `${input.year}-12-31 23:59:59`;
			const rows: BioTimeTransaction[] = [];
			for (let page = 1; page <= MAX_PAGES; page += 1) {
				const result = await client.listTransactions({
					empCode: input.empCode,
					startTime,
					endTime,
					page,
					pageSize: PAGE_SIZE,
				});
				rows.push(...result.data);
				if (result.data.length === 0 || result.data.length < PAGE_SIZE || !result.next) break;
			}
			return rows
				.map((row) => ({
					id: row.id,
					punchTime: row.punch_time,
					punchState: row.punch_state,
					terminalSn: row.terminal_sn,
					terminalAlias: row.terminal_alias,
				}))
				.sort((a, b) => a.punchTime.localeCompare(b.punchTime));
		}),
	),
});
