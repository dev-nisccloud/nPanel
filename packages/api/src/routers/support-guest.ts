/**
 * Landing-page guest support tickets.
 *
 * Security:
 *  - Landing-origin gated (storefront browser rules)
 *  - Opaque httpOnly cookie (`nisc_support_guest`); only token hash stored
 *  - Guest may only access tickets created by their shadow GUEST user
 *  - Entering an email never grants access to another account's tickets
 *  - Claim on login uses the cookie, not email match
 */

import { randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, count, desc, eq, isNull, like, ne } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { supportGuestSession } from "@npanel/db/schema/support-guest-sessions";
import {
  ticket,
  ticketActivityLog,
  ticketMessage,
} from "@npanel/db/schema/tickets";
import { isAllowedStorefrontBrowserRequest } from "@npanel/auth/landing-page-origins";
import type { Context } from "../context";
import {
  GUEST_SESSION_TTL_SEC,
  clearSupportGuestCookie,
  hashGuestToken,
  hashOptionalValue,
  loadActiveGuestSession,
  setSupportGuestCookie,
} from "../lib/support-guest-session";
import { publicProcedure, router } from "../trpc";

const MAX_MESSAGE_LEN = 8_000;

const ticketListItemSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  subject: z.string().nullable().optional(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.date().nullable(),
  unreadCount: z.number(),
  status: z.string(),
  priority: z.string(),
});

const ticketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  senderId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isSystem: z.boolean(),
  readStatus: z.string(),
  createdAt: z.date(),
  sender: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .nullable()
    .optional(),
});

const guestSessionSchema = z.object({
  active: z.boolean(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().nullable().optional(),
  /** Opaque token for clients when httpOnly cookie cannot be stored (local HTTP). */
  token: z.string().optional(),
});

function assertLandingOrigin(ctx: Context) {
  if (!isAllowedStorefrontBrowserRequest(ctx.req.raw.headers)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Guest support is only available from the Nisc Cloud website",
    });
  }
}

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  const [lastTicket] = await db
    .select()
    .from(ticket)
    .where(like(ticket.ticketNumber, `${prefix}%`))
    .orderBy(desc(ticket.ticketNumber))
    .limit(1);

  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNumber.replace(prefix, ""), 10);
    if (!Number.isNaN(lastSequence)) sequence = lastSequence + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
}

async function resolveGuestSession(ctx: Context) {
  assertLandingOrigin(ctx);
  const sessionRow = await loadActiveGuestSession(ctx, { refresh: true });
  if (!sessionRow) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Guest support session required",
    });
  }
  return sessionRow;
}

export const supportGuestRouter = router({
  getSession: publicProcedure.output(guestSessionSchema).query(async ({ ctx }) => {
    assertLandingOrigin(ctx);
    const sessionRow = await loadActiveGuestSession(ctx, { refresh: true });
    if (!sessionRow) return { active: false };

    return {
      active: true,
      name: sessionRow.name,
      email: sessionRow.email,
      phone: sessionRow.phone,
      token: sessionRow.rawToken,
    };
  }),

  startSession: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().max(40).optional().nullable(),
      }),
    )
    .output(guestSessionSchema)
    .mutation(async ({ ctx, input }) => {
      assertLandingOrigin(ctx);

      const existing = await loadActiveGuestSession(ctx, { refresh: true });
      if (existing) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_SEC * 1000);
        await db
          .update(supportGuestSession)
          .set({
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone?.trim() || null,
            lastSeenAt: now,
            expiresAt,
            updatedAt: now,
          })
          .where(eq(supportGuestSession.id, existing.id));
        await db
          .update(user)
          .set({ name: input.name })
          .where(eq(user.id, existing.guestUserId));
        return {
          active: true,
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone?.trim() || null,
          token: existing.rawToken,
        };
      }

      const sessionId = randomUUID();
      const guestUserId = randomUUID();
      const rawToken = randomBytes(32).toString("base64url");
      const emailNorm = input.email.toLowerCase();
      // Always synthetic — contact email lives on the guest session / ticket metadata.
      const guestEmail = `guest+${sessionId.replace(/-/g, "")}@guests.nisccloud.internal`;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_SEC * 1000);

      await db.transaction(async (tx) => {
        await tx.insert(user).values({
          id: guestUserId,
          name: input.name,
          email: guestEmail,
          emailVerified: false,
          role: "GUEST",
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(supportGuestSession).values({
          id: sessionId,
          tokenHash: hashGuestToken(rawToken),
          guestUserId,
          name: input.name,
          email: emailNorm,
          phone: input.phone?.trim() || null,
          createdIpHash: hashOptionalValue(ctx.ipAddress),
          userAgentHash: hashOptionalValue(ctx.req.raw.headers.get("user-agent")),
          expiresAt,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
        });
      });

      setSupportGuestCookie(ctx, rawToken);

      return {
        active: true,
        name: input.name,
        email: emailNorm,
        phone: input.phone?.trim() || null,
        token: rawToken,
      };
    }),

  getList: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).optional().default(30),
          offset: z.number().min(0).optional().default(0),
        })
        .optional(),
    )
    .output(z.array(ticketListItemSchema))
    .query(async ({ ctx, input }) => {
      const sessionRow = await resolveGuestSession(ctx);
      const limit = input?.limit ?? 30;
      const offset = input?.offset ?? 0;

      const rows = await db.query.ticket.findMany({
        where: eq(ticket.createdById, sessionRow.guestUserId),
        orderBy: [desc(ticket.lastMessageAt)],
        limit,
        offset,
      });

      return rows.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        lastMessage: t.lastMessagePreview,
        lastMessageAt: t.lastMessageAt,
        unreadCount: t.customerUnreadCount,
        status: t.status,
        priority: t.priority,
      }));
    }),

  getMessages: publicProcedure
    .input(
      z.object({
        ticketId: z.string().min(1),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .output(
      z.object({
        messages: z.array(ticketMessageSchema),
        total: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessionRow = await resolveGuestSession(ctx);

      const [owned] = await db
        .select({ id: ticket.id })
        .from(ticket)
        .where(
          and(
            eq(ticket.id, input.ticketId),
            eq(ticket.createdById, sessionRow.guestUserId),
          ),
        )
        .limit(1);

      if (!owned) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const msgWhere = and(
        eq(ticketMessage.ticketId, input.ticketId),
        isNull(ticketMessage.deletedAt),
        eq(ticketMessage.isInternal, false),
      );

      const [messages, totalRow] = await Promise.all([
        db.query.ticketMessage.findMany({
          where: msgWhere,
          orderBy: [asc(ticketMessage.createdAt)],
          limit: input.limit,
          offset: input.offset,
          with: {
            sender: { columns: { id: true, name: true, email: true } },
          },
        }),
        db.select({ n: count(ticketMessage.id) }).from(ticketMessage).where(msgWhere),
      ]);

      return {
        messages: messages.map((m) => ({
          id: m.id,
          ticketId: m.ticketId,
          senderId: m.senderId,
          content: m.content,
          isInternal: m.isInternal,
          isSystem: m.isSystem,
          readStatus: m.readStatus,
          createdAt: m.createdAt,
          sender: m.sender
            ? { id: m.sender.id, name: m.sender.name, email: m.sender.email }
            : null,
        })),
        total: Number(totalRow[0]?.n ?? 0),
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        subject: z.string().trim().max(200).optional(),
        message: z.string().trim().min(1).max(MAX_MESSAGE_LEN),
      }),
    )
    .output(
      z.object({
        ticketId: z.string(),
        ticketNumber: z.string(),
        messageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sessionRow = await resolveGuestSession(ctx);
      const ticketNumber = await generateTicketNumber();
      const ticketId = randomUUID();
      const messageId = randomUUID();
      const now = new Date();
      const preview =
        input.message.length > 100
          ? `${input.message.substring(0, 100)}...`
          : input.message;
      const subject =
        input.subject?.trim() ||
        (input.message.length > 60
          ? `${input.message.slice(0, 57)}...`
          : input.message);

      await db.transaction(async (tx) => {
        await tx.insert(ticket).values({
          id: ticketId,
          ticketNumber,
          subject,
          description: input.message,
          type: "GENERAL",
          priority: "NORMAL",
          status: "OPEN",
          source: "CHAT",
          createdById: sessionRow.guestUserId,
          teamId: null,
          assignedToId: null,
          lastMessageId: messageId,
          lastMessageAt: now,
          lastMessagePreview: preview,
          unreadCount: 1,
          customerUnreadCount: 0,
          metadata: {
            guestContact: {
              name: sessionRow.name,
              email: sessionRow.email,
              phone: sessionRow.phone,
            },
            guestSessionId: sessionRow.id,
            sourceSurface: "landing_fab",
          },
          internalNotes: null,
          createdAt: now,
          updatedAt: now,
          lastCustomerResponseAt: now,
        });

        await tx.insert(ticketMessage).values({
          id: messageId,
          ticketId,
          senderId: sessionRow.guestUserId,
          content: input.message,
          isInternal: false,
          isSystem: false,
          readStatus: "SENT",
          readAt: null,
          metadata: null,
          createdAt: now,
          updatedAt: now,
          editedAt: null,
          deletedAt: null,
        });

        await tx.insert(ticketActivityLog).values({
          id: randomUUID(),
          ticketId,
          userId: sessionRow.guestUserId,
          action: "CREATE",
          description: `Guest ticket ${ticketNumber} created`,
          oldValue: null,
          newValue: { status: "OPEN", source: "CHAT" },
          metadata: { guestSessionId: sessionRow.id },
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });
      });

      return { ticketId, ticketNumber, messageId };
    }),

  createMessage: publicProcedure
    .input(
      z.object({
        ticketId: z.string().min(1),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LEN),
      }),
    )
    .output(ticketMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionRow = await resolveGuestSession(ctx);

      const [ticketRow] = await db
        .select()
        .from(ticket)
        .where(
          and(
            eq(ticket.id, input.ticketId),
            eq(ticket.createdById, sessionRow.guestUserId),
          ),
        )
        .limit(1);

      if (!ticketRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      if (ticketRow.status === "CLOSED" || ticketRow.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ticket is closed. Start a new conversation.",
        });
      }

      const now = new Date();
      const messageId = randomUUID();
      const preview =
        input.content.length > 100
          ? `${input.content.substring(0, 100)}...`
          : input.content;

      await db.transaction(async (tx) => {
        await tx.insert(ticketMessage).values({
          id: messageId,
          ticketId: input.ticketId,
          senderId: sessionRow.guestUserId,
          content: input.content,
          isInternal: false,
          isSystem: false,
          readStatus: "SENT",
          readAt: null,
          metadata: null,
          createdAt: now,
          updatedAt: now,
          editedAt: null,
          deletedAt: null,
        });

        const ticketUpdate: Record<string, unknown> = {
          updatedAt: now,
          lastResponseAt: now,
          lastMessageId: messageId,
          lastMessageAt: now,
          lastMessagePreview: preview,
          lastCustomerResponseAt: now,
          unreadCount: ticketRow.unreadCount + 1,
        };
        if (ticketRow.status === "WAITING") {
          ticketUpdate.status = "IN_PROGRESS";
        }

        await tx.update(ticket).set(ticketUpdate as any).where(eq(ticket.id, input.ticketId));
      });

      return {
        id: messageId,
        ticketId: input.ticketId,
        senderId: sessionRow.guestUserId,
        content: input.content,
        isInternal: false,
        isSystem: false,
        readStatus: "SENT",
        createdAt: now,
        sender: {
          id: sessionRow.guestUserId,
          name: sessionRow.name,
          email: sessionRow.email,
        },
      };
    }),

  markAllRead: publicProcedure
    .input(z.object({ ticketId: z.string().min(1) }))
    .output(z.object({ markedCount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sessionRow = await resolveGuestSession(ctx);

      const [ticketRow] = await db
        .select({ id: ticket.id })
        .from(ticket)
        .where(
          and(
            eq(ticket.id, input.ticketId),
            eq(ticket.createdById, sessionRow.guestUserId),
          ),
        )
        .limit(1);

      if (!ticketRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const now = new Date();
      const unread = await db
        .select({ id: ticketMessage.id })
        .from(ticketMessage)
        .where(
          and(
            eq(ticketMessage.ticketId, input.ticketId),
            ne(ticketMessage.senderId, sessionRow.guestUserId),
            ne(ticketMessage.readStatus, "READ"),
            isNull(ticketMessage.deletedAt),
            eq(ticketMessage.isInternal, false),
          ),
        );

      if (unread.length > 0) {
        await db
          .update(ticketMessage)
          .set({ readStatus: "READ", readAt: now, updatedAt: now })
          .where(
            and(
              eq(ticketMessage.ticketId, input.ticketId),
              ne(ticketMessage.senderId, sessionRow.guestUserId),
              ne(ticketMessage.readStatus, "READ"),
              isNull(ticketMessage.deletedAt),
              eq(ticketMessage.isInternal, false),
            ),
          );
      }

      await db
        .update(ticket)
        .set({ customerUnreadCount: 0, updatedAt: now })
        .where(eq(ticket.id, input.ticketId));

      return { markedCount: unread.length };
    }),

  /**
   * Merge guest-session tickets into the authenticated account.
   * Ownership is proven by the guest cookie, not by email match.
   * Allowed from landing or nPanel app (any authenticated customer with the cookie).
   */
  claimToAccount: publicProcedure
    .output(
      z.object({
        claimed: z.boolean(),
        ticketCount: z.number(),
      }),
    )
    .mutation(async ({ ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sign in to claim guest conversations",
        });
      }

      const [account] = await db
        .select({ role: user.role, status: user.status })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      const role = account?.role ?? "";
      if (
        !account ||
        account.status !== "ACTIVE" ||
        role.includes("AGENCY") ||
        role === "GUEST"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only customer accounts can claim guest tickets",
        });
      }

      // No refresh here — claim consumes the session; avoid rotating mid-claim.
      const sessionRow = await loadActiveGuestSession(ctx, { refresh: false });
      if (!sessionRow) {
        return { claimed: false, ticketCount: 0 };
      }

      if (sessionRow.guestUserId === userId) {
        clearSupportGuestCookie(ctx);
        return { claimed: false, ticketCount: 0 };
      }

      const guestTickets = await db
        .select({ id: ticket.id })
        .from(ticket)
        .where(eq(ticket.createdById, sessionRow.guestUserId));

      const now = new Date();

      await db.transaction(async (tx) => {
        if (guestTickets.length > 0) {
          await tx
            .update(ticket)
            .set({ createdById: userId, updatedAt: now, teamId: null })
            .where(eq(ticket.createdById, sessionRow.guestUserId));

          await tx
            .update(ticketMessage)
            .set({ senderId: userId, updatedAt: now })
            .where(eq(ticketMessage.senderId, sessionRow.guestUserId));
        }

        await tx
          .update(supportGuestSession)
          .set({
            claimedByUserId: userId,
            claimedAt: now,
            updatedAt: now,
          })
          .where(eq(supportGuestSession.id, sessionRow.id));

        // Soft-disable shadow guest user (keep row for FK history if any remain).
        await tx
          .update(user)
          .set({ status: "DEACTIVATED", updatedAt: now })
          .where(eq(user.id, sessionRow.guestUserId));
      });

      clearSupportGuestCookie(ctx);

      return { claimed: true, ticketCount: guestTickets.length };
    }),
});
