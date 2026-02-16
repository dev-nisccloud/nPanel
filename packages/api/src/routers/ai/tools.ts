
import { z } from "zod";
import { tool } from "ai";
import prisma from "@nPanel/db";

// Mock navigation items for now to avoid circular dependency/monorepo import issues
const sidebarItems = [
    { label: "Dashboard", items: [{ title: "Overview", url: "/dashboard" }] },
    { label: "Services", items: [{ title: "Hosting", url: "/hosting" }, { title: "Domains", url: "/domains" }] }
];
const agencysidebarItems = [
    { label: "Agency", items: [{ title: "Clients", url: "/agency/clients" }, { title: "Billing", url: "/agency/billing" }] }
];

/**
 * Tool to get the system navigation structure.
 * This helps the AI guide users to the correct pages.
 */
export const getSystemNavigationTool = () => tool({
    description: "Get the current system navigation structure (pages, sub-pages, and URLs).",
    parameters: z.object({
        role: z.enum(["AGENCY", "CUSTOMER"]).describe("The role of the user (AGENCY or CUSTOMER)"),
    }),
    execute: async ({ role }: { role: "AGENCY" | "CUSTOMER" }) => {
        const items = role === "AGENCY" ? agencysidebarItems : sidebarItems;

        // Simplify for AI consumption (exclude icons, etc.)
        return items.map(group => ({
            group: group.label,
            items: group.items.map(item => ({
                title: item.title,
                url: item.url,
                subItems: [] as any[] // Simplified for mock
            }))
        }));
    },
} as any);

/**
 * Tool to get the current user's profile and team context.
 */
export const getUserContextTool = (userId: string) => tool({
    description: "Get basic information about the current user, their role, and their teams.",
    parameters: z.object({}), // userContext doesn't need input params, just context
    execute: async (_input: {}) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teamMemberships: {
                    include: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });

        return user;
    },
} as any);

/**
 * Tool to search for user-specific data (subscriptions, hosting, etc.)
 */
export const getActiveServicesTool = (userId: string) => tool({
    description: "Get active services (hosting, domains, wordpress) for the user or their teams.",
    parameters: z.object({
        teamId: z.string().optional().describe("Optional team ID to filter services by team"),
    }),
    execute: async ({ teamId }: { teamId?: string }) => {
        // Permission check: ensure user is part of the requested team
        if (teamId) {
            const membership = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId, userId } }
            });
            if (!membership) {
                // If not member, check if agency user
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
                if (!user?.role?.includes("AGENCY")) {
                    return { error: "Permission denied for this team." };
                }
            }
        }

        // Logic simplifed for context
        const where = teamId ? { teamId } : { team: { members: { some: { userId } } } };

        try {
            const [hosting, domains, wpInstances] = await Promise.all([
                prisma.hostingSubscription.findMany({ where, select: { id: true, pleskName: true, status: true, expiryDate: true } }),
                prisma.domain.findMany({ where, select: { id: true, domainName: true, expirationDate: true } }),
                prisma.wordPressInstance.findMany({
                    where,
                    select: {
                        id: true,
                        hostingSubscription: {
                            select: {
                                primaryDomain: true,
                                status: true
                            }
                        }
                    }
                })
            ]);

            const wordpress = wpInstances.map(wp => ({
                id: wp.id,
                url: wp.hostingSubscription?.primaryDomain ? `https://${wp.hostingSubscription.primaryDomain}` : null,
                status: wp.hostingSubscription?.status
            }));

            return { hosting, domains, wordpress };
        } catch (e) {
            console.error("Failed to fetch services", e);
            return { hosting: [], domains: [], wordpress: [] };
        }
    },
} as any);

/**
 * Tool to escalate the conversation to a human agent.
 */
export const escalateToHumanTool = (userId: string) => tool({
    description: "Escalate the conversation to a human support agent. Use this if the AI cannot solve the issue.",
    parameters: z.object({
        subject: z.string().describe("Brief subject for the ticket"),
        summary: z.string().describe("Summary of the AI conversation and the user's issue"),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        teamId: z.string().optional(),
    }),
    execute: async ({ subject, summary, priority, teamId }: { subject: string, summary: string, priority: "LOW" | "NORMAL" | "HIGH" | "URGENT", teamId?: string }) => {
        // Note: We'd typically use the ticketsRouter logic here or call a helper
        // For now, we'll implement the basic DB create
        const ticketNumber = `TKT-AI-${Date.now()}`;

        const ticket = await prisma.ticket.create({
            data: {
                id: `tkt_${Date.now()}`,
                ticketNumber,
                subject,
                description: summary,
                status: "OPEN",
                priority,
                source: "CHAT",
                createdById: userId,
                teamId: teamId ?? null,
            } as any
        });

        return {
            success: true,
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            message: "A human support agent has been notified and will get back to you shortly."
        };
    },
} as any);
