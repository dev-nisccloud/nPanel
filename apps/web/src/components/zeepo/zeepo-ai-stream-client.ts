export type ZeepoAiSseEvent =
  | { type: "message_start"; userMessageId: string; assistantMessageId: string; modelId: string }
  | { type: "session_title"; title: string }
  | { type: "reasoning_delta"; text: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; toolName: string; toolUseId: string }
  | { type: "tool_done"; toolName: string; toolUseId: string; ok: boolean }
  | {
      type: "tool_result";
      toolName: string;
      toolUseId: string;
      result: unknown;
    }
  | {
      type: "clarifying_preparing";
      messageId: string;
    }
  | {
      type: "clarifying_questions";
      messageId: string;
      questions: Array<{
        question: string;
        options: string[];
        allow_upload?: boolean;
      }>;
      partial?: boolean;
    }
  | {
      type: "generation_start";
      generationId: string;
      kind: "image";
      slot: number;
      total: number;
      title: string;
    }
  | {
      type: "generation_progress";
      generationId: string;
      status: string;
      slot?: number;
      total?: number;
    }
  | {
      type: "generation";
      generation: {
        id: string;
        kind: string;
        title: string;
        status: string;
        outputs: unknown;
      };
    }
  | {
      type: "generation_drop";
      generationIds: string[];
    }
  | { type: "usage"; inputTokens: number; outputTokens: number; tokensDebited: number }
  | { type: "error"; message: string; code?: string; recoverable?: boolean }
  | { type: "done"; status: "complete" | "cancelled" | "error"; stopReason?: string | null }
  | { type: "ping" };

export type StreamZeepoAiChatParams = {
  sessionId: string;
  content: string;
  teamId?: string;
  skillId?: string;
  searchEnabled?: boolean;
  attachmentIds?: string[];
  modelId?: string;
  replaceFromUserMessageId?: string;
  signal?: AbortSignal;
  onEvent: (event: ZeepoAiSseEvent) => void;
  /** Override stream URL (guest FAB uses /api/zeepo-ai/support/guest/stream). */
  url?: string;
  extraHeaders?: Record<string, string>;
};

/**
 * POST SSE stream for a Zeepo AI turn.
 * Network drops surface as recoverable errors; partial content stays on the server.
 */
export async function streamZeepoAiChat(params: StreamZeepoAiChatParams): Promise<void> {
  const { onEvent, signal, url, extraHeaders, ...body } = params;

  let response: Response;
  try {
    response = await fetch(url ?? "/api/zeepo-ai/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...extraHeaders,
      },
      credentials: "include",
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      onEvent({ type: "done", status: "cancelled" });
      return;
    }
    onEvent({
      type: "error",
      message:
        err instanceof TypeError
          ? "Connection lost. Your partial reply was saved  tap Retry to continue."
          : "Could not reach Zeepo. Check your connection and try again.",
      code: "NETWORK",
      recoverable: true,
    });
    onEvent({ type: "done", status: "error" });
    return;
  }

  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* ignore */
    }
    onEvent({
      type: "error",
      message,
      code: String(response.status),
      recoverable: response.status >= 500 || response.status === 429,
    });
    onEvent({ type: "done", status: "error" });
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const dataLine = raw
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const payload = dataLine.replace(/^data:\s?/, "");
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as ZeepoAiSseEvent;
          if (event.type === "done") sawDone = true;
          onEvent(event);
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
    // Flush decoder + any trailing frame if the socket closed right after `done`.
    buffer += decoder.decode();
    if (buffer.trim()) {
      const dataLine = buffer
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (dataLine) {
        const payload = dataLine.replace(/^data:\s?/, "");
        if (payload && payload !== "[DONE]") {
          try {
            const event = JSON.parse(payload) as ZeepoAiSseEvent;
            if (event.type === "done") sawDone = true;
            onEvent(event);
          } catch {
            /* ignore */
          }
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) {
      if (!sawDone) onEvent({ type: "done", status: "cancelled" });
      return;
    }
    onEvent({
      type: "error",
      message:
        "The connection dropped mid-reply. Your progress was saved  tap Retry to continue.",
      code: "NETWORK_INTERRUPT",
      recoverable: true,
    });
    if (!sawDone) onEvent({ type: "done", status: "error" });
    return;
  }

  if (!sawDone) {
    onEvent({
      type: "error",
      message: "The reply ended unexpectedly. Tap Retry if it looks incomplete.",
      code: "STREAM_INCOMPLETE",
      recoverable: true,
    });
    onEvent({ type: "done", status: "error" });
  }
}
