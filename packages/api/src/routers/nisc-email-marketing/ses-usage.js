import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { getSesSendQuotaSnapshot } from "../../lib/ses-quota";
import { getSesClient, buildEasyDkimDnsRecords, } from "../../lib/ses-client";
import { db, eq, inArray } from "@npanel/db";
import { and } from "@npanel/db";
import { niscEmDomain, team, teamMember } from "@npanel/db/schema";
import { randomUUID } from "node:crypto";
function isAgencyUserRole(role) {
    return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}
function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
function assertAgencyReadAccess(role) {
    if (!isAgencyUserRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency users can access SES usage data",
        });
    }
}
export const niscEmailMarketingSesUsageRouter = router({
    quotaLive: protectedProcedure
        .input(z.object({}).default({}))
        .query(async ({ ctx }) => {
        assertAgencyReadAccess(ctx.session?.user?.role);
        const quota = await getSesSendQuotaSnapshot();
        return {
            maxSendRate: quota.maxSendRate,
            max24HourSend: quota.max24HourSend,
            sentLast24Hours: quota.sentLast24Hours,
            remaining24HourSend: Math.max(0, quota.max24HourSend - quota.sentLast24Hours),
        };
    }),
    listDomainsLive: protectedProcedure
        .input(z
        .object({
        limit: z.number().int().min(1).max(200).optional().default(100),
    })
        .default({}))
        .query(async ({ ctx, input }) => {
        assertAgencyReadAccess(ctx.session?.user?.role);
        const ses = getSesClient();
        // SES classic API supports listing identities (domains + emails).
        // We only want domains here.
        const domains = [];
        let token;
        // Fetch until we hit limit (SES returns up to 1000 per page).
        while (domains.length < input.limit) {
            const res = await ses.listIdentities({
                IdentityType: "Domain",
                MaxItems: Math.min(1000, input.limit - domains.length),
                NextToken: token,
            });
            domains.push(...(res.Identities ?? []));
            token = res.NextToken;
            if (!token)
                break;
        }
        if (domains.length === 0)
            return { domains: [] };
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
        // Optional: include DB connection status for "Connect to nPanel" UX.
        const connectedRows = await db
            .select({
            id: niscEmDomain.id,
            domainName: niscEmDomain.domainName,
            teamId: niscEmDomain.teamId,
            userId: niscEmDomain.userId,
        })
            .from(niscEmDomain)
            .where(inArray(niscEmDomain.domainName, domains));
        const connectedByName = new Map(connectedRows.map((r) => [r.domainName, r]));
        const dkimAttrs = await ses.getIdentityDkimAttributes({ Identities: domains });
        const dkimMap = dkimAttrs.DkimAttributes ?? {};
        // Build rows the UI can use for "usage" table + view sheet.
        // Note: SES doesn't provide createdAt/verifiedAt timestamps, so we omit them.
        const rows = domains.map((domainName) => {
            const attrs = dkimMap[domainName];
            const dkimStatus = attrs?.DkimVerificationStatus ?? "NotStarted";
            const dkimTokens = attrs?.DkimTokens ?? [];
            const dnsRecords = buildEasyDkimDnsRecords(domainName, dkimTokens);
            // Map AWS status to our UI's domain status.
            const status = dkimStatus === "Success"
                ? "VERIFIED"
                : dkimStatus === "Failed"
                    ? "FAILED"
                    : "PENDING";
            const connected = connectedByName.get(domainName);
            return {
                id: domainName, // stable key for UI; not a DB id
                domainName,
                status,
                verificationStatus: dkimStatus,
                dnsRecords: dnsRecords.map((r) => ({
                    record: r.type,
                    type: r.type,
                    name: r.name,
                    value: r.value,
                })),
                connected: Boolean(connected),
                connectedDomainId: connected?.id ?? null,
                connectedTeamId: connected?.teamId ?? null,
            };
        });
        return { domains: rows };
    }),
    verifyDomainLive: protectedProcedure
        .input(z.object({ domainName: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        assertAgencyReadAccess(ctx.session?.user?.role);
        const ses = getSesClient();
        const domainName = input.domainName.trim().toLowerCase();
        const attrs = await ses.getIdentityDkimAttributes({ Identities: [domainName] });
        const entry = attrs.DkimAttributes?.[domainName];
        if (!entry) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found in SES identities" });
        }
        const dkimStatus = entry.DkimVerificationStatus ?? "NotStarted";
        const dkimTokens = entry.DkimTokens ?? [];
        const dnsRecords = buildEasyDkimDnsRecords(domainName, dkimTokens);
        const status = dkimStatus === "Success"
            ? "VERIFIED"
            : dkimStatus === "Failed"
                ? "FAILED"
                : "PENDING";
        return {
            domainName,
            status,
            verificationStatus: dkimStatus,
            dnsRecords: dnsRecords.map((r) => ({
                record: r.type,
                type: r.type,
                name: r.name,
                value: r.value,
            })),
        };
    }),
    connectToNPanel: protectedProcedure
        .input(z.object({
        domainName: z.string().min(1),
        teamId: z.string().nullable().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
        const role = ctx.session?.user?.role;
        if (!isAgencyUserRole(role)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to connect domains" });
        }
        const domainName = input.domainName.trim().toLowerCase();
        const ses = getSesClient();
        // Ensure it exists in SES identities
        const attrs = await ses.getIdentityDkimAttributes({ Identities: [domainName] });
        const entry = attrs.DkimAttributes?.[domainName];
        if (!entry)
            throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found in SES identities" });
        const teamId = input.teamId ?? null;
        if (teamId) {
            const [t] = await db.select({ id: team.id }).from(team).where(eq(team.id, teamId)).limit(1);
            if (!t)
                throw new TRPCError({ code: "BAD_REQUEST", message: "Team not found" });
            if (!isAgencySuperAdminRole(role)) {
                const [ownerOrMember] = await db
                    .select({ id: teamMember.id })
                    .from(teamMember)
                    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
                    .limit(1);
                if (!ownerOrMember) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
            }
        }
        const dkimStatus = entry.DkimVerificationStatus ?? "NotStarted";
        const dkimTokens = entry.DkimTokens ?? [];
        const dnsRecords = buildEasyDkimDnsRecords(domainName, dkimTokens);
        const status = dkimStatus === "Success"
            ? "VERIFIED"
            : dkimStatus === "Failed"
                ? "FAILED"
                : "PENDING";
        const now = new Date();
        // If already connected, just return it.
        const [existing] = await db
            .select()
            .from(niscEmDomain)
            .where(eq(niscEmDomain.domainName, domainName))
            .limit(1);
        if (existing) {
            return { id: existing.id, domainName: existing.domainName, alreadyConnected: true };
        }
        const id = randomUUID();
        await db.insert(niscEmDomain).values({
            id,
            userId,
            teamId,
            domainName,
            status: status,
            dkimStatus: dkimStatus,
            dkimTokens,
            mailFromMode: "DEFAULT",
            mailFromDomain: null,
            mailFromStatus: null,
            dnsRecords,
            feedbackForwardingDisabled: false,
            verifiedAt: status === "VERIFIED" ? now : null,
            createdAt: now,
            updatedAt: now,
        });
        return { id, domainName, alreadyConnected: false };
    }),
    disconnectFromNPanel: protectedProcedure
        .input(z.object({ domainName: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
        const role = ctx.session?.user?.role;
        if (!isAgencyUserRole(role)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to disconnect domains" });
        }
        const domainName = input.domainName.trim().toLowerCase();
        const [domain] = await db.select().from(niscEmDomain).where(eq(niscEmDomain.domainName, domainName)).limit(1);
        if (!domain)
            return { ok: true };
        if (!isAgencySuperAdminRole(role) && domain.userId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only the domain creator can disconnect it",
            });
        }
        // Remove from DB only (do NOT delete SES identity)
        await db.delete(niscEmDomain).where(eq(niscEmDomain.id, domain.id));
        return { ok: true };
    }),
});
