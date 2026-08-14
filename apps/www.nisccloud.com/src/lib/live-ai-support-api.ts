import {
  NPANEL_APP,
  trpcCredentialedMutation,
  trpcCredentialedQuery,
} from "@/lib/domain-search/api.ts";
import {
  getStoredGuestSupportToken,
  storeGuestSupportToken,
} from "@/lib/support-tickets-api.ts";

const TRPC_BASE = "/api/trpc";
const GUEST_TOKEN_HEADER = "x-nisc-support-guest";

type TrpcBatchItem = {
  result?: { data?: unknown };
  error?: { message?: string };
};

function batchEnvelope(input: unknown): Record<string, unknown> {
  return { "0": input };
}

function unwrapTrpcData(data: unknown): unknown {
  if (data && typeof data === "object" && "json" in data && (data as { json: unknown }).json !== undefined) {
    return (data as { json: unknown }).json;
  }
  return data;
}

async function parseTrpcBatch(res: Response): Promise<unknown> {
  const batch = (await res.json()) as TrpcBatchItem[];
  if (batch[0]?.error) throw new Error(batch[0].error.message ?? "tRPC error");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return unwrapTrpcData(batch[0]?.result?.data);
}

function guestHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredGuestSupportToken();
  if (token) headers[GUEST_TOKEN_HEADER] = token;
  return headers;
}

async function trpcCookieMutation<T>(procedure: string, input?: unknown): Promise<T> {
  const res = await fetch(`${TRPC_BASE}/${procedure}?batch=1`, {
    method: "POST",
    credentials: "include",
    headers: guestHeaders(),
    body: JSON.stringify(batchEnvelope(input ?? null)),
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await parseTrpcBatch(res)) as T & { token?: string };
  if (data && typeof data === "object" && "token" in data && data.token) {
    storeGuestSupportToken(data.token);
  }
  return data as T;
}

async function trpcCookieQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) params.set("input", JSON.stringify(batchEnvelope(input)));
  const headers: Record<string, string> = {};
  const token = getStoredGuestSupportToken();
  if (token) headers[GUEST_TOKEN_HEADER] = token;
  const res = await fetch(`${TRPC_BASE}/${procedure}?${params}`, {
    credentials: "include",
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  return (await parseTrpcBatch(res)) as T;
}

export type SupportAiSession = {
  id: string;
  title?: string | null;
};

export type SupportAiMessage = {
  id: string;
  role: string;
  content?: string | null;
  status?: string | null;
  createdAt?: string | Date;
};

export type SupportAiToolInvocation = {
  id: string;
  messageId?: string | null;
  toolName: string;
  status?: string | null;
  result?: unknown;
};

export async function createAuthSupportAiSession(teamId?: string) {
  return trpcCredentialedMutation<SupportAiSession>("zeepoAiSupport.getOrCreate", {
    teamId,
  });
}

export async function fetchAuthSupportAiSession(id: string) {
  return trpcCredentialedQuery<{
    session: SupportAiSession;
    messages: SupportAiMessage[];
    toolInvocations: SupportAiToolInvocation[];
  }>("zeepoAiSupport.getSession", { id });
}

export async function createGuestSupportAiSession() {
  return trpcCookieMutation<SupportAiSession>("zeepoAiSupport.guest.getOrCreate");
}

export async function openGuestSupportTicket(input: {
  sessionId: string;
  phone?: string;
  intent?: "support" | "sales";
}) {
  return trpcCookieMutation<{
    ok: boolean;
    alreadyOpen: boolean;
    ticketId: string;
    ticketNumber: string;
  }>("zeepoAiSupport.guest.openTicket", input);
}

export async function openAuthSupportTicket(input: {
  sessionId: string;
  phone?: string;
  intent?: "support" | "sales";
}) {
  return trpcCredentialedMutation<{
    ok: boolean;
    alreadyOpen: boolean;
    ticketId: string;
    ticketNumber: string;
  }>("zeepoAiSupport.openTicket", input);
}

export async function fetchGuestSupportAiSession(id: string) {
  return trpcCookieQuery<{
    session: SupportAiSession;
    messages: SupportAiMessage[];
    toolInvocations: SupportAiToolInvocation[];
  }>("zeepoAiSupport.guest.getSession", { id });
}

export type SupportAiSseEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_result"; toolName: string; toolUseId: string; result: unknown }
  | { type: "error"; message: string; code?: string; recoverable?: boolean }
  | { type: "done"; status: "complete" | "cancelled" | "error" }
  | { type: "ping" }
  | { type: string; [k: string]: unknown };

export async function streamSupportAi(params: {
  sessionId: string;
  content: string;
  teamId?: string;
  mode: "guest" | "auth";
  signal?: AbortSignal;
  onEvent: (event: SupportAiSseEvent) => void;
}): Promise<void> {
  const url =
    params.mode === "guest"
      ? "/api/zeepo-ai/support/guest/stream"
      : `${NPANEL_APP.replace(/\/+$/, "")}/api/zeepo-ai/chat/stream`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (params.mode === "guest") {
    const token = getStoredGuestSupportToken();
    if (token) headers["x-nisc-support-guest"] = token;
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      sessionId: params.sessionId,
      content: params.content,
      teamId: params.teamId,
      searchEnabled: false,
    }),
    signal: params.signal,
  });

  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* ignore */
    }
    params.onEvent({ type: "error", message, recoverable: response.status >= 500 });
    params.onEvent({ type: "done", status: "error" });
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
        params.onEvent(JSON.parse(payload) as SupportAiSseEvent);
      } catch {
        /* ignore */
      }
    }
  }
}
