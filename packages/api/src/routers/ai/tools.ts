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
 */
export const getSystemNavigationTool = () => ({
    description: "Get the current system navigation structure (pages, sub-pages, and URLs).",
    parameters: {
        type: "object",
        properties: {
            role: {
                type: "string",
                enum: ["AGENCY", "CUSTOMER"],
                description: "The role of the user (AGENCY or CUSTOMER)"
            },
        },
        required: ["role"],
    },
    execute: async ({ role }: { role: "AGENCY" | "CUSTOMER" }) => {
        const items = role === "AGENCY" ? agencysidebarItems : sidebarItems;
        return items.map(group => ({
            group: group.label,
            items: group.items.map(item => ({
                title: item.title,
                url: item.url,
                subItems: [] as any[]
            }))
        }));
    },
});

/**
 * Tool to get the current user's profile and team context.
 */
export const getUserContextTool = (userId: string) => ({
    description: "Get basic information about the current user, their role, and their teams.",
    parameters: {
        type: "object",
        properties: {},
        required: []
    },
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
});

/**
 * Tool to search for user-specific data
 */
export const getActiveServicesTool = (userId: string) => ({
    description: "Get active services (hosting, domains, wordpress) for the user or their teams.",
    parameters: {
        type: "object",
        properties: {
            teamId: { type: "string", description: "Optional team ID to filter services by team" }
        }
    },
    execute: async ({ teamId }: { teamId?: string }) => {
        if (teamId) {
            const membership = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId, userId } }
            });
            if (!membership) {
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
                if (!user?.role?.includes("AGENCY")) {
                    return { error: "Permission denied for this team." };
                }
            }
        }

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
});

/**
 * Tool to escalate the conversation to a human agent.
 */
export const escalateToHumanTool = (userId: string) => ({
    description: "Escalate the conversation to a human support agent. Use this if the AI cannot solve the issue.",
    parameters: {
        type: "object",
        properties: {
            subject: { type: "string", description: "Brief subject for the ticket" },
            summary: { type: "string", description: "Summary of the AI conversation and the user's issue" },
            priority: {
                type: "string",
                enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
                default: "NORMAL"
            },
            teamId: { type: "string" }
        },
        required: ["subject", "summary"]
    },
    execute: async ({ subject, summary, priority, teamId }: { subject: string, summary: string, priority: "LOW" | "NORMAL" | "HIGH" | "URGENT", teamId?: string }) => {
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
});
