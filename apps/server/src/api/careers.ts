import type { Context } from "hono";
import { TRPCError } from "@trpc/server";
import { auth } from "@npanel/auth";
import { assertAgencyProcedureAccess } from "@npanel/api/lib/agency-permissions/assert";
import { readCareerApplicationFile, submitCareerApplication } from "@npanel/api/lib/careers/applications";

const MAX_BYTES = 5 * 1024 * 1024;
const recentApplies = new Map<string, number[]>();

function clientIp(c: Context) {
	const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || c.req.header("x-real-ip") || "unknown";
}

function allowApply(ip: string) {
	const now = Date.now();
	const recent = (recentApplies.get(ip) ?? []).filter((at) => now - at < 60 * 60 * 1000);
	if (recent.length >= 8) {
		recentApplies.set(ip, recent);
		return false;
	}
	recent.push(now);
	recentApplies.set(ip, recent);
	return true;
}

function textField(form: FormData, name: string) {
	const value = form.get(name);
	return typeof value === "string" ? value : "";
}

export async function handleCareerApply(c: Context) {
	if (!allowApply(clientIp(c))) {
		return c.json({ error: "Too many applications from this network. Try again in a little while." }, 429);
	}
	const length = Number(c.req.header("content-length") || 0);
	if (length > MAX_BYTES + 512 * 1024) {
		return c.json({ error: "Upload a PDF or DOCX up to 5 MB." }, 413);
	}

	let form: FormData;
	try {
		form = await c.req.formData();
	} catch {
		return c.json({ error: "The application could not be read. Try again." }, 400);
	}
	if (textField(form, "website").trim()) {
		return c.json({ ok: true });
	}
	const file = form.get("cv");
	if (!(file instanceof File)) {
		return c.json({ error: "Upload your CV as a PDF or DOCX." }, 400);
	}
	const bytes = Buffer.from(await file.arrayBuffer());
	try {
		await submitCareerApplication({
			slug: textField(form, "slug"),
			fullName: textField(form, "fullName"),
			email: textField(form, "email"),
			phone: textField(form, "phone"),
			availableFrom: textField(form, "availableFrom"),
			countryCode: textField(form, "countryCode"),
			city: textField(form, "city"),
			heardFrom: textField(form, "heardFrom"),
			heardOther: textField(form, "heardOther"),
			linkedinUrl: textField(form, "linkedinUrl"),
			salaryRange: textField(form, "salaryRange"),
			notes: textField(form, "notes"),
			fileName: file.name,
			bytes,
		});
	} catch (error) {
		const message = error instanceof TRPCError ? error.message : "The application could not be saved. Try again.";
		const status = error instanceof TRPCError && error.code === "NOT_FOUND" ? 404 : 400;
		return c.json({ error: message }, status);
	}
	return c.json({ ok: true });
}

export async function handleCareerCvDownload(c: Context) {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	const user = session?.user as { id: string; role?: string | null } | undefined;
	if (!user) return c.json({ error: "Sign in required." }, 401);
	try {
		await assertAgencyProcedureAccess({
			userId: user.id,
			userRole: user.role,
			path: "careers.applicationFile",
			type: "query",
			ipAddress: clientIp(c),
		});
	} catch (error) {
		const message = error instanceof TRPCError ? error.message : "You do not have access to human resources.";
		return c.json({ error: message }, 403);
	}
	const file = await readCareerApplicationFile(c.req.param("id"));
	if (!file) return c.json({ error: "Application not found." }, 404);
	const downloadName = file.fileName.replace(/["\r\n]/g, "");
	return new Response(new Uint8Array(file.bytes), {
		headers: {
			"content-type": file.contentType,
			"content-disposition": `attachment; filename="${downloadName}"`,
			"x-content-type-options": "nosniff",
			"cache-control": "private, no-store",
		},
	});
}
