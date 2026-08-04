import {
  trpcCredentialedMutation,
  trpcCredentialedQuery,
} from "@/lib/domain-search/api.ts";

const TRPC_BASE = "/api/trpc";
const GUEST_TOKEN_STORAGE_KEY = "nisc_support_guest_token";
const GUEST_TOKEN_HEADER = "x-nisc-support-guest";

type TrpcBatchItem = {
  result?: { data?: unknown };
  error?: { message?: string };
};

function batchEnvelope(input: unknown): Record<string, unknown> {
  return { "0": input };
}

async function parseTrpcBatch(res: Response): Promise<unknown> {
  const batch = (await res.json()) as TrpcBatchItem[];
  if (batch[0]?.error) throw new Error(batch[0].error.message ?? "tRPC error");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return batch[0]?.result?.data;
}

function unwrapTrpcData(data: unknown): unknown {
  if (
    data &&
    typeof data === "object" &&
    "json" in data &&
    (data as { json: unknown }).json !== undefined
  ) {
    return (data as { json: unknown }).json;
  }
  return data;
}

export function getStoredGuestSupportToken(): string | null {
  try {
    return sessionStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeGuestSupportToken(token: string | undefined | null) {
  if (!token) return;
  try {
    sessionStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
  } catch {
    // private mode / blocked storage  cookie path may still work
  }
}

export function clearStoredGuestSupportToken() {
  try {
    sessionStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function guestAuthHeaders(): HeadersInit {
  const token = getStoredGuestSupportToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers[GUEST_TOKEN_HEADER] = token;
  return headers;
}

/** Same-origin tRPC with cookies + optional guest token header. */
async function trpcCookieQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) {
    params.set("input", JSON.stringify(batchEnvelope(input)));
  }
  const headers: Record<string, string> = {};
  const token = getStoredGuestSupportToken();
  if (token) headers[GUEST_TOKEN_HEADER] = token;

  const res = await fetch(`${TRPC_BASE}/${procedure}?${params}`, {
    credentials: "include",
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  const data = unwrapTrpcData(await parseTrpcBatch(res)) as T & { token?: string };
  if (data && typeof data === "object" && "token" in data && data.token) {
    storeGuestSupportToken(data.token);
  }
  return data as T;
}

async function trpcCookieMutation<T>(procedure: string, input?: unknown): Promise<T> {
  const res = await fetch(`${TRPC_BASE}/${procedure}?batch=1`, {
    method: "POST",
    credentials: "include",
    headers: guestAuthHeaders(),
    body: JSON.stringify(batchEnvelope(input ?? null)),
    signal: AbortSignal.timeout(30_000),
  });
  const data = unwrapTrpcData(await parseTrpcBatch(res)) as T & { token?: string };
  if (data && typeof data === "object" && "token" in data && data.token) {
    storeGuestSupportToken(data.token);
  }
  return data as T;
}

export type SupportTicketListItem = {
  id: string;
  ticketNumber: string;
  subject?: string | null;
  lastMessage: string | null;
  lastMessageAt: string | Date | null;
  unreadCount: number;
  status: string;
  priority: string;
  customerName?: string;
  assignedToName?: string | null;
};

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  isInternal: boolean;
  isSystem: boolean;
  readStatus: string;
  createdAt: string | Date;
  sender?: { id: string; name: string | null; email: string } | null;
};

export type GuestSupportSession = {
  active: boolean;
  name?: string;
  email?: string;
  phone?: string | null;
  token?: string;
};

export async function fetchGuestSupportSession(): Promise<GuestSupportSession> {
  try {
    const session = await trpcCookieQuery<GuestSupportSession>("support.guest.getSession");
    if (session.token) storeGuestSupportToken(session.token);
    if (!session.active) clearStoredGuestSupportToken();
    return session;
  } catch {
    return { active: false };
  }
}

export async function startGuestSupportSession(input: {
  name: string;
  email: string;
  phone?: string | null;
}): Promise<GuestSupportSession> {
  const session = await trpcCookieMutation<GuestSupportSession>(
    "support.guest.startSession",
    input,
  );
  if (session.token) storeGuestSupportToken(session.token);
  return session;
}

export async function claimGuestSupportTickets(): Promise<{
  claimed: boolean;
  ticketCount: number;
}> {
  try {
    const result = await trpcCookieMutation<{ claimed: boolean; ticketCount: number }>(
      "support.guest.claimToAccount",
    );
    if (result.claimed) clearStoredGuestSupportToken();
    return result;
  } catch {
    return { claimed: false, ticketCount: 0 };
  }
}

export async function listGuestTickets(): Promise<SupportTicketListItem[]> {
  return trpcCookieQuery("support.guest.getList", { limit: 30, offset: 0 });
}

export async function listAuthTickets(): Promise<SupportTicketListItem[]> {
  return trpcCredentialedQuery("tickets.getList", { limit: 30, offset: 0 });
}

export async function getGuestMessages(
  ticketId: string,
): Promise<{ messages: SupportTicketMessage[]; total: number }> {
  return trpcCookieQuery("support.guest.getMessages", {
    ticketId,
    limit: 100,
    offset: 0,
  });
}

export async function getAuthMessages(
  ticketId: string,
): Promise<{ messages: SupportTicketMessage[]; total: number }> {
  return trpcCredentialedQuery("tickets.getMessages", {
    ticketId,
    limit: 100,
    offset: 0,
  });
}

export async function createGuestTicket(input: {
  subject?: string;
  message: string;
}): Promise<{ ticketId: string; ticketNumber: string; messageId: string }> {
  return trpcCookieMutation("support.guest.create", input);
}

export async function createAuthTicket(input: {
  subject?: string;
  description?: string;
}): Promise<{ id: string; ticketNumber: string }> {
  return trpcCredentialedMutation("tickets.create", {
    subject: input.subject,
    description: input.description,
    type: "GENERAL",
    priority: "NORMAL",
    source: "CHAT",
  });
}

export async function sendGuestMessage(
  ticketId: string,
  content: string,
): Promise<SupportTicketMessage> {
  return trpcCookieMutation("support.guest.createMessage", { ticketId, content });
}

export async function sendAuthMessage(
  ticketId: string,
  content: string,
): Promise<SupportTicketMessage> {
  return trpcCredentialedMutation("tickets.createMessage", {
    ticketId,
    content,
    isInternal: false,
  });
}

export async function markGuestTicketRead(ticketId: string): Promise<void> {
  await trpcCookieMutation("support.guest.markAllRead", { ticketId });
}

export async function markAuthTicketRead(ticketId: string): Promise<void> {
  await trpcCredentialedMutation("tickets.markAllTicketMessagesAsRead", { ticketId });
}
