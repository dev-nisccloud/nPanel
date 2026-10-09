import * as crypto from "node:crypto";
import { db } from "@npanel/db";
import { agencyPermissionDenialLog } from "@npanel/db/schema/agency-rbac";

const SENSITIVE_KEYS = ["password", "token", "secret", "key", "apiKey", "auth", "credential"];

function redact(value: unknown, depth = 0): unknown {
	if (depth > 6 || value == null) return value ?? null;
	if (typeof value !== "object") return value;
	if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));

	const result: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
		const sensitive = SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()));
		result[key] = sensitive ? "[REDACTED]" : redact(nested, depth + 1);
	}
	return result;
}

export async function recordAgencyPermissionDenial(entry: {
	userId: string;
	userEmail: string | null;
	agencyRoleId: string | null;
	agencyRoleName: string | null;
	procedurePath: string;
	procedureType: string;
	permissionKey: string;
	requiredAccess: string;
	grantedAccess: string | null;
	ipAddress: string | null;
	input: unknown;
}): Promise<void> {
	let input: unknown = null;
	try {
		const redacted = redact(entry.input);
		const serialized = JSON.stringify(redacted);
		input = serialized.length > 4000 ? { truncated: true, preview: serialized.slice(0, 4000) } : redacted;
	} catch {
		input = null;
	}

	try {
		await db.insert(agencyPermissionDenialLog).values({
			id: crypto.randomUUID(),
			createdAt: new Date(),
			userId: entry.userId,
			userEmail: entry.userEmail,
			agencyRoleId: entry.agencyRoleId,
			agencyRoleName: entry.agencyRoleName,
			procedurePath: entry.procedurePath,
			procedureType: entry.procedureType,
			permissionKey: entry.permissionKey,
			requiredAccess: entry.requiredAccess,
			grantedAccess: entry.grantedAccess,
			ipAddress: entry.ipAddress,
			input,
		});
	} catch (error) {
		console.error("[agency-rbac] failed to write permission denial log", error);
	}
}
