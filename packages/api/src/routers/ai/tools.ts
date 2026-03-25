import { and, eq, inArray } from "drizzle-orm";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { domain } from "@npanel/db/schema/domains";
import {
  hostingSubscription,
  wordPressInstance,
} from "@npanel/db/schema/hosting";
import { ticket } from "@npanel/db/schema/tickets";
import { teamMember } from "@npanel/db/schema/teams";

// Mock navigation items for now to avoid circular dependency/monorepo import issues
const sidebarItems = [
  { label: "Dashboard", items: [{ title: "Overview", url: "/dashboard" }] },
  {
    label: "Services",
    items: [
      { title: "Hosting", url: "/hosting" },
      { title: "Domains", url: "/domains" },
    ],
  },
];
const agencysidebarItems = [
  {
    label: "Agency",
    items: [
      { title: "Clients", url: "/agency/clients" },
      { title: "Billing", url: "/agency/billing" },
    ],
  },
];

/**
 * Tool to get the system navigation structure.
 */
export const getSystemNavigationTool = () => ({
  description:
    "Get the current system navigation structure (pages, sub-pages, and URLs).",
  parameters: {
    type: "object",
    properties: {
      role: {
        type: "string",
        enum: ["AGENCY", "CUSTOMER"],
        description: "The role of the user (AGENCY or CUSTOMER)",
      },
    },
    required: ["role"],
  },
  execute: async ({ role }: { role: "AGENCY" | "CUSTOMER" }) => {
    const items = role === "AGENCY" ? agencysidebarItems : sidebarItems;
    return items.map((group) => ({
      group: group.label,
      items: group.items.map((item) => ({
        title: item.title,
        url: item.url,
        subItems: [] as any[],
      })),
    }));
  },
});

/**
 * Tool to get the current user's profile and team context.
 */
export const getUserContextTool = (userId: string) => ({
  description:
    "Get basic information about the current user, their role, and their teams.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  execute: async (_input: {}) => {
    const u = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    if (!u) return null;

    const memberships = await db.query.teamMember.findMany({
      where: eq(teamMember.userId, userId),
      with: {
        team: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      ...u,
      teamMemberships: memberships.map((m) => ({ team: m.team })),
    };
  },
});

/**
 * Tool to search for user-specific data
 */
export const getActiveServicesTool = (userId: string) => ({
  description:
    "Get active services (hosting, domains, wordpress) for the user or their teams.",
  parameters: {
    type: "object",
    properties: {
      teamId: {
        type: "string",
        description: "Optional team ID to filter services by team",
      },
    },
  },
  execute: async ({ teamId }: { teamId?: string }) => {
    if (teamId) {
      const membership = await db.query.teamMember.findFirst({
        where: and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, userId),
        ),
      });
      if (!membership) {
        const u = await db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: { role: true },
        });
        if (!u?.role?.includes("AGENCY")) {
          return { error: "Permission denied for this team." };
        }
      }
    }

    let teamIdsFilter: string[] | undefined;
    if (teamId) {
      teamIdsFilter = [teamId];
    } else {
      const rows = await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .where(eq(teamMember.userId, userId));
      teamIdsFilter = rows.map((r) => r.teamId);
      if (teamIdsFilter.length === 0) {
        return { hosting: [], domains: [], wordpress: [] };
      }
    }

    const teamCond = inArray(hostingSubscription.teamId, teamIdsFilter);

    try {
      const [hosting, domains, wpInstances] = await Promise.all([
        db
          .select({
            id: hostingSubscription.id,
            pleskName: hostingSubscription.pleskName,
            status: hostingSubscription.status,
            expiryDate: hostingSubscription.expiryDate,
          })
          .from(hostingSubscription)
          .where(teamCond),
        db
          .select({
            id: domain.id,
            domainName: domain.domainName,
            expirationDate: domain.expirationDate,
          })
          .from(domain)
          .where(inArray(domain.teamId, teamIdsFilter)),
        db.query.wordPressInstance.findMany({
          where: inArray(wordPressInstance.teamId, teamIdsFilter),
          columns: { id: true },
          with: {
            hostingSubscription: {
              columns: {
                primaryDomain: true,
                status: true,
              },
            },
          },
        }),
      ]);

      const wordpress = wpInstances.map((wp) => ({
        id: wp.id,
        url: wp.hostingSubscription?.primaryDomain
          ? `https://${wp.hostingSubscription.primaryDomain}`
          : null,
        status: wp.hostingSubscription?.status,
      }));

      return { hosting, domains, wordpress };
    } catch (e) {
      console.error("Failed to fetch services", e);
      return { hosting: [], domains: [], wordpress: [] };
    }
  },
});

/**
 * Tool to escalate the conversation to a human agent.
 */
export const escalateToHumanTool = (userId: string) => ({
  description:
    "Escalate the conversation to a human support agent. Use this if the AI cannot solve the issue.",
  parameters: {
    type: "object",
    properties: {
      subject: { type: "string", description: "Brief subject for the ticket" },
      summary: {
        type: "string",
        description: "Summary of the AI conversation and the user's issue",
      },
      priority: {
        type: "string",
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        default: "NORMAL",
      },
      teamId: { type: "string" },
    },
    required: ["subject", "summary"],
  },
  execute: async ({
    subject,
    summary,
    priority,
    teamId,
  }: {
    subject: string;
    summary: string;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    teamId?: string;
  }) => {
    const ticketNumber = `TKT-AI-${Date.now()}`;
    const id = `tkt_${Date.now()}`;
    const now = new Date();
    await db.insert(ticket).values({
      id,
      ticketNumber,
      subject,
      description: summary,
      type: "GENERAL",
      priority,
      status: "OPEN",
      source: "CHAT",
      createdById: userId,
      teamId: teamId ?? null,
      assignedToId: null,
      lastMessageId: null,
      lastMessageAt: null,
      lastMessagePreview: null,
      unreadCount: 0,
      customerUnreadCount: 0,
      metadata: null,
      internalNotes: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      closedAt: null,
      firstResponseAt: null,
      lastResponseAt: null,
      lastCustomerResponseAt: null,
      lastAgentResponseAt: null,
    });
    return {
      success: true,
      ticketId: id,
      ticketNumber,
      message:
        "A human support agent has been notified and will get back to you shortly.",
    };
  },
});
