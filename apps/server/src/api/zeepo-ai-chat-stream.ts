import type { Context } from "hono";
import { auth } from "@npanel/auth";
import {
	streamTurnBodySchema,
	streamZeepoAiTurn,
	type ZeepoAiStreamEvent,
} from "@npanel/api/routers/zeepo-ai";

function sseEncode(event: ZeepoAiStreamEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Authenticated SSE endpoint for Zeepo AI chat turns.
 * POST /api/zeepo-ai/chat/stream
 *
 * Client abort (fetch AbortSignal) cancels generation server-side.
 * Partial assistant content is persisted periodically so network drops
 * leave a recoverable cancelled/partial message.
 */
export async function handleZeepoAiChatStream(c: Context) {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user?.id) {
		return c.json({ error: "Unauthorized" }, 401);
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
					userId: session.user.id,
					userRole: session.user.role,
					teamId: parsed.data.teamId,
					skillId: parsed.data.skillId,
					searchEnabled: parsed.data.searchEnabled,
					attachmentIds: parsed.data.attachmentIds,
					modelId: parsed.data.modelId,
					replaceFromUserMessageId: parsed.data.replaceFromUserMessageId,
					ipAddress:
						c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
						c.req.header("x-real-ip") ??
						null,
					userAgent: c.req.header("user-agent") ?? null,
					signal: abortController.signal,
					onEvent: send,
				});
			} catch (err) {
				console.error("[ZeepoAI] stream failed:", err);
				const message =
					err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
						? (err as { message: string }).message
						: "Stream failed. Your partial reply was saved  you can retry.";
				await send({
					type: "error",
					message,
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
