import { createContext } from "@npanel/api";
import { loadStorageAccess, memberCanSeeStorage } from "@npanel/api/lib/nisc-storage/access";
import { sanitizeStorageError, StorageOperationError } from "@npanel/api/lib/nisc-storage/errors";
import { writeReservedUpload } from "@npanel/api/lib/nisc-storage/objects";
import type { Context } from "hono";

function statusFor(error: StorageOperationError): 400 | 403 | 404 | 409 | 502 {
	if (error.code === "NOT_FOUND") return 404;
	if (error.code === "DENIED") return 403;
	if (error.code === "CONFLICT") return 409;
	if (error.code === "LIMIT" || error.code === "NOT_CONFIGURED") return 400;
	return 502;
}

export async function handleNiscStorageUpload(c: Context) {
	const resourceId = c.req.query("resourceId")?.trim() ?? "";
	const key = c.req.query("key")?.trim() ?? "";
	if (!resourceId || !key) {
		return c.json({ message: "Choose a file to upload." }, 400);
	}

	const contentLength = Number(c.req.header("content-length"));
	const contentType = c.req.header("content-type")?.split(";")[0]?.trim() ?? "";
	const body = c.req.raw.body;
	if (!body || !Number.isInteger(contentLength) || contentLength <= 0 || !contentType) {
		return c.json({ message: "This file could not be read." }, 400);
	}

	try {
		const ctx = await createContext({ context: c });
		const user = ctx.session?.user;
		if (!user?.id) return c.json({ message: "Sign in to upload files." }, 401);

		const actor = { userId: user.id, role: user.role };
		const access = await loadStorageAccess(actor, resourceId);
		if (!(await memberCanSeeStorage(access, actor))) {
			return c.json({ message: "Storage was not found." }, 404);
		}
		await writeReservedUpload(access, actor, key, body, contentType, contentLength);
		return c.json({ ok: true });
	} catch (error) {
		if (error instanceof StorageOperationError) {
			return c.json({ message: error.message }, statusFor(error));
		}
		console.error("Storage upload failed:", sanitizeStorageError(error));
		return c.json({ message: "The file was not stored." }, 502);
	}
}
