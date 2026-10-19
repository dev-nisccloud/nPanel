/**
 * Server-side client for the NISC Mail MCP admin routes.
 * The admin API key stays in NISC_MAIL_MCP_API_KEY and is never returned to the browser.
 */

const DEFAULT_BASE_URL = "https://nisc-mail-mcp.nisccloud.com";

export type MailMcpMailbox = {
	id: string;
	email: string;
	displayName: string;
	imapHost: string;
	imapPort: number;
	imapUsername: string;
	imapSecurity: string;
	smtpHost: string;
	smtpPort: number;
	smtpUsername: string;
	smtpSecurity: string;
	lastSyncAt: string | null;
	lastSyncError: string;
	createdAt: string;
	updatedAt: string;
};

export type MailMcpUser = {
	id: string;
	displayName: string;
	email: string;
	createdAt: string;
	mailboxCount: number;
	mailboxes: MailMcpMailbox[];
};

export type MailMcpIssuedUser = {
	id: string;
	token: string;
	displayName: string;
	email: string;
	setupUrl: string;
	mcpUrl: string;
};

export class MailMcpRequestError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "MailMcpRequestError";
	}
}

function baseUrl(): string {
	const raw = process.env.NISC_MAIL_MCP_BASE_URL?.trim() || DEFAULT_BASE_URL;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new MailMcpRequestError("NISC_MAIL_MCP_BASE_URL is not a valid URL", 500);
	}
	const host = url.hostname.toLowerCase();
	const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
	if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
		throw new MailMcpRequestError("NISC_MAIL_MCP_BASE_URL must use HTTPS", 500);
	}
	return raw.replace(/\/+$/, "");
}

function apiKey(): string {
	const key = process.env.NISC_MAIL_MCP_API_KEY?.trim();
	if (!key) {
		throw new MailMcpRequestError("NISC_MAIL_MCP_API_KEY is not configured", 503);
	}
	return key;
}

async function mailMcpFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const root = baseUrl();
	const key = apiKey();
	let response: Response;
	try {
		response = await fetch(`${root}${path}`, {
			...init,
			redirect: "error",
			signal: AbortSignal.timeout(20_000),
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${key}`,
				...init.headers,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "request failed";
		throw new MailMcpRequestError(`Mail MCP could not be reached (${message})`, 502);
	}
	return response;
}

async function readError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { error?: unknown };
		if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
	} catch {
		// Non-JSON bodies stay generic so a token never lands in an error string.
	}
	return "Mail MCP request failed";
}

export function mailMcpPublicUrls(): { setupUrl: string; mcpUrl: string } {
	const root = baseUrl();
	return { setupUrl: `${root}/setup`, mcpUrl: `${root}/mcp` };
}

export async function listMailMcpUsers(): Promise<MailMcpUser[]> {
	const response = await mailMcpFetch("/v1/users");
	if (!response.ok) {
		throw new MailMcpRequestError(await readError(response), response.status);
	}
	const body = (await response.json()) as { users?: unknown[] };
	if (!Array.isArray(body.users)) {
		throw new MailMcpRequestError("Mail MCP returned an unexpected user list", 502);
	}
	return body.users.map(parseUser);
}

export async function getMailMcpUser(id: string): Promise<MailMcpUser> {
	const response = await mailMcpFetch(`/v1/users/${encodeURIComponent(id)}`);
	if (!response.ok) {
		throw new MailMcpRequestError(await readError(response), response.status);
	}
	return parseUser(await response.json());
}

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function parseMailbox(value: unknown): MailMcpMailbox | null {
	if (!value || typeof value !== "object") return null;
	const row = value as Record<string, unknown>;
	if (typeof row.id !== "string" || !row.id) return null;
	const lastSyncAt = asString(row.lastSyncAt);
	return {
		id: row.id,
		email: asString(row.email),
		displayName: asString(row.displayName),
		imapHost: asString(row.imapHost),
		imapPort: typeof row.imapPort === "number" ? row.imapPort : 0,
		imapUsername: asString(row.imapUsername),
		imapSecurity: asString(row.imapSecurity),
		smtpHost: asString(row.smtpHost),
		smtpPort: typeof row.smtpPort === "number" ? row.smtpPort : 0,
		smtpUsername: asString(row.smtpUsername),
		smtpSecurity: asString(row.smtpSecurity),
		lastSyncAt: lastSyncAt || null,
		lastSyncError: asString(row.lastSyncError),
		createdAt: asString(row.createdAt),
		updatedAt: asString(row.updatedAt),
	};
}

function parseUser(value: unknown): MailMcpUser {
	const row = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
	const mailboxes = Array.isArray(row.mailboxes)
		? row.mailboxes.flatMap((item) => {
				const mailbox = parseMailbox(item);
				return mailbox ? [mailbox] : [];
			})
		: [];
	return {
		id: asString(row.id),
		displayName: asString(row.displayName),
		email: asString(row.email),
		createdAt: asString(row.createdAt),
		mailboxCount: typeof row.mailboxCount === "number" ? row.mailboxCount : mailboxes.length,
		mailboxes,
	};
}

export async function createMailMcpUser(input: {
	displayName: string;
	email: string;
}): Promise<MailMcpIssuedUser> {
	const response = await mailMcpFetch("/v1/users", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			displayName: input.displayName,
			email: input.email,
		}),
	});
	if (!response.ok) {
		throw new MailMcpRequestError(await readError(response), response.status);
	}
	const body = (await response.json()) as Partial<MailMcpIssuedUser>;
	if (!body.id || !body.token) {
		throw new MailMcpRequestError("Mail MCP did not return a user token", 502);
	}
	const urls = mailMcpPublicUrls();
	return {
		id: body.id,
		token: body.token,
		displayName: body.displayName ?? input.displayName,
		email: body.email ?? input.email,
		setupUrl: urls.setupUrl,
		mcpUrl: urls.mcpUrl,
	};
}

export async function rotateMailMcpToken(id: string): Promise<MailMcpIssuedUser> {
	const response = await mailMcpFetch(`/v1/users/${encodeURIComponent(id)}/token`, {
		method: "POST",
	});
	if (!response.ok) {
		throw new MailMcpRequestError(await readError(response), response.status);
	}
	const body = (await response.json()) as Partial<MailMcpIssuedUser>;
	if (!body.id || !body.token) {
		throw new MailMcpRequestError("Mail MCP did not return a user token", 502);
	}
	const urls = mailMcpPublicUrls();
	return {
		id: body.id,
		token: body.token,
		displayName: body.displayName ?? "",
		email: body.email ?? "",
		setupUrl: urls.setupUrl,
		mcpUrl: urls.mcpUrl,
	};
}

export async function deleteMailMcpUser(id: string): Promise<void> {
	const response = await mailMcpFetch(`/v1/users/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
	if (response.status === 204) return;
	if (!response.ok) {
		throw new MailMcpRequestError(await readError(response), response.status);
	}
}
