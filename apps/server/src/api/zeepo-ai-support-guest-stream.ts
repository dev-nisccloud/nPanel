import type { Context } from "hono";
import { createContext } from "@npanel/api";
import {
	streamTurnBodySchema,
	streamZeepoAiTurn,
	type ZeepoAiStreamEvent,
} from "@npanel/api/routers/zeepo-ai";
import { isAllowedStorefrontBrowserMutation } from "@npanel/auth/landing-page-origins";
import { loadActiveGuestSession } from "@npanel/api/lib/support-guest-session";
import { checkRateLimit } from "@npanel/api/lib/rate-limit";
import { db } from "@npanel/db";
import { and, eq } from "@npanel/db";
import { zeepoAiSession } from "@npanel/db/schema/zeepo-ai";
import { isZeepoAiSupportFabSession } from "@npanel/api/lib/zeepo-ai-support";

function sseEncode(event: ZeepoAiStreamEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Guest SSE for FAB Live AI Support.
 * POST /api/zeepo-ai/support/guest/stream
 *
 * Auth: landing origin + guest cookie (same as support tickets). Never a team session.
 */
export async function handleZeepoAiSupportGuestStream(c: Context) {
	if (!isAllowedStorefrontBrowserMutation(c.req.raw.headers)) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const ctx = await createContext({ context: c });
	const guest = await loadActiveGuestSession(ctx, { refresh: true });
	if (!guest) {
		return c.json({ error: "Guest support session required" }, 401);
	}

	const ip =
		ctx.ipAddress ||
		c.req.header("x-forwarded-for")?.split(",").pop()?.trim() ||
		c.req.header("x-real-ip") ||
		null;

	const limit = await checkRateLimit({
		key: `zeepo-support-guest:${guest.id}`,
		limit: 40,
		windowSec: 60 * 60,
		failClosed: true,
	});
	if (!limit.allowed) {
		return c.json({ error: "Too many Live AI Support messages. Try again later." }, 429);
	}

	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = streamTurnBodySchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: parsed.error.message }, 400);
	}

	const [sessionRow] = await db
		.select({
			id: zeepoAiSession.id,
			userId: zeepoAiSession.userId,
			metadata: zeepoAiSession.metadata,
			status: zeepoAiSession.status,
		})
		.from(zeepoAiSession)
		.where(
			and(eq(zeepoAiSession.id, parsed.data.sessionId), eq(zeepoAiSession.userId, guest.guestUserId)),
		)
		.limit(1);

	if (
		!sessionRow ||
		sessionRow.status === "DELETED" ||
		!isZeepoAiSupportFabSession(sessionRow.metadata)
	) {
		return c.json({ error: "Session not found" }, 404);
	}

	const abortController = new AbortController();
	c.req.raw.signal.addEventListener("abort", () => {
		abortController.abort();
	});

	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = async (event: ZeepoAiStreamEvent) => {
				try {
					controller.enqueue(encoder.encode(sseEncode(event)));
				} catch {
					/* client gone */
				}
			};

			try {
				await streamZeepoAiTurn({
					sessionId: parsed.data.sessionId,
					content: parsed.data.content,
					userId: guest.guestUserId,
					userRole: "GUEST",
					teamId: undefined,
					searchEnabled: false,
					attachmentIds: [],
					ipAddress: ip,
					userAgent: c.req.header("user-agent") ?? null,
					signal: abortController.signal,
					onEvent: send,
				});
			} catch (err) {
				console.error("[ZeepoAI support guest] stream failed:", err);
				await send({
					type: "error",
					message: "Failed to generate a reply. Please try again or contact support.",
					code: "STREAM_FATAL",
					recoverable: true,
				});
				await send({ type: "done", status: "error" });
			} finally {
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			}
		},
		cancel() {
			abortController.abort();
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
