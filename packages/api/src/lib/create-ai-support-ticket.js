/**
 * Opens a human support ticket from a Zeepo AI or Live AI Support chat.
 * Ownership is always the calling user (guest cookie user or Better Auth user).
 */
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, like } from "@npanel/db";
import { db } from "@npanel/db";
import { ticket, ticketActivityLog, ticketMessage } from "@npanel/db/schema/tickets";
import { zeepoAiMessage, zeepoAiSession } from "@npanel/db/schema/zeepo-ai";
import { supportGuestSession } from "@npanel/db/schema/support-guest-sessions";
import { checkRateLimit } from "./rate-limit";
import { isZeepoAiSupportFabSession, isZeepoAiSupportGuestRole } from "./zeepo-ai-support";
export const AI_SUPPORT_TICKET_CATEGORIES = [
    "TECHNICAL",
    "BILLING",
    "FEATURE",
    "BUG",
    "ACCOUNT",
    "GENERAL",
    "HOSTING",
    "DOMAIN",
    "EMAIL",
    "WORDPRESS",
];
const OPEN_STATUSES = new Set(["OPEN", "PENDING", "IN_PROGRESS", "WAITING"]);
async function generateTicketNumber() {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;
    const [lastTicket] = await db
        .select({ ticketNumber: ticket.ticketNumber })
        .from(ticket)
        .where(like(ticket.ticketNumber, `${prefix}%`))
        .orderBy(desc(ticket.ticketNumber))
        .limit(1);
    let sequence = 1;
    if (lastTicket?.ticketNumber) {
        const lastSequence = Number.parseInt(lastTicket.ticketNumber.replace(prefix, ""), 10);
        if (!Number.isNaN(lastSequence))
            sequence = lastSequence + 1;
    }
    return `${prefix}${sequence.toString().padStart(6, "0")}`;
}
function clip(text, max) {
    const t = text.trim();
    if (t.length <= max)
        return t;
    return `${t.slice(0, max - 1)}…`;
}
export async function buildSessionTranscriptSummary(sessionId) {
    const rows = await db.query.zeepoAiMessage.findMany({
        where: eq(zeepoAiMessage.sessionId, sessionId),
        orderBy: [desc(zeepoAiMessage.createdAt)],
        limit: 12,
        columns: { role: true, content: true, status: true },
    });
    const chronological = [...rows].reverse();
    const lines = [];
    for (const row of chronological) {
        if (row.status === "streaming" || row.status === "cancelled")
            continue;
        if (row.role !== "user" && row.role !== "assistant")
            continue;
        const content = row.content?.trim();
        if (!content)
            continue;
        const who = row.role === "user" ? "Customer" : "Zeepo";
        lines.push(`${who}: ${clip(content, 800)}`);
    }
    if (lines.length === 0) {
        return "The customer asked to speak with the Nisc Cloud team. No prior chat messages were available.";
    }
    return clip(lines.join("\n\n"), 4000);
}
export async function createAiSupportTicket(params) {
    const session = await db.query.zeepoAiSession.findFirst({
        where: and(eq(zeepoAiSession.id, params.sessionId), eq(zeepoAiSession.userId, params.userId)),
        columns: { id: true, userId: true, teamId: true, metadata: true, status: true },
    });
    if (!session || session.status === "DELETED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat session not found" });
    }
    const isSupportFab = isZeepoAiSupportFabSession(session.metadata);
    if (params.surface === "support_fab" && !isSupportFab) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a Live AI Support session" });
    }
    if (params.surface === "zeepo_ai" && isSupportFab) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Use Live AI Support to open this ticket" });
    }
    const prevMeta = session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
        ? session.metadata
        : {};
    const existingId = typeof prevMeta.supportTicketId === "string" ? prevMeta.supportTicketId : null;
    if (existingId) {
        const existing = await db.query.ticket.findFirst({
            where: and(eq(ticket.id, existingId), eq(ticket.createdById, params.userId)),
            columns: { id: true, ticketNumber: true, status: true, subject: true },
        });
        if (existing && OPEN_STATUSES.has(existing.status)) {
            return {
                _tool: "create_support_ticket",
                ok: true,
                alreadyOpen: true,
                ticketId: existing.id,
                ticketNumber: existing.ticketNumber,
                intent: params.intent,
                subject: existing.subject ?? params.subject,
            };
        }
    }
    const limit = await checkRateLimit({
        key: `ai-support-ticket:${params.userId}`,
        limit: 5,
        windowSec: 60 * 60,
        failClosed: true,
    });
    if (!limit.allowed) {
        throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many tickets from this chat. Call or email us, or try again later.",
        });
    }
    const isGuest = isZeepoAiSupportGuestRole(params.userRole);
    let guestContact = null;
    if (isGuest) {
        const [guest] = await db
            .select({
            id: supportGuestSession.id,
            name: supportGuestSession.name,
            email: supportGuestSession.email,
            phone: supportGuestSession.phone,
        })
            .from(supportGuestSession)
            .where(and(eq(supportGuestSession.guestUserId, params.userId), isNull(supportGuestSession.claimedAt)))
            .limit(1);
        if (!guest) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Guest support session required",
            });
        }
        guestContact = {
            name: guest.name,
            email: guest.email,
            phone: params.phone?.trim() || guest.phone,
        };
    }
    const category = AI_SUPPORT_TICKET_CATEGORIES.includes((params.category ?? ""))
        ? params.category
        : "GENERAL";
    const subject = clip(params.subject || (params.intent === "sales" ? "Sales enquiry" : "Support request"), 120);
    const summary = clip(params.summary, 4000) || (await buildSessionTranscriptSummary(params.sessionId));
    const phone = params.phone?.trim() || guestContact?.phone || null;
    const ticketId = randomUUID();
    const messageId = randomUUID();
    const ticketNumber = await generateTicketNumber();
    const now = new Date();
    const preview = clip(summary, 100);
    await db.transaction(async (tx) => {
        await tx.insert(ticket).values({
            id: ticketId,
            ticketNumber,
            subject,
            description: summary,
            type: category,
            priority: params.intent === "sales" ? "NORMAL" : "NORMAL",
            status: "OPEN",
            source: "CHAT",
            createdById: params.userId,
            teamId: isGuest ? null : params.teamId ?? session.teamId,
            assignedToId: null,
            lastMessageId: messageId,
            lastMessageAt: now,
            lastMessagePreview: preview,
            unreadCount: 1,
            customerUnreadCount: 0,
            metadata: {
                intent: params.intent,
                sourceSurface: params.surface,
                zeepoAiSessionId: params.sessionId,
                ...(guestContact
                    ? { guestContact: { ...guestContact, phone } }
                    : phone
                        ? { callbackPhone: phone }
                        : {}),
            },
            internalNotes: null,
            createdAt: now,
            updatedAt: now,
            lastCustomerResponseAt: now,
        });
        await tx.insert(ticketMessage).values({
            id: messageId,
            ticketId,
            senderId: params.userId,
            content: summary,
            isInternal: false,
            isSystem: false,
            readStatus: "SENT",
            readAt: null,
            metadata: { openedBy: "zeepo_ai", intent: params.intent },
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            deletedAt: null,
        });
        await tx.insert(ticketActivityLog).values({
            id: randomUUID(),
            ticketId,
            userId: params.userId,
            action: "CREATE",
            description: `${params.intent === "sales" ? "Sales" : "Support"} ticket ${ticketNumber} opened from ${params.surface === "support_fab" ? "Live AI Support" : "Zeepo AI"}`,
            oldValue: null,
            newValue: { status: "OPEN", source: "CHAT", intent: params.intent },
            metadata: { zeepoAiSessionId: params.sessionId, surface: params.surface },
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            createdAt: now,
        });
        await tx
            .update(zeepoAiSession)
            .set({
            metadata: {
                ...prevMeta,
                supportTicketId: ticketId,
                supportTicketNumber: ticketNumber,
            },
            updatedAt: now,
        })
            .where(eq(zeepoAiSession.id, params.sessionId));
    });
    return {
        _tool: "create_support_ticket",
        ok: true,
        alreadyOpen: false,
        ticketId,
        ticketNumber,
        intent: params.intent,
        subject,
    };
}
