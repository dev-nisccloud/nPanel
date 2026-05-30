import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import {
	hostingPlan,
	hostingSubscription,
	hostingSubscriptionActivityLog,
	niscServicePlan,
} from "@npanel/db/schema/hosting";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { serviceSubscription } from "@npanel/db/schema/service-subscriptions";
import { team, teamMember } from "@npanel/db/schema/teams";
import { XMLParser } from 'fast-xml-parser';
import { sendPleskXmlRequest } from '../lib/plesk/xml-client';
import * as crypto from "crypto";

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
	role === "AGENCY_SUPER_ADMIN";

async function ensureTeamReadAccess(teamId: string, userId: string, role: string | null | undefined) {
	if (isAgencyUserRole(role)) return;
	const [membership, ownedTeam] = await Promise.all([
		db.query.teamMember.findFirst({
			where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
			columns: { id: true },
		}),
		db.query.team.findFirst({
			where: and(eq(team.id, teamId), eq(team.createdById, userId)),
			columns: { id: true },
		}),
	]);
	if (!membership && !ownedTeam) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team resource",
		});
	}
}

async function ensureTeamMutationAccess(teamId: string, userId: string, role: string | null | undefined) {
	if (isAgencySuperAdminRole(role)) return;
	const [teamRow] = await db
		.select({ createdById: team.createdById })
		.from(team)
		.where(eq(team.id, teamId))
		.limit(1);
	if (!teamRow) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
	}
	if (teamRow.createdById !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the team owner can modify this resource",
		});
	}
}

/** Unwrap fast-xml-parser text nodes (e.g. `{ "#text": "123" }`) */
function pleskXmlScalar(value: unknown): string | undefined {
	if (value == null) return undefined;
	if (typeof value === "string" || typeof value === "number") {
		return String(value).trim();
	}
	if (typeof value === "object" && value !== null && "#text" in value) {
		const t = (value as { "#text": unknown })["#text"];
		if (t == null) return undefined;
		return String(t).trim();
	}
	return undefined;
}

/**
 * Plesk webspace/get <result> top-level <id> is the numeric subscription id used in hosting URLs.
 * Never use <filter-id> for routing - when filtering by domain name, filter-id echoes the domain string.
 */
function extractPleskWebspaceNumericId(result: Record<string, unknown> | undefined): number | null {
	if (!result) return null;
	const s = pleskXmlScalar(result.id);
	if (!s) return null;
	const n = parseInt(s.replace(/\s/g, ""), 10);
	if (Number.isNaN(n) || n <= 0) return null;
	return n;
}

function isPleskWebspaceResultPresent(result: Record<string, unknown> | undefined): boolean {
	if (!result) return false;
	const st = pleskXmlScalar(result.status);
	if (st?.toLowerCase() === "error") return false;
	if (st?.toLowerCase() === "ok") return true;
	return result.data != null;
}

async function resolvePleskIdFromDbByPrimaryDomain(domainLower: string): Promise<number | null> {
	const rows = await db
		.select({ pleskFilterId: hostingSubscription.pleskFilterId })
		.from(hostingSubscription)
		.where(sql`lower(${hostingSubscription.primaryDomain}) = ${domainLower}`)
		.limit(10);
	for (const row of rows) {
		const n = parseInt(String(row.pleskFilterId ?? "").replace(/\s/g, ""), 10);
		if (!Number.isNaN(n) && n > 0) return n;
	}
	return null;
}

/** Customer teams: only treat as "connected" if this Plesk webspace is linked to the team's client subscription row(s). */
async function teamHasLinkedHostingForPleskId(teamId: string, pleskId: number): Promise<boolean> {
	const idStr = String(pleskId);
	const [direct, viaHosting] = await Promise.all([
		db
			.select({ id: niscClientSubscription.id })
			.from(niscClientSubscription)
			.where(
				and(
					eq(niscClientSubscription.teamId, teamId),
					or(
						eq(niscClientSubscription.pleskFilterId, idStr),
						sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`,
					),
				),
			)
			.limit(1)
			.then((r) => r[0] ?? null),
		db
			.select({ id: niscClientSubscription.id })
			.from(niscClientSubscription)
			.innerJoin(
				hostingSubscription,
				eq(niscClientSubscription.hostingSubscriptionId, hostingSubscription.id),
			)
			.where(and(eq(niscClientSubscription.teamId, teamId), eq(hostingSubscription.pleskFilterId, idStr)))
			.limit(1)
			.then((r) => r[0] ?? null),
	]);
	return !!(direct || viaHosting);
}

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const linkToTeamInputSchema = z.object({
	subscriptionId: z.string(),
	teamId: z.string(),
	hostingPlanId: z.string().optional(),
	pleskFilterId: z.string().min(1, "Plesk Filter ID is required"),
	hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]).optional(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
	nextRenewalDate: z.coerce.date().optional(),
	expiryDate: z.coerce.date().optional(),
	primaryDomain: z.string().optional(),
	notes: z.string().optional(),
	autoRenew: z.boolean().default(true),
});

const linkToTeamOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

const getByPleskFilterIdInputSchema = z.object({
	pleskFilterId: z.string().min(1, "Plesk Filter ID is required"),
});

const getByPleskFilterIdOutputSchema = z.object({
	id: z.string(),
	teamId: z.string().nullable(),
	hostingPlanId: z.string(),
	primaryDomain: z.string().nullable(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
	nextRenewalDate: z.date().nullable(),
	expiryDate: z.date().nullable(),
	notes: z.string().nullable(),
	autoRenew: z.boolean(),
	hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]),
}).nullable();

const getHostingByDomainNameInputSchema = z.object({
	domainName: z.string().min(1, "Domain name is required"),
	/** Required for customer (non-agency) callers: scopes "connected hosting" to subscriptions linked to this team. */
	teamId: z.string().optional(),
});

const getHostingByDomainNameOutputSchema = z.object({
	hasHosting: z.boolean(),
	subscriptionId: z.string().nullable(),
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
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
	nextRenewalDate: z.coerce.date().optional(),
	expiryDate: z.coerce.date().optional(),
	primaryDomain: z.string().optional(),
	notes: z.string().optional(),
	autoRenew: z.boolean().optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return (
			data.hostingPlanId !== undefined ||
			data.billingCycle !== undefined ||
			data.nextRenewalDate !== undefined ||
			data.expiryDate !== undefined ||
			data.primaryDomain !== undefined ||
			data.notes !== undefined ||
			data.autoRenew !== undefined
		);
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateSubscriptionOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

const getDetailWithSubscriptionInputSchema = z.object({
	subscriptionId: z.string(),
	teamId: z.string().optional(), // Optional teamId for ownership verification
});

// ServiceSubscription status enum (independent schema, source of truth is DB)
const serviceSubscriptionStatusSchema = z.enum([
	"ACTIVE",
	"PENDING",
	"SUSPENDED",
	"CANCELLED",
	"EXPIRED",
	"PROCESSING",
	"FAILED",
]);

// BillingCycle enum (independent schema, source of truth is DB)
const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);

// ServiceSubscription output schema (API layer - dates as ISO strings for JSON serialization)
const serviceSubscriptionOutputSchema = z.object({
	id: z.string(),
	subscriptionDate: z.string().nullable(), // ISO date string
	billingCycle: billingCycleSchema,
	nextRenewalDate: z.string().nullable(), // ISO date string
	status: serviceSubscriptionStatusSchema,
	autoRenew: z.boolean(),
});

const getDetailWithSubscriptionOutputSchema = z.object({
	hosting: z.any(), // Plesk subscription data
	subscription: getByPleskFilterIdOutputSchema,
	serviceSubscription: serviceSubscriptionOutputSchema.nullable(),
});

export const hostingRouter = router({
	// Get hosting subscription detail with subscription link (batched)
		getDetailWithSubscription: protectedProcedure
		.input(getDetailWithSubscriptionInputSchema)
		.output(getDetailWithSubscriptionOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view your hosting subscriptions",
				});
			}
			const role = session.user.role;

			// Resolve subscriptionId: numeric Plesk id, or NiscClientSubscription id (CUID), or legacy HostingSubscription id (CUID for agency only)
			// Customer access is always enforced through nisc_client_subscription + team membership.
			let subscriptionIdNumber: number;
			const parsedNumber = parseInt(input.subscriptionId, 10);
			if (!Number.isNaN(parsedNumber) && parsedNumber > 0) {
				subscriptionIdNumber = parsedNumber;
				if (!isAgencyUserRole(role)) {
					// Customer-side guardrail: Plesk id must match a nisc_client_subscription row for a team the user can read (member or owner).
					const numericId = String(parsedNumber);
					const accessibleRows = await db
						.select({
							id: niscClientSubscription.id,
							teamId: niscClientSubscription.teamId,
						})
						.from(niscClientSubscription)
						.where(
							and(
								or(
									eq(niscClientSubscription.pleskFilterId, numericId),
									sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${numericId}`,
								),
								...(input.teamId ? [eq(niscClientSubscription.teamId, input.teamId)] : []),
							),
						)
						.limit(1);
					const accessibleRow = accessibleRows[0];
					if (!accessibleRow?.teamId) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "You do not have access to this resource",
						});
					}
					await ensureTeamReadAccess(accessibleRow.teamId, session.user.id, role);
				}
			} else {
				// CUID path: resolve NiscClientSubscription first (source of truth)
				const niscSubRows = await db
					.select({
						teamId: niscClientSubscription.teamId,
						serviceRefs: niscClientSubscription.serviceRefs,
						pleskFilterId: niscClientSubscription.pleskFilterId,
						hostingSubscriptionId: niscClientSubscription.hostingSubscriptionId,
					})
					.from(niscClientSubscription)
					.where(eq(niscClientSubscription.id, input.subscriptionId))
					.limit(1);
				const niscSub = niscSubRows[0];
				if (niscSub) {
					if (input.teamId && niscSub.teamId !== input.teamId) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "You do not have access to this resource",
						});
					}
					if (!isAgencyUserRole(role)) {
						await ensureTeamReadAccess(niscSub.teamId, session.user.id, role);
					}
					let pleskIdStr: string | null = null;
					const refs = niscSub.serviceRefs as Record<string, unknown> | null;
					if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
						pleskIdStr = String(refs.pleskSubscriptionId);
					}
					if (!pleskIdStr && niscSub.pleskFilterId) pleskIdStr = niscSub.pleskFilterId;
					if (!pleskIdStr && niscSub.hostingSubscriptionId && isAgencyUserRole(role)) {
						const hsRows = await db
							.select({ pleskFilterId: hostingSubscription.pleskFilterId })
							.from(hostingSubscription)
							.where(eq(hostingSubscription.id, niscSub.hostingSubscriptionId))
							.limit(1);
						const hs = hsRows[0];
						if (hs?.pleskFilterId) pleskIdStr = hs.pleskFilterId;
					}
					const pleskNum = pleskIdStr ? parseInt(pleskIdStr, 10) : NaN;
					if (Number.isNaN(pleskNum) || pleskNum <= 0) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Hosting subscription not found",
						});
					}
					subscriptionIdNumber = pleskNum;
				} else {
					let resolvedPleskFromServiceOrLegacy = false;

					// Billing row id (service_subscription._id) → hosting_subscription → Plesk (customer teams).
					const svcRows = await db
						.select({
							teamId: serviceSubscription.teamId,
							hostingSubscriptionId: serviceSubscription.hostingSubscriptionId,
						})
						.from(serviceSubscription)
						.innerJoin(niscServicePlan, eq(serviceSubscription.niscServicePlanId, niscServicePlan.id))
						.where(
							and(
								eq(serviceSubscription.id, input.subscriptionId),
								eq(niscServicePlan.planType, "HOSTING"),
							),
						)
						.limit(1);
					const svc = svcRows[0];
					if (svc?.teamId && svc.hostingSubscriptionId) {
						if (input.teamId && svc.teamId !== input.teamId) {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "You do not have access to this resource",
							});
						}
						if (!isAgencyUserRole(role)) {
							await ensureTeamReadAccess(svc.teamId, session.user.id, role);
						}
						const hsRows = await db
							.select({ pleskFilterId: hostingSubscription.pleskFilterId })
							.from(hostingSubscription)
							.where(eq(hostingSubscription.id, svc.hostingSubscriptionId))
							.limit(1);
						const hs = hsRows[0];
						const pleskNumFromSvc = hs?.pleskFilterId ? parseInt(hs.pleskFilterId, 10) : NaN;
						if (!Number.isNaN(pleskNumFromSvc) && pleskNumFromSvc > 0) {
							subscriptionIdNumber = pleskNumFromSvc;
							resolvedPleskFromServiceOrLegacy = true;
						} else if (!isAgencyUserRole(role)) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Hosting subscription not found",
							});
						}
					}

					if (!resolvedPleskFromServiceOrLegacy) {
						// Legacy fallback: HostingSubscription id is agency-only when not resolved above.
						if (!isAgencyUserRole(role)) {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "You do not have access to this resource",
							});
						}
						const hostingSubRows = await db
							.select({
								pleskFilterId: hostingSubscription.pleskFilterId,
								teamId: hostingSubscription.teamId,
							})
							.from(hostingSubscription)
							.where(eq(hostingSubscription.id, input.subscriptionId))
							.limit(1);
						const hostingSub = hostingSubRows[0];
						if (!hostingSub?.pleskFilterId) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Hosting subscription not found",
							});
						}
						const pleskNum = parseInt(hostingSub.pleskFilterId, 10);
						if (Number.isNaN(pleskNum) || pleskNum <= 0) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: "Invalid subscription ID",
							});
						}
						subscriptionIdNumber = pleskNum;
					}
				}
			}

			// Build XML request to fetch subscription from Plesk
			const buildSubscriptionGetByIdXml = (id: number): string => {
				return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        <id>${id}</id>
      </filter>
      <dataset>
        <gen_info/>
        <hosting/>
        <limits/>
        <prefs/>
        <stat/>
        <permissions/>
      </dataset>
    </get>
  </webspace>
</packet>`;
			};

			// Fetch Plesk subscription data
			const pleskDataResult = await Promise.allSettled([
				// Fetch from Plesk
				(async () => {
					if (!process.env.PLESK_XML_ENDPOINT) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
						});
					}

					const xmlRequest = buildSubscriptionGetByIdXml(subscriptionIdNumber);
					const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

					if (isHostUnreachable) {
						throw new TRPCError({
							code: "SERVICE_UNAVAILABLE",
							message: "Plesk host is unreachable",
						});
					}

					if (isAuthError) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: "Invalid Plesk credentials",
						});
					}

					if (!xml || xml.trim() === '') {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Empty response from Plesk server",
						});
					}

					const parser = new XMLParser({ ignoreAttributes: false });
					let parsed: any;

					try {
						parsed = parser.parse(xml);
					} catch (parseError) {
						console.error('Failed to parse XML response:', parseError);
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to parse Plesk response",
							cause: parseError,
						});
					}

					// Check for Plesk system errors
					if (parsed?.packet?.system?.status === 'error') {
						const errorCode = parsed.packet.system.errcode;
						const errorText = parsed.packet.system.errtext || 'Unknown error';
						
						if (errorCode === 1010) {
							throw new TRPCError({
								code: "TOO_MANY_REQUESTS",
								message: `Rate limit exceeded: ${errorText}. Please wait before making another request.`,
							});
						}
						
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Plesk API Error ${errorCode}: ${errorText}`,
						});
					}

					return {
						raw: xml,
						parsed,
					};
				})(),
			]).then(([result]) => result);

			// Handle Plesk data result
			if (pleskDataResult.status === 'rejected') {
				throw pleskDataResult.reason;
			}

			const pleskData = pleskDataResult.value;

			// Check if subscription exists in Plesk response
			const pleskResult = pleskData?.parsed?.packet?.webspace?.get?.result;
			if (!pleskResult) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Hosting subscription not found",
				});
			}

			// Extract pleskFilterId from Plesk response
			const pleskFilterId = String(pleskResult["filter-id"] || "");

			// If teamId is provided, verify ownership: id in URL must belong to this team (ServiceSubscription or NiscClientSubscription)
			if (input.teamId) {
				await ensureTeamReadAccess(input.teamId, session.user.id, role);
				const [hasAccessViaServiceSub, hasAccessViaNiscSub] = await Promise.all([
					// Legacy billing row and/or Plesk filter match for this team
					db
						.select({ id: serviceSubscription.id })
						.from(serviceSubscription)
						.innerJoin(
							niscServicePlan,
							eq(serviceSubscription.niscServicePlanId, niscServicePlan.id),
						)
						.innerJoin(
							hostingSubscription,
							eq(serviceSubscription.hostingSubscriptionId, hostingSubscription.id),
						)
						.where(
							and(
								eq(serviceSubscription.teamId, input.teamId),
								eq(niscServicePlan.planType, "HOSTING"),
								or(
									...(pleskFilterId ? [eq(hostingSubscription.pleskFilterId, pleskFilterId)] : []),
									eq(serviceSubscription.id, input.subscriptionId),
								),
							),
						)
						.limit(1)
						.then((r) => r[0] ?? null),
					// Customer: NiscClientSubscription for this team with this Plesk id (URL id or pleskFilterId from response)
					db
						.select({ id: niscClientSubscription.id })
						.from(niscClientSubscription)
						.where(
							and(
								eq(niscClientSubscription.teamId, input.teamId),
								or(
									eq(niscClientSubscription.id, input.subscriptionId),
									...(pleskFilterId
										? [eq(niscClientSubscription.pleskFilterId, pleskFilterId)]
										: []),
									eq(niscClientSubscription.pleskFilterId, input.subscriptionId),
									sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${input.subscriptionId}`,
								),
							),
						)
						.limit(1)
						.then((r) => r[0] ?? null),
				]);

				const hasAccess = !!hasAccessViaServiceSub || !!hasAccessViaNiscSub;

				if (!hasAccess) {
					// Log unauthorized access attempt (fire and forget to not affect performance)
					db.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user.id,
						action: "UNAUTHORIZED_RESOURCE_ACCESS",
						description: `Attempted to access hosting subscription ${input.subscriptionId} that does not belong to team ${input.teamId}`,
						metadata: {
							resourceType: "hosting_subscription",
							resourceId: input.subscriptionId,
							teamId: input.teamId,
							pleskFilterId: pleskFilterId,
						},
						ipAddress: null, // Headers not available in tRPC context
						userAgent: null, // Headers not available in tRPC context
						createdAt: new Date(),
					}).catch(() => {
						// Silently fail logging to not affect performance
					});

					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have access to this resource",
					});
				}
			}

			// Now fetch subscription link and service subscription if filter ID exists
			let subscriptionLink = null;
			let linkedServiceSubscription: z.infer<typeof serviceSubscriptionOutputSchema> | null =
				null;

			if (pleskFilterId && pleskFilterId !== "") {
				let hostingSub:
					| {
							id: string;
							teamId: string | null;
							hostingPlanId: string;
							primaryDomain: string | null;
							billingCycle: string;
							nextRenewalDate: Date | null;
							expiryDate: Date | null;
							notes: string | null;
							autoRenew: boolean;
							hostingType: string;
					  }
					| undefined;
				try {
					const rows = await db
						.select({
							id: hostingSubscription.id,
							teamId: hostingSubscription.teamId,
							hostingPlanId: hostingSubscription.hostingPlanId,
							primaryDomain: hostingSubscription.primaryDomain,
							billingCycle: hostingSubscription.billingCycle,
							nextRenewalDate: hostingSubscription.nextRenewalDate,
							expiryDate: hostingSubscription.expiryDate,
							notes: hostingSubscription.notes,
							autoRenew: hostingSubscription.autoRenew,
							hostingType: hostingSubscription.hostingType,
						})
						.from(hostingSubscription)
						.where(eq(hostingSubscription.pleskFilterId, pleskFilterId))
						.limit(1);
					hostingSub = rows[0];
				} catch {
					hostingSub = undefined;
				}

				if (hostingSub) {
					subscriptionLink = {
						id: hostingSub.id,
						teamId: hostingSub.teamId,
						hostingPlanId: hostingSub.hostingPlanId,
						primaryDomain: hostingSub.primaryDomain,
						billingCycle: hostingSub.billingCycle as any,
						nextRenewalDate: hostingSub.nextRenewalDate,
						expiryDate: hostingSub.expiryDate,
						notes: hostingSub.notes,
						autoRenew: hostingSub.autoRenew,
						hostingType: hostingSub.hostingType as any,
					};

					// Fetch ServiceSubscription linked to this HostingSubscription
					// Accept all hosting subtypes
					let serviceSub: {
						id: string;
						subscriptionDate: Date | null;
						billingCycle: string;
						nextRenewalDate: Date | null;
						status: string;
						autoRenew: boolean;
					} | null = null;
					try {
						const rows = await db
							.select({
								id: serviceSubscription.id,
								subscriptionDate: serviceSubscription.subscriptionDate,
								billingCycle: serviceSubscription.billingCycle,
								nextRenewalDate: serviceSubscription.nextRenewalDate,
								status: serviceSubscription.status,
								autoRenew: serviceSubscription.autoRenew,
							})
							.from(serviceSubscription)
							.innerJoin(
								niscServicePlan,
								eq(serviceSubscription.niscServicePlanId, niscServicePlan.id),
							)
							.where(
								and(
									eq(serviceSubscription.hostingSubscriptionId, hostingSub.id),
									eq(niscServicePlan.planType, "HOSTING"),
								),
							)
							.limit(1);
						serviceSub = rows[0] ?? null;
					} catch {
						serviceSub = null;
					}

					if (serviceSub) {
						linkedServiceSubscription = {
							id: serviceSub.id,
							subscriptionDate: serviceSub.subscriptionDate?.toISOString() ?? null,
							billingCycle: serviceSub.billingCycle as "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM",
							nextRenewalDate: serviceSub.nextRenewalDate?.toISOString() ?? null,
							status: serviceSub.status as "ACTIVE" | "PENDING" | "SUSPENDED" | "CANCELLED" | "EXPIRED" | "PROCESSING" | "FAILED",
							autoRenew: serviceSub.autoRenew,
						};
					}
				}
			}

			return {
				hosting: pleskData,
				subscription: subscriptionLink,
				serviceSubscription: linkedServiceSubscription,
			};
		}),

	// Get subscription by Plesk Filter ID
	getByPleskFilterId: protectedProcedure
		.input(getByPleskFilterIdInputSchema)
		.output(getByPleskFilterIdOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view subscriptions",
				});
			}
			const role = session.user.role;

			const subRows = await db
				.select({
					id: hostingSubscription.id,
					teamId: hostingSubscription.teamId,
					hostingPlanId: hostingSubscription.hostingPlanId,
					primaryDomain: hostingSubscription.primaryDomain,
					billingCycle: hostingSubscription.billingCycle,
					nextRenewalDate: hostingSubscription.nextRenewalDate,
					expiryDate: hostingSubscription.expiryDate,
					notes: hostingSubscription.notes,
					autoRenew: hostingSubscription.autoRenew,
					hostingType: hostingSubscription.hostingType,
				})
				.from(hostingSubscription)
				.where(eq(hostingSubscription.pleskFilterId, input.pleskFilterId))
				.limit(1);
			const subscription = subRows[0];

			if (!subscription) {
				return null;
			}
			if (subscription.teamId) {
				await ensureTeamReadAccess(subscription.teamId, session.user.id, role);
			} else if (!isAgencyUserRole(role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this resource",
				});
			}

			return {
				id: subscription.id,
				teamId: subscription.teamId,
				hostingPlanId: subscription.hostingPlanId,
				primaryDomain: subscription.primaryDomain,
				billingCycle: subscription.billingCycle as any,
				nextRenewalDate: subscription.nextRenewalDate,
				expiryDate: subscription.expiryDate,
				notes: subscription.notes,
				autoRenew: subscription.autoRenew,
				hostingType: subscription.hostingType as any,
			};
		}),

	// Check if domain has hosting in Plesk by domain name (domain portfolio "Connected services").
	// Returns a numeric Plesk webspace id for /hosting/:id - never use filter-id (can be the domain name).
	getHostingByDomainName: protectedProcedure
		.input(getHostingByDomainNameInputSchema)
		.output(getHostingByDomainNameOutputSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in",
				});
			}
			const role = ctx.session.user.role;
			const isAgency = isAgencyUserRole(role);
			if (!isAgency) {
				if (!input.teamId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "teamId is required to check hosting for this domain",
					});
				}
				await ensureTeamReadAccess(input.teamId, ctx.session.user.id, role);
			}
			if (!process.env.PLESK_XML_ENDPOINT) {
				return { hasHosting: false, subscriptionId: null };
			}
			const escapeXml = (s: string) =>
				s
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&apos;");
			const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        <name>${escapeXml(input.domainName)}</name>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </webspace>
</packet>`;
			try {
				const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
				if (isHostUnreachable || isAuthError || !xml?.trim()) {
					return { hasHosting: false, subscriptionId: null };
				}
				const parser = new XMLParser({ ignoreAttributes: false });
				const parsed = parser.parse(xml);
				const rawResult = parsed?.packet?.webspace?.get?.result;
				if (!rawResult) return { hasHosting: false, subscriptionId: null };
				const result = (Array.isArray(rawResult) ? rawResult[0] : rawResult) as Record<string, unknown>;
				const st = pleskXmlScalar(result.status);
				if (st?.toLowerCase() === "error") {
					return { hasHosting: false, subscriptionId: null };
				}
				let pleskNum = extractPleskWebspaceNumericId(result);
				if (!pleskNum && isPleskWebspaceResultPresent(result)) {
					pleskNum = await resolvePleskIdFromDbByPrimaryDomain(input.domainName.trim().toLowerCase());
				}
				if (!pleskNum) {
					return { hasHosting: false, subscriptionId: null };
				}
				if (!isAgency && input.teamId) {
					const linked = await teamHasLinkedHostingForPleskId(input.teamId, pleskNum);
					if (!linked) {
						return { hasHosting: false, subscriptionId: null };
					}
				}
				return { hasHosting: true, subscriptionId: String(pleskNum) };
			} catch {
				return { hasHosting: false, subscriptionId: null };
			}
		}),

	// Link an existing Plesk subscription to a team
	linkToTeam: protectedProcedure
		.input(linkToTeamInputSchema)
		.output(linkToTeamOutputSchema)
		.mutation(async ({ ctx, input }) => {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Direct team linking is disabled. Use subscription-based linking.",
			});

			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to link subscriptions",
				});
			}

			const userId = session.user.id;
			const userRole = session.user.role;

			// Verify team exists
			const teamRows = await db
				.select()
				.from(team)
				.where(eq(team.id, input.teamId))
				.limit(1);
			const teamRow = teamRows[0];

			if (!teamRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}
			await ensureTeamMutationAccess(teamRow.id, userId, userRole);

			// Check if subscription with this pleskFilterId already exists
			const existingRows = await db
				.select({ id: hostingSubscription.id })
				.from(hostingSubscription)
				.where(eq(hostingSubscription.pleskFilterId, input.pleskFilterId))
				.limit(1);
			const existingSubscription = existingRows[0];

			if (existingSubscription) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A subscription with this Plesk Filter ID already exists",
				});
			}

			// Get hosting plan - use provided one or find a default/active plan
			let hostingPlanId: string;

			if (input.hostingPlanId) {
				// Verify the provided plan exists and is active
				const planRows = await db
					.select()
					.from(hostingPlan)
					.where(eq(hostingPlan.id, input.hostingPlanId))
					.limit(1);
				const providedPlan = planRows[0];

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
			} else {
				// Try to find a default plan matching the hosting type
				const defaultPlanRows = await db
					.select()
					.from(hostingPlan)
					.where(
						and(
							eq(hostingPlan.isDefault, true),
							eq(hostingPlan.isActive, true),
							eq(hostingPlan.hostingType, input.hostingType || "WEB_HOSTING"),
						),
					)
					.limit(1);
				const defaultPlan = defaultPlanRows[0];

				if (!defaultPlan) {
					// If no default plan, get any active plan of the same type
					const anyPlanRows = await db
						.select()
						.from(hostingPlan)
						.where(
							and(
								eq(hostingPlan.isActive, true),
								eq(hostingPlan.hostingType, input.hostingType || "WEB_HOSTING"),
							),
						)
						.limit(1);
					const anyPlan = anyPlanRows[0];

					if (!anyPlan) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "No hosting plan found. Please select a hosting plan or create one first.",
						});
					}

					hostingPlanId = anyPlan.id;
				} else {
					hostingPlanId = defaultPlan.id;
				}
			}

			// Create the subscription record
			const insertedSub = await db
				.insert(hostingSubscription)
				.values({
					id: crypto.randomUUID(),
					hostingPlanId,
					teamId: input.teamId,
					provisionedBy: userId,
					pleskFilterId: input.pleskFilterId,
					hostingType: input.hostingType || "WEB_HOSTING",
					billingCycle: input.billingCycle || "MONTHLY",
					nextRenewalDate: input.nextRenewalDate ?? null,
					expiryDate: input.expiryDate ?? null,
					primaryDomain: input.primaryDomain ?? null,
					notes: input.notes ?? null,
					autoRenew: input.autoRenew,
					status: "ACTIVE", // Default status for linked subscriptions
					provisioningMethod: "MANUAL", // Since we're manually linking
					operation: "PROVISION",
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();
			const subscription = insertedSub[0];
			if (!subscription) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create hosting subscription",
				});
			}

			// Log activity
			await db.insert(hostingSubscriptionActivityLog).values({
				id: crypto.randomUUID(),
				hostingSubscriptionId: subscription.id,
				userId: userId,
				action: "LINK_TO_TEAM",
				description: `Linked subscription to team: ${teamRow.name}`,
				metadata: {
					teamId: teamRow.id,
					teamName: teamRow.name,
					pleskFilterId: input.pleskFilterId,
				},
				createdAt: new Date(),
			});

			return {
				success: true,
				id: subscription.id,
			};
		}),

	// Unlink subscription from team
	unlinkFromTeam: protectedProcedure
		.input(unlinkFromTeamInputSchema)
		.output(unlinkFromTeamOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to unlink subscriptions",
				});
			}

			const userId = session.user.id;
			const userRole = session.user.role;

			// Find the subscription (with team name for audit logs)
			const subscription = await db.query.hostingSubscription.findFirst({
				where: eq(hostingSubscription.id, input.subscriptionId),
				with: {
					team: true,
				},
			});

			if (!subscription) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Subscription not found",
				});
			}

			if (!subscription.teamId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Subscription is not linked to any team",
				});
			}
			await ensureTeamMutationAccess(subscription.teamId, userId, userRole);

		const teamName = subscription.team?.name ?? "Unknown Team";
		const now = new Date();

		// Log activity - UserActivityLog (before deletion)
		await db.insert(userActivityLog).values({
			id: crypto.randomUUID(),
			userId: userId,
			action: "HOSTING_SUBSCRIPTION_DELETION_STARTED",
			description: `Starting deletion of hosting subscription ${subscription.pleskName || subscription.id}`,
			metadata: {
				subscriptionId: subscription.id,
				teamId: subscription.teamId,
				teamName: teamName,
				pleskFilterId: subscription.pleskFilterId,
				pleskServiceId: subscription.pleskServiceId,
				status: subscription.status,
			},
			createdAt: now,
		});

		// Log activity - HostingSubscriptionActivityLog (before deletion so subscription ID exists)
		await db.insert(hostingSubscriptionActivityLog).values({
			id: crypto.randomUUID(),
			hostingSubscriptionId: subscription.id,
			userId: userId,
			action: "TERMINATE",
			description: `Subscription terminated and unlinked from team: ${teamName}. Subscription deleted.`,
			metadata: {
				previousTeamId: subscription.teamId,
				previousTeamName: teamName,
				pleskFilterId: subscription.pleskFilterId,
				pleskServiceId: subscription.pleskServiceId,
				pleskName: subscription.pleskName,
				status: subscription.status,
				deleted: true,
				reason: "unlink_from_team",
			},
			createdAt: now,
		});

		// Delete the subscription entirely so it can be linked to another team later
		await db.delete(hostingSubscription).where(eq(hostingSubscription.id, input.subscriptionId));

		// Log activity - UserActivityLog (after deletion)
		await db.insert(userActivityLog).values({
			id: crypto.randomUUID(),
			userId: userId,
			action: "HOSTING_SUBSCRIPTION_DELETED",
			description: `Hosting subscription ${subscription.pleskName || subscription.id} deleted successfully`,
			metadata: {
				subscriptionId: subscription.id,
				teamId: subscription.teamId,
				teamName: teamName,
				pleskFilterId: subscription.pleskFilterId,
				pleskServiceId: subscription.pleskServiceId,
				status: subscription.status,
				deletedBy: userId,
			},
			createdAt: now,
		});

		return {
			success: true,
		};
		}),

	// Update subscription
	updateSubscription: protectedProcedure
		.input(updateSubscriptionInputSchema)
		.output(updateSubscriptionOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update subscriptions",
				});
			}

			const userId = session.user.id;
			const userRole = session.user.role;

			// Find the subscription
			const existingRows = await db
				.select()
				.from(hostingSubscription)
				.where(eq(hostingSubscription.id, input.subscriptionId))
				.limit(1);
			const existingSubscription = existingRows[0];

			if (!existingSubscription) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Subscription not found",
				});
			}
			if (existingSubscription.teamId) {
				await ensureTeamMutationAccess(existingSubscription.teamId, userId, userRole);
			} else if (!isAgencySuperAdminRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency super admins can modify unlinked subscriptions",
				});
			}

			// Build update data - only include fields that are provided
			const updateData: any = {
				updatedAt: new Date(),
			};

			if (input.hostingPlanId !== undefined) {
				// Verify the plan exists and is active
				const planRows = await db
					.select()
					.from(hostingPlan)
					.where(eq(hostingPlan.id, input.hostingPlanId))
					.limit(1);
				const plan = planRows[0];

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

				updateData.hostingPlanId = input.hostingPlanId;
			}

			if (input.billingCycle !== undefined) {
				updateData.billingCycle = input.billingCycle;
			}

			if (input.nextRenewalDate !== undefined) {
				updateData.nextRenewalDate = input.nextRenewalDate;
			}

			if (input.expiryDate !== undefined) {
				updateData.expiryDate = input.expiryDate;
			}

			if (input.primaryDomain !== undefined) {
				updateData.primaryDomain = input.primaryDomain || null;
			}

			if (input.notes !== undefined) {
				updateData.notes = input.notes || null;
			}

			if (input.autoRenew !== undefined) {
				updateData.autoRenew = input.autoRenew;
			}

			// Build metadata for logging - capture before and after values
			const updatedFields = Object.keys(updateData).filter(key => key !== "updatedAt");
			const changesMetadata: Record<string, any> = {
				updatedFields,
			};

			// Capture old values for comparison
			updatedFields.forEach((field) => {
				changesMetadata[`old_${field}`] = (existingSubscription as any)[field];
				changesMetadata[`new_${field}`] = updateData[field];
			});

			// Update the subscription
			const updatedRows = await db
				.update(hostingSubscription)
				.set(updateData)
				.where(eq(hostingSubscription.id, input.subscriptionId))
				.returning();
			const updatedSubscription = updatedRows[0];
			if (!updatedSubscription) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update hosting subscription",
				});
			}

			// Log activity - UserActivityLog
			await db.insert(userActivityLog).values({
				id: crypto.randomUUID(),
				userId: userId,
				action: "HOSTING_SUBSCRIPTION_UPDATED",
				description: `Updated hosting subscription ${updatedSubscription.pleskName || updatedSubscription.id}`,
				metadata: {
					subscriptionId: updatedSubscription.id,
					teamId: updatedSubscription.teamId,
					updatedFields,
					changes: changesMetadata,
				},
				createdAt: new Date(),
			});

			// Log activity - HostingSubscriptionActivityLog (subscription-specific audit trail)
			await db.insert(hostingSubscriptionActivityLog).values({
				id: crypto.randomUUID(),
				hostingSubscriptionId: updatedSubscription.id,
				userId: userId,
				action: "UPDATE",
				description: `Subscription updated: ${updatedFields.join(", ")}`,
				metadata: {
					updatedFields,
					changes: changesMetadata,
					previousStatus: existingSubscription.status,
					newStatus: updatedSubscription.status,
				},
				createdAt: new Date(),
			});

			return {
				success: true,
				id: updatedSubscription.id,
			};
		}),
});

