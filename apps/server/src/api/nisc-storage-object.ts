import { createContext } from "@npanel/api";
import { loadStorageAccess, memberCanSeeStorage } from "@npanel/api/lib/nisc-storage/access";
import { sanitizeStorageError, StorageOperationError } from "@npanel/api/lib/nisc-storage/errors";
import { readStorageObject } from "@npanel/api/lib/nisc-storage/objects";
import type { Context } from "hono";

function statusFor(error: StorageOperationError): 400 | 403 | 404 | 409 | 502 {
	if (error.code === "NOT_FOUND") return 404;
	if (error.code === "DENIED") return 403;
	if (error.code === "CONFLICT") return 409;
	if (error.code === "LIMIT" || error.code === "NOT_CONFIGURED") return 400;
	return 502;
}

function fileNameHeader(name: string): string {
	const ascii = name.replace(/[^\w.\- ]+/g, "_").slice(0, 180) || "file";
	return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** Same-origin file bytes for the in-panel viewer. The browser never calls object storage. */
export async function handleNiscStorageObject(c: Context) {
	const resourceId = c.req.query("resourceId")?.trim() ?? "";
	const key = c.req.query("key")?.trim() ?? "";
	if (!resourceId || !key) return c.json({ message: "Choose a file to open." }, 400);

	try {
		const ctx = await createContext({ context: c });
		const user = ctx.session?.user;
		if (!user?.id) return c.json({ message: "Sign in to open this file." }, 401);

		const actor = { userId: user.id, role: user.role };
		const access = await loadStorageAccess(actor, resourceId);
		if (!(await memberCanSeeStorage(access, actor))) {
			return c.json({ message: "Storage was not found." }, 404);
		}
		const opened = await readStorageObject(access, actor, key, c.req.header("range"));
		const headers = new Headers();
		headers.set("content-type", opened.contentType);
		headers.set("content-disposition", fileNameHeader(opened.name));
		headers.set("accept-ranges", "bytes");
		headers.set("cache-control", "private, no-store");
		headers.set("x-content-type-options", "nosniff");
		if (opened.contentLength != null) headers.set("content-length", String(opened.contentLength));
		if (opened.contentRange) headers.set("content-range", opened.contentRange);
		return new Response(opened.stream, { status: opened.contentRange ? 206 : 200, headers });
	} catch (error) {
		if (error instanceof StorageOperationError) {
			return c.json({ message: error.message }, statusFor(error));
		}
		console.error("Storage preview failed:", sanitizeStorageError(error));
		return c.json({ message: "The file could not be opened." }, 502);
	}
}
