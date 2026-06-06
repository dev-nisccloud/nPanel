import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, or } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingPlan, hostingSubscription, wordPressInstance, wordPressInstanceActivityLog, } from "@npanel/db/schema/hosting";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";
import * as crypto from "node:crypto";
// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================
const linkToTeamInputSchema = z.object({
    teamId: z.string(),
    hostingPlanId: z.string().optional(), // Optional link to hosting subscription
    installationId: z.number().int().positive(), // WordPress installation ID from WP Toolkit
});
const linkToTeamOutputSchema = z.object({
    success: z.boolean(),
    id: z.string(),
});
const getByInstallationIdInputSchema = z.object({
    installationId: z.number().int().positive(),
});
const getByInstallationIdOutputSchema = z.object({
    id: z.string(),
    teamId: z.string().nullable(),
    installationId: z.number(),
    hostingSubscriptionId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
const unlinkFromTeamInputSchema = z.object({
    subscriptionId: z.string(),
});
const unlinkFromTeamOutputSchema = z.object({
    success: z.boolean(),
});
const updateSubscriptionInputSchema = z.object({
    subscriptionId: z.string(),
    hostingPlanId: z.string().optional(),
}).refine((data) => {
    // At least one field must be provided for update
    return data.hostingPlanId !== undefined;
}, {
    message: "At least one field must be provided for update",
});
const updateSubscriptionOutputSchema = z.object({
    success: z.boolean(),
    id: z.string(),
});
const getDetailWithSubscriptionInputSchema = z.object({
    installationId: z.number().int().positive(),
});
const getDetailWithSubscriptionOutputSchema = z.object({
    installation: z.any(), // WordPress installation data from WP Toolkit
    subscription: getByInstallationIdOutputSchema.nullable(),
});
function getActor(ctx) {
    const userId = ctx.session?.user?.id;
    if (!userId) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
        });
    }
    return { userId, role: ctx.session?.user?.role };
}
function isAgencyUserRole(role) {
    return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}
function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
async function ensureTeamReadAccess(params) {
    if (isAgencyUserRole(params.role))
        return;
    const [membership, ownedTeam] = await Promise.all([
        db.query.teamMember.findFirst({
            where: and(eq(teamMember.teamId, params.teamId), eq(teamMember.userId, params.userId)),
            columns: { id: true },
        }),
        db.query.team.findFirst({
            where: and(eq(team.id, params.teamId), eq(team.createdById, params.userId)),
            columns: { id: true },
        }),
    ]);
    if (!membership && !ownedTeam) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team",
        });
    }
}
async function ensureTeamMutationAccess(params) {
    if (isAgencySuperAdminRole(params.role))
        return;
    const ownedTeam = await db.query.team.findFirst({
        where: and(eq(team.id, params.teamId), eq(team.createdById, params.userId)),
        columns: { id: true },
    });
    if (!ownedTeam) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to modify this team subscription",
        });
    }
}
function normalizeHost(raw) {
    let h = raw.trim().toLowerCase();
    h = h.replace(/^https?:\/\//, "");
    const slash = h.indexOf("/");
    if (slash !== -1)
        h = h.slice(0, slash);
    const colon = h.indexOf(":");
    if (colon !== -1)
        h = h.slice(0, colon);
    return h;
}
function installationHostFromPayload(installation) {
    if (!installation || typeof installation !== "object")
        return "";
    const inst = installation;
    const dom = inst.domain;
    if (dom && typeof dom === "object") {
        const name = dom.name;
        if (typeof name === "string" && name.trim())
            return normalizeHost(name);
    }
    const url = inst.url;
    if (typeof url === "string" && url.trim()) {
        try {
            const u = new URL(url.includes("://") ? url : `https://${url}`);
            return normalizeHost(u.hostname);
        }
        catch {
            return normalizeHost(url);
        }
    }
    return "";
}
function fqdnLooksLikeDomain(s) {
    return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(s.trim());
}
/** Exact primary domain / panel name match, or WP host is a subdomain under that account domain */
function installationMatchesHostingDomains(installationHost, primaryDomain, extraNames) {
    if (!installationHost)
        return false;
    const bases = [primaryDomain, ...extraNames]
        .filter((x) => typeof x === "string" && x.trim().length > 0)
        .map((x) => normalizeHost(x))
        .filter(Boolean);
    for (const base of bases) {
        if (!base)
            continue;
        if (installationHost === base)
            return true;
        if (installationHost.endsWith(`.${base}`))
            return true;
    }
    return false;
}
async function fetchWpToolkitInstallation(installationId) {
    const { sendPleskRestRequest } = await import("../lib/plesk/rest-client");
    if (!process.env.PLESK_REST_ENDPOINT) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
        });
    }
    const endpoint = `/v1/installations/${installationId}`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, "GET");
    if (isHostUnreachable) {
        throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Plesk host is unreachable",
        });
    }
    if (isAuthError) {
        throw new TRPCError({
            code: statusCode === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
            message: statusCode === 403
                ? "WP Toolkit rejected this request (HTTP 403). Check that the API key allows WP Toolkit REST access, extension permissions, and IP restrictions."
                : "Invalid or missing Plesk API credentials for WP Toolkit",
        });
    }
    if (statusCode === 404) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: `WordPress installation with ID ${installationId} not found`,
        });
    }
    if (statusCode < 200 || statusCode >= 300 || !data) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `WP Toolkit API returned status ${statusCode}: ${JSON.stringify(data)}`,
        });
    }
    return data;
}
async function teamIdForClientSubscriptionWpInstallation(params) {
    const rows = await db
        .select({ teamId: niscClientSubscription.teamId })
        .from(niscClientSubscription)
        .innerJoin(team, eq(team.id, niscClientSubscription.teamId))
        .leftJoin(teamMember, eq(teamMember.teamId, niscClientSubscription.teamId))
        .where(and(eq(niscClientSubscription.wpInstallationId, params.installationId), or(eq(teamMember.userId, params.userId), eq(team.createdById, params.userId))))
        .limit(1);
    const tid = rows[0]?.teamId;
    return typeof tid === "string" ? tid : null;
}
// ============================================================================
// tRPC ROUTER
// ============================================================================
export const wordpressSubscriptionsRouter = router({
    // Get WordPress installation detail with subscription link (batched)
    getDetailWithSubscription: protectedProcedure
        .input(getDetailWithSubscriptionInputSchema)
        .output(getDetailWithSubscriptionOutputSchema)
        .query(async ({ ctx, input }) => {
        const actor = getActor(ctx);
        const wpLinkRow = await db.query.wordPressInstance.findFirst({
            where: eq(wordPressInstance.installationId, input.installationId),
            columns: {
                id: true,
                teamId: true,
                installationId: true,
                hostingSubscriptionId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const subscription = wpLinkRow
            ? {
                id: wpLinkRow.id,
                teamId: wpLinkRow.teamId,
                installationId: wpLinkRow.installationId,
                hostingSubscriptionId: wpLinkRow.hostingSubscriptionId,
                createdAt: wpLinkRow.createdAt,
                updatedAt: wpLinkRow.updatedAt,
            }
            : null;
        let customerAuthorized = isAgencyUserRole(actor.role);
        if (!customerAuthorized && subscription?.teamId) {
            await ensureTeamReadAccess({
                teamId: subscription.teamId,
                userId: actor.userId,
                role: actor.role,
            });
            customerAuthorized = true;
        }
        if (!customerAuthorized) {
            const teamFromWpId = await teamIdForClientSubscriptionWpInstallation({
                userId: actor.userId,
                installationId: input.installationId,
            });
            if (teamFromWpId) {
                await ensureTeamReadAccess({
                    teamId: teamFromWpId,
                    userId: actor.userId,
                    role: actor.role,
                });
                customerAuthorized = true;
            }
        }
        let installation;
        try {
            installation = await fetchWpToolkitInstallation(input.installationId);
        }
        catch (e) {
            if (e instanceof TRPCError)
                throw e;
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: e instanceof Error ? e.message : "Failed to fetch WordPress installation",
            });
        }
        if (!installation) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `WordPress installation with ID ${input.installationId} not found`,
            });
        }
        if (!customerAuthorized) {
            const installationHost = installationHostFromPayload(installation);
            if (!installationHost) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this WordPress installation",
                });
            }
            const accessiblePanelHosting = await db
                .select({
                primaryDomain: hostingSubscription.primaryDomain,
                pleskName: hostingSubscription.pleskName,
            })
                .from(hostingSubscription)
                .innerJoin(team, eq(team.id, hostingSubscription.teamId))
                .leftJoin(teamMember, eq(teamMember.teamId, hostingSubscription.teamId))
                .where(or(eq(teamMember.userId, actor.userId), eq(team.createdById, actor.userId)));
            const accessibleNisc = await db
                .select({
                primaryDomain: niscClientSubscription.primaryDomain,
                name: niscClientSubscription.name,
            })
                .from(niscClientSubscription)
                .innerJoin(team, eq(team.id, niscClientSubscription.teamId))
                .leftJoin(teamMember, eq(teamMember.teamId, niscClientSubscription.teamId))
                .where(or(eq(teamMember.userId, actor.userId), eq(team.createdById, actor.userId)));
            let hasDomainAccess = accessiblePanelHosting.some((row) => installationMatchesHostingDomains(installationHost, row.primaryDomain, [row.pleskName]));
            if (!hasDomainAccess) {
                hasDomainAccess = accessibleNisc.some((row) => {
                    const nameFqdns = typeof row.name === "string" && fqdnLooksLikeDomain(row.name) ? [row.name] : [];
                    return installationMatchesHostingDomains(installationHost, row.primaryDomain, nameFqdns);
                });
            }
            if (!hasDomainAccess) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this WordPress installation",
                });
            }
        }
        return {
            installation,
            subscription,
        };
    }),
    // Get subscription by WordPress installation ID
    getByInstallationId: protectedProcedure
        .input(getByInstallationIdInputSchema)
        .output(getByInstallationIdOutputSchema)
        .query(async ({ ctx, input }) => {
        const actor = getActor(ctx);
        const subscription = await db.query.wordPressInstance.findFirst({
            where: eq(wordPressInstance.installationId, input.installationId),
            with: {
                team: true,
            },
        });
        if (!subscription) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "WordPress subscription not found",
            });
        }
        if (!subscription.teamId && !isAgencyUserRole(actor.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have access to this WordPress subscription",
            });
        }
        if (subscription.teamId) {
            await ensureTeamReadAccess({
                teamId: subscription.teamId,
                userId: actor.userId,
                role: actor.role,
            });
        }
        return {
            id: subscription.id,
            teamId: subscription.teamId,
            installationId: subscription.installationId,
            hostingSubscriptionId: subscription.hostingSubscriptionId,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
    }),
    // Link an existing WordPress installation to a team
    linkToTeam: protectedProcedure
        .input(linkToTeamInputSchema)
        .output(linkToTeamOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getActor(ctx);
        const userId = actor.userId;
        // Verify team exists
        const teamRow = await db.query.team.findFirst({
            where: eq(team.id, input.teamId),
        });
        if (!teamRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Team not found",
            });
        }
        await ensureTeamMutationAccess({
            teamId: teamRow.id,
            userId: actor.userId,
            role: actor.role,
        });
        // Check if WordPress instance with this installationId already exists
        const existingInstance = await db.query.wordPressInstance.findFirst({
            where: eq(wordPressInstance.installationId, input.installationId),
        });
        if (existingInstance) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "A WordPress instance with this installation ID already exists",
            });
        }
        // Get hosting plan if provided
        let hostingPlanId = null;
        if (input.hostingPlanId) {
            // Verify the provided plan exists and is active
            const providedPlan = await db.query.hostingPlan.findFirst({
                where: eq(hostingPlan.id, input.hostingPlanId),
            });
            if (!providedPlan) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Hosting plan not found",
                });
            }
            if (!providedPlan.isActive) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Selected hosting plan is not active",
                });
            }
            hostingPlanId = providedPlan.id;
        }
        // Create the WordPress instance record
        const [instance] = await db
            .insert(wordPressInstance)
            .values({
            id: crypto.randomUUID(),
            teamId: input.teamId,
            installationId: input.installationId,
            hostingSubscriptionId: hostingPlanId, // Link to hosting subscription if provided
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        if (!instance) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create WordPress instance",
            });
        }
        // Log activity
        await db.insert(wordPressInstanceActivityLog).values({
            id: crypto.randomUUID(),
            wordpressInstanceId: instance.id,
            userId: userId,
            action: "LINK_TO_TEAM",
            description: `Linked WordPress instance to team: ${teamRow.name}`,
            metadata: {
                teamId: teamRow.id,
                teamName: teamRow.name,
                installationId: input.installationId,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
        });
        return {
            success: true,
            id: instance.id,
        };
    }),
    // Unlink WordPress instance from team
    unlinkFromTeam: protectedProcedure
        .input(unlinkFromTeamInputSchema)
        .output(unlinkFromTeamOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getActor(ctx);
        const userId = actor.userId;
        // Find the WordPress instance
        const instance = await db.query.wordPressInstance.findFirst({
            where: eq(wordPressInstance.id, input.subscriptionId),
            with: {
                team: true,
            },
        });
        if (!instance) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "WordPress instance not found",
            });
        }
        if (!instance.teamId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "WordPress instance is not linked to any team",
            });
        }
        await ensureTeamMutationAccess({
            teamId: instance.teamId,
            userId: actor.userId,
            role: actor.role,
        });
        const teamName = instance.team?.name || "Unknown Team";
        // Log activity before deletion (we need the instance ID)
        await db.insert(wordPressInstanceActivityLog).values({
            id: crypto.randomUUID(),
            wordpressInstanceId: instance.id,
            userId: userId,
            action: "UNLINK_FROM_TEAM",
            description: `Unlinked WordPress instance from team: ${teamName}. Instance deleted.`,
            metadata: {
                previousTeamId: instance.teamId,
                previousTeamName: teamName,
                installationId: instance.installationId,
                deleted: true,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
        });
        // Delete the WordPress instance entirely so it can be linked to another team later
        await db.delete(wordPressInstance).where(eq(wordPressInstance.id, input.subscriptionId));
        return {
            success: true,
        };
    }),
    // Update WordPress instance subscription
    updateSubscription: protectedProcedure
        .input(updateSubscriptionInputSchema)
        .output(updateSubscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getActor(ctx);
        const userId = actor.userId;
        // Find the WordPress instance
        const existingInstance = await db.query.wordPressInstance.findFirst({
            where: eq(wordPressInstance.id, input.subscriptionId),
        });
        if (!existingInstance) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "WordPress instance not found",
            });
        }
        if (!existingInstance.teamId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Cannot update an unscoped WordPress subscription",
            });
        }
        await ensureTeamMutationAccess({
            teamId: existingInstance.teamId,
            userId: actor.userId,
            role: actor.role,
        });
        // Build update data - only include fields that are provided
        const updateData = {
            updatedAt: new Date(),
        };
        if (input.hostingPlanId !== undefined) {
            // Verify the plan exists and is active
            const plan = await db.query.hostingPlan.findFirst({
                where: eq(hostingPlan.id, input.hostingPlanId),
            });
            if (!plan) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Hosting plan not found",
                });
            }
            if (!plan.isActive) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Selected hosting plan is not active",
                });
            }
            updateData.hostingSubscriptionId = input.hostingPlanId;
        }
        // Update the WordPress instance
        const [updatedInstance] = await db
            .update(wordPressInstance)
            .set(updateData)
            .where(eq(wordPressInstance.id, input.subscriptionId))
            .returning();
        if (!updatedInstance) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update WordPress instance",
            });
        }
        // Log activity
        await db.insert(wordPressInstanceActivityLog).values({
            id: crypto.randomUUID(),
            wordpressInstanceId: updatedInstance.id,
            userId: userId,
            action: "UPDATE",
            description: "WordPress instance updated",
            metadata: {
                updatedFields: Object.keys(updateData).filter(key => key !== "updatedAt"),
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
        });
        return {
            success: true,
            id: updatedInstance.id,
        };
    }),
});
