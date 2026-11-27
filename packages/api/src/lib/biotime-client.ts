import { request } from "undici";
import { env } from "@npanel/env/server";

const REQUEST_TIMEOUT_MS = 30_000;
const FALLBACK_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 60_000;

export class BioTimeConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BioTimeConfigError";
	}
}

export class BioTimeApiError extends Error {
	constructor(
		message: string,
		readonly statusCode: number,
		readonly body?: unknown,
	) {
		super(message);
		this.name = "BioTimeApiError";
	}
}

export type BioTimeConfig = {
	baseUrl: string;
	email: string;
	password: string;
	company: string;
};

export type BioTimePage<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	msg: string;
	code: number;
	data: T[];
};

export type BioTimeCompanyRef = { id: string; name: string } | string | null;

export type BioTimeAreaRef = {
	id: number;
	area_code: string;
	area_name: string;
} | null;

export type BioTimeDevice = {
	id: number;
	sn: string;
	ip_address: string | null;
	alias: string | null;
	terminal_name: string | null;
	fw_ver: string | null;
	push_ver: string | null;
	state: number | null;
	terminal_tz: number | null;
	area: BioTimeAreaRef;
	last_activity: string | null;
	user_count: number | null;
	fp_count: number | null;
	face_count: number | null;
	palm_count: number | null;
	transaction_count: number | null;
	push_time: string | null;
	transfer_time: string | null;
	transfer_interval: number | null;
	is_attendance: number | null;
	area_name: string | null;
	company: BioTimeCompanyRef;
};

export type BioTimeEmployee = {
	id: string | number;
	emp_code: string;
	first_name: string | null;
	last_name: string | null;
	nickname?: string | null;
	department: number | null;
	dept_name?: string | null;
	position: number | null;
	position_name?: string | null;
	hire_date: string | null;
	gender?: string | null;
	birthday?: string | null;
	mobile?: string | null;
	email?: string | null;
	enable_att?: boolean | null;
	enable_overtime?: boolean | null;
	enable_holiday?: boolean | null;
	area?: number[];
	app_status?: number | null;
	app_role?: number | null;
};

export type BioTimeTransaction = {
	id: number;
	emp_code: string;
	emp: string | number | null;
	punch_time: string;
	punch_state: string | null;
	verify_type: number | null;
	work_code: string | null;
	terminal_sn: string | null;
	terminal_alias: string | null;
	terminal: number | null;
	area_alias: string | null;
	longitude: string | number | null;
	latitude: string | number | null;
	gps_location: string | null;
	mobile: string | null;
	source: number | null;
	purpose: number | null;
	crc: string | null;
	is_attendance: number | boolean | null;
	reserved: string | null;
	upload_time: string | null;
	sync_status: string | null;
	sync_time: string | null;
	temperature: string | number | null;
	mask_flag: string | number | null;
	company: BioTimeCompanyRef;
};

export type BioTimeDeviceListQuery = {
	page?: number;
	pageSize?: number;
	sn?: string;
	alias?: string;
	area?: string | number;
};

export type BioTimeEmployeeListQuery = {
	page?: number;
	pageSize?: number;
	empCode?: string;
	firstName?: string;
	lastName?: string;
	department?: number;
	appStatus?: number;
};

export type BioTimeTransactionListQuery = {
	page?: number;
	pageSize?: number;
	empCode?: string;
	terminalSn?: string;
	startTime?: string;
	endTime?: string;
};

export type BioTimeSession = {
	expiresAt: string | null;
};

type QueryValue = string | number | boolean | null | undefined;

function trimSlash(url: string): string {
	return url.replace(/\/+$/, "");
}

export function isBioTimeConfigured(): boolean {
	return Boolean(
		env.BIOTIME_BASE_URL && env.BIOTIME_EMAIL && env.BIOTIME_PASSWORD && env.BIOTIME_COMPANY,
	);
}

export function readBioTimeConfig(): BioTimeConfig {
	const baseUrl = env.BIOTIME_BASE_URL;
	const email = env.BIOTIME_EMAIL;
	const password = env.BIOTIME_PASSWORD;
	const company = env.BIOTIME_COMPANY;
	if (!baseUrl || !email || !password || !company) {
		throw new BioTimeConfigError(
			"BioTime Cloud is not configured. Set BIOTIME_BASE_URL, BIOTIME_EMAIL, BIOTIME_PASSWORD, and BIOTIME_COMPANY.",
		);
	}
	return { baseUrl: trimSlash(baseUrl), email, password, company };
}

export function bioTimeHost(): string | null {
	if (!env.BIOTIME_BASE_URL) return null;
	try {
		return new URL(env.BIOTIME_BASE_URL).host;
	} catch {
		return null;
	}
}

function jwtExpiryMs(token: string): number | null {
	const part = token.split(".")[1];
	if (!part) return null;
	try {
		const padded = part.replace(/-/g, "+").replace(/_/g, "/");
		const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: unknown };
		return typeof json.exp === "number" ? json.exp * 1000 : null;
	} catch {
		return null;
	}
}

function pickToken(body: unknown): string | null {
	if (!body || typeof body !== "object") return null;
	const row = body as Record<string, unknown>;
	for (const key of ["token", "access", "jwt"]) {
		const value = row[key];
		if (typeof value === "string" && value.length > 0) return value;
	}
	return null;
}

function messageFromBody(body: unknown, fallback: string): string {
	if (!body || typeof body !== "object") return fallback;
	const row = body as Record<string, unknown>;
	if (typeof row.detail === "string" && row.detail.trim()) return row.detail.trim();
	if (typeof row.msg === "string" && row.msg.trim()) return row.msg.trim();
	if (typeof row.message === "string" && row.message.trim()) return row.message.trim();
	if (Array.isArray(row.non_field_errors) && row.non_field_errors.length > 0) {
		return row.non_field_errors.map((item) => String(item)).join(" ");
	}
	const fields = Object.entries(row)
		.filter(([, value]) => Array.isArray(value) && value.length > 0)
		.map(([key, value]) => `${key}: ${(value as unknown[]).map((item) => String(item)).join(", ")}`);
	return fields.length > 0 ? fields.join("; ") : fallback;
}

function isFailureCode(code: unknown): boolean {
	if (code === undefined || code === null || code === "") return false;
	return code !== 0 && code !== "0";
}

function asObject<T>(body: unknown): T {
	if (body && typeof body === "object" && "data" in body) {
		const data = (body as { data?: unknown }).data;
		if (data && typeof data === "object" && !Array.isArray(data)) return data as T;
	}
	return body as T;
}

function asPage<T>(body: unknown): BioTimePage<T> {
	const row = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
	const data = Array.isArray(row.data) ? row.data : Array.isArray(row.results) ? row.results : [];
	const code = typeof row.code === "number" ? row.code : 0;
	return {
		count: typeof row.count === "number" ? row.count : data.length,
		next: typeof row.next === "string" ? row.next : null,
		previous: typeof row.previous === "string" ? row.previous : null,
		msg: typeof row.msg === "string" ? row.msg : "",
		code,
		data: data as T[],
	};
}

function queryString(params: Record<string, QueryValue>): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === "") continue;
		search.append(key, String(value));
	}
	const qs = search.toString();
	return qs ? `?${qs}` : "";
}

export class BioTimeClient {
	private token: string | null = null;
	private tokenExpiresAt = 0;

	constructor(private readonly config: BioTimeConfig) {}

	private static cached: { signature: string; client: BioTimeClient } | null = null;

	static fromEnv(): BioTimeClient {
		const config = readBioTimeConfig();
		const signature = [config.baseUrl, config.email, config.password, config.company].join("\0");
		if (!BioTimeClient.cached || BioTimeClient.cached.signature !== signature) {
			BioTimeClient.cached = { signature, client: new BioTimeClient(config) };
		}
		return BioTimeClient.cached.client;
	}

	async authenticate(options?: { force?: boolean }): Promise<BioTimeSession> {
		if (!options?.force && this.token && Date.now() < this.tokenExpiresAt - TOKEN_REFRESH_SKEW_MS) {
			const exp = jwtExpiryMs(this.token);
			return { expiresAt: exp ? new Date(exp).toISOString() : null };
		}

		const body = await this.raw("POST", "/jwt-api-token-auth/", {
			email: this.config.email,
			password: this.config.password,
			company: this.config.company,
		});
		const token = pickToken(body);
		if (!token) {
			throw new BioTimeApiError(
				messageFromBody(body, "BioTime Cloud did not return an auth token."),
				502,
				body,
			);
		}
		const exp = jwtExpiryMs(token);
		this.token = token;
		this.tokenExpiresAt = exp ?? Date.now() + FALLBACK_TOKEN_TTL_MS;
		return { expiresAt: exp ? new Date(exp).toISOString() : null };
	}

	async listDevices(query: BioTimeDeviceListQuery = {}): Promise<BioTimePage<BioTimeDevice>> {
		const body = await this.authorized("GET", "/iclock/api/terminals/", {
			page: query.page,
			page_size: query.pageSize,
			sn: query.sn,
			alias: query.alias,
			area: query.area,
		});
		return asPage<BioTimeDevice>(body);
	}

	async getDevice(id: number | string): Promise<BioTimeDevice> {
		const body = await this.authorized("GET", `/iclock/api/terminals/${encodeURIComponent(String(id))}/`);
		return asObject<BioTimeDevice>(body);
	}

	async listEmployees(query: BioTimeEmployeeListQuery = {}): Promise<BioTimePage<BioTimeEmployee>> {
		const body = await this.authorized("GET", "/personnel/api/employees/", {
			page: query.page,
			limit: query.pageSize,
			page_size: query.pageSize,
			emp_code: query.empCode,
			first_name: query.firstName,
			last_name: query.lastName,
			department: query.department,
			app_status: query.appStatus,
		});
		return asPage<BioTimeEmployee>(body);
	}

	async getEmployee(id: string): Promise<BioTimeEmployee> {
		const body = await this.authorized("GET", `/personnel/api/employees/${encodeURIComponent(id)}/`);
		return asObject<BioTimeEmployee>(body);
	}

	async listTransactions(query: BioTimeTransactionListQuery = {}): Promise<BioTimePage<BioTimeTransaction>> {
		const body = await this.authorized("GET", "/iclock/api/transactions/", {
			page: query.page,
			page_size: query.pageSize,
			emp_code: query.empCode,
			terminal_sn: query.terminalSn,
			start_time: query.startTime,
			end_time: query.endTime,
		});
		return asPage<BioTimeTransaction>(body);
	}

	async listAllDevices(): Promise<BioTimeDevice[]> {
		return this.collectPages((page, pageSize) => this.listDevices({ page, pageSize }), 100, 20);
	}

	async listAllEmployees(): Promise<BioTimeEmployee[]> {
		return this.collectPages((page, pageSize) => this.listEmployees({ page, pageSize }), 200, 40);
	}

	private async collectPages<T>(
		load: (page: number, pageSize: number) => Promise<BioTimePage<T>>,
		pageSize: number,
		maxPages: number,
	): Promise<T[]> {
		const rows: T[] = [];
		let total = Number.POSITIVE_INFINITY;
		for (let page = 1; page <= maxPages && rows.length < total; page += 1) {
			const result = await load(page, pageSize);
			total = result.count;
			rows.push(...result.data);
			if (result.data.length === 0 || result.data.length < pageSize || !result.next) break;
		}
		return rows;
	}

	private async authorized(
		method: "GET" | "POST",
		path: string,
		query?: Record<string, QueryValue>,
	): Promise<unknown> {
		await this.authenticate();
		try {
			return await this.raw(method, `${path}${queryString(query ?? {})}`, undefined, this.token);
		} catch (error) {
			if (!(error instanceof BioTimeApiError) || error.statusCode !== 401) throw error;
			this.token = null;
			this.tokenExpiresAt = 0;
			await this.authenticate({ force: true });
			return this.raw(method, `${path}${queryString(query ?? {})}`, undefined, this.token);
		}
	}

	private async raw(
		method: "GET" | "POST",
		path: string,
		body?: unknown,
		token?: string | null,
	): Promise<unknown> {
		const headers: Record<string, string> = { Accept: "application/json" };
		if (body !== undefined) headers["Content-Type"] = "application/json";
		if (token) headers.Authorization = `JWT ${token}`;

		let res: Awaited<ReturnType<typeof request>>;
		try {
			res = await request(`${this.config.baseUrl}${path}`, {
				method,
				headers,
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
		} catch (error) {
			const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
			throw new BioTimeApiError(
				timedOut ? "BioTime Cloud did not respond in time." : "BioTime Cloud could not be reached.",
				timedOut ? 504 : 502,
			);
		}

		const text = await res.body.text();
		let parsed: unknown = null;
		if (text) {
			try {
				parsed = JSON.parse(text);
			} catch {
				throw new BioTimeApiError(
					`BioTime Cloud returned a non-JSON response (${res.statusCode}).`,
					res.statusCode || 502,
				);
			}
		}

		if (res.statusCode >= 400) {
			throw new BioTimeApiError(
				messageFromBody(parsed, `BioTime Cloud request failed (${res.statusCode}).`),
				res.statusCode,
				parsed,
			);
		}

		if (isFailureCode(parsed && typeof parsed === "object" ? (parsed as { code?: unknown }).code : undefined)) {
			throw new BioTimeApiError(
				messageFromBody(parsed, "BioTime Cloud rejected the request."),
				res.statusCode || 502,
				parsed,
			);
		}

		return parsed;
	}
}
