import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or, type SQL } from "@npanel/db";
import * as crypto from "crypto";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { createOpenProviderClient } from "../lib/openprovider-client";
import { executeKenicTransferRequest } from "../lib/kenic-transfer-request";
import {
	getMemberTeamIds,
	isAgencyUserRole,
	userIsAgencyStaff,
} from "../lib/domain-transfer-access";
import { listOutgoingKenicTransfers } from "../lib/list-outgoing-kenic-transfers";
import {
	checkDomainTransferEligibility,
	type TransferStatus,
} from "../lib/domain-transfer-check";

export type { TransferStatus };

const checkTransferInputSchema = z.object({
	domain: z.string().min(1, "Domain is required"),
});

type TransferDirection = "incoming" | "outgoing";

type DomainTransferRequestListItem = {
	id: string;
	domainName: string;
	provider: string;
	status: string;
	direction: TransferDirection;
	providerPriceAmount: string | null;
	providerPriceCurrency: string | null;
	customerPriceAmount: string | null;
	customerPriceCurrency: string | null;
	submittedToProviderAt: Date | null;
	niscOrderId: string | null;
	niscOrderNumber: string | null;
	niscOrderStatus: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdBy: {
		id: string;
		name: string;
		email: string;
	} | null;
};

/** Statuses that may still change while the user watches the transfer requests list. */
export const ACTIVE_DOMAIN_TRANSFER_REQUEST_STATUSES = [
	"AWAITING_PAYMENT",
	"PENDING",
	"SUBMITTED_TO_PROVIDER",
] as const;

/** Terminal outcomes - transfer requests in these statuses cannot be deleted. */
export const NON_DELETABLE_DOMAIN_TRANSFER_REQUEST_STATUSES = [
	"COMPLETED",
	"FAILED",
] as const;

function isTransferRequestDeletable(status: string): boolean {
	return !(NON_DELETABLE_DOMAIN_TRANSFER_REQUEST_STATUSES as readonly string[]).includes(
		status,
	);
}

function toCheckoutTransferProvider(
	dbProvider: string,
): "kenic" | "openprovider" {
	return dbProvider === "KENIC" ? "kenic" : "openprovider";
}

function formatOpenProviderDomainName(domainField: unknown): string | null {
	if (typeof domainField === "string") {
		return domainField.trim().toLowerCase() || null;
	}
	if (domainField && typeof domainField === "object") {
		const domainObj = domainField as { name?: string; extension?: string };
		const name = domainObj.name?.trim();
		const ext = domainObj.extension?.trim();
		if (!name || !ext) return null;
		const normalizedExt = ext.startsWith(".") ? ext.slice(1) : ext;
		return `${name}.${normalizedExt}`.toLowerCase();
	}
	return null;
}

function hasOutgoingTransferRegistryStatus(registryStatuses: unknown): boolean {
	if (!registryStatuses || typeof registryStatuses !== "object") return false;
	const statuses = registryStatuses as Record<string, { value?: number | boolean | string }>;
	for (const [key, entry] of Object.entries(statuses)) {
		const normalizedKey = key.replace(/_/g, "").toLowerCase();
		if (normalizedKey !== "pendingtransfer") continue;
		const value = entry?.value;
		if (value === true || value === 1 || value === "1") return true;
	}
	return false;
}

async function listOutgoingOpenProviderTransfers(): Promise<DomainTransferRequestListItem[]> {
	if (!process.env.OPENPROVIDER_USERNAME || !process.env.OPENPROVIDER_PASSWORD) {
		return [];
	}

	try {
		const client = createOpenProviderClient();
		await client.authenticate({
			username: process.env.OPENPROVIDER_USERNAME,
			password: process.env.OPENPROVIDER_PASSWORD,
			ip: process.env.OPENPROVIDER_IP,
		});

		const response = await client.searchDomains({
			status: "ACT",
			limit: 100,
			offset: 0,
			with_registry_statuses: true,
		});

		if (response.code !== 0) return [];

		const outgoing: DomainTransferRequestListItem[] = [];

		for (const domain of response.data.results) {
			const registryStatuses = (domain as { registry_statuses?: unknown }).registry_statuses;
			if (!hasOutgoingTransferRegistryStatus(registryStatuses)) continue;

			const domainName = formatOpenProviderDomainName(
				(domain as { domain?: unknown }).domain,
			);
			if (!domainName) continue;

			const lastChangedRaw = (domain as { last_changed?: string }).last_changed;
			const lastChanged = lastChangedRaw ? new Date(lastChangedRaw) : new Date();
			const submittedAt = Number.isNaN(lastChanged.getTime()) ? new Date() : lastChanged;

			outgoing.push({
				id: `op-outgoing-${domain.id}`,
				domainName,
				provider: "OPENPROVIDER",
				status: "OUTGOING_PENDING",
				direction: "outgoing",
				providerPriceAmount: null,
				providerPriceCurrency: null,
				customerPriceAmount: null,
				customerPriceCurrency: null,
				submittedToProviderAt: submittedAt,
				niscOrderId: null,
				niscOrderNumber: null,
				niscOrderStatus: null,
				createdAt: submittedAt,
				updatedAt: submittedAt,
				createdBy: null,
			});
		}

		return outgoing;
	} catch (error) {
		console.error("[domainTransfer.listTransferRequests] outgoing OpenProvider fetch failed:", error);
		return [];
	}
}

function mapOutgoingKenicTransfers(
	rows: Awaited<ReturnType<typeof listOutgoingKenicTransfers>>,
): DomainTransferRequestListItem[] {
	return rows.map((row) => ({
		id: `kenic-outgoing-${row.domainName}`,
		domainName: row.domainName,
		provider: "KENIC",
		status: "OUTGOING_PENDING",
		direction: "outgoing" as const,
		providerPriceAmount: null,
		providerPriceCurrency: null,
		customerPriceAmount: null,
		customerPriceCurrency: null,
		submittedToProviderAt: row.submittedAt,
		niscOrderId: null,
		niscOrderNumber: null,
		niscOrderStatus: null,
		createdAt: row.submittedAt,
		updatedAt: row.submittedAt,
		createdBy: null,
	}));
}

export const domainTransferRouter = router({
	/**
	 * Check if a domain can be transferred and get the price.
	 * Identifies TLD first (same as domain search): KENIC for .ke/.co.ke/etc., OpenProvider for others.
	 * KENIC: EPP domain check only Ã¢â€ â€™ available or ready + price.
	 * OpenProvider: RDAP for status (available / locked / ready), then transfer pricing when ready.
	 */
	checkTransfer: publicProcedure
		.input(checkTransferInputSchema)
		.mutation(async ({ input }) => checkDomainTransferEligibility(input.domain)),

	/**
	 * Initiate domain transfer: save to DB (DomainTransferRequest) then send to provider (KENIC or OpenProvider).
	 * EPP/auth code is required. Caller must be authenticated.
	 */
	initiateTransfer: protectedProcedure
		.input(
			z.object({
				domain: z.string().min(1, "Domain is required"),
				authCode: z.string().min(1, "Authorization code (EPP code) is required"),
				provider: z.enum(["kenic", "openprovider"]),
				domainName: z.string().min(1),
				extension: z.string().min(1),
				providerPriceAmount: z.string().optional(),
				providerPriceCurrency: z.string().optional(),
				customerPriceAmount: z.string().optional(),
				customerPriceCurrency: z.string().optional(),
				teamId: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const userRole = ctx.session.user.role;
			const now = new Date();
			const id = crypto.randomUUID();
			if (input.teamId && !isAgencyUserRole(userRole)) {
				const [membership] = await db
					.select({ id: teamMember.id })
					.from(teamMember)
					.where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)))
					.limit(1);
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have access to this team.",
					});
				}
			}

			await db.insert(domainTransferRequest).values({
				id,
				domainName: input.domain,
				authCode: input.authCode,
				provider: input.provider === "kenic" ? "KENIC" : "OPENPROVIDER",
				status: "PENDING",
				providerPriceAmount: input.providerPriceAmount ?? null,
				providerPriceCurrency: input.providerPriceCurrency ?? null,
				customerPriceAmount: input.customerPriceAmount ?? null,
				customerPriceCurrency: input.customerPriceCurrency ?? null,
				teamId: input.teamId ?? null,
				createdById: userId,
				createdAt: now,
				updatedAt: now,
				niscOrderId: null,
				submittedToProviderAt: null,
				providerResponse: null,
			});

			try {
				if (input.provider === "kenic") {
					const result = await executeKenicTransferRequest({
						name: input.domain,
						authCode: input.authCode,
						period: 1,
					});
					await db
						.update(domainTransferRequest)
						.set({
							status: "SUBMITTED_TO_PROVIDER",
							submittedToProviderAt: new Date(),
							providerResponse: result as unknown as object,
							updatedAt: new Date(),
						})
						.where(eq(domainTransferRequest.id, id));
					return { success: true, id, pending: result.pending, domain: result.domain };
				}

				const client = createOpenProviderClient();
				await client.authenticate({
					username: process.env.OPENPROVIDER_USERNAME!,
					password: process.env.OPENPROVIDER_PASSWORD!,
					ip: process.env.OPENPROVIDER_IP,
				});
				const ext = input.extension.startsWith(".") ? input.extension.slice(1) : input.extension;
				const response = await client.transferDomain({
					domain: { name: input.domainName, extension: ext },
					auth_code: input.authCode,
					owner_handle: "default",
					admin_handle: "default",
					tech_handle: "default",
					autorenew: "default",
				});
				if (response.code !== 0) {
					await db
						.update(domainTransferRequest)
						.set({
							status: "FAILED",
							providerResponse: { code: response.code, desc: response.desc },
							updatedAt: new Date(),
						})
						.where(eq(domainTransferRequest.id, id));
					throw new TRPCError({ code: "BAD_REQUEST", message: response.desc ?? "Transfer failed" });
				}
				await db
					.update(domainTransferRequest)
					.set({
						status: "SUBMITTED_TO_PROVIDER",
						submittedToProviderAt: new Date(),
						providerResponse: { success: true, data: response.data },
						updatedAt: new Date(),
					})
					.where(eq(domainTransferRequest.id, id));
				return {
					success: true,
					id,
					domain: `${input.domainName}.${ext}`,
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				await db
					.update(domainTransferRequest)
					.set({
						status: "FAILED",
						providerResponse: { error: message },
						updatedAt: new Date(),
					})
					.where(eq(domainTransferRequest.id, id))
					.catch(() => {});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: message,
				});
			}
		}),

	/**
	 * Create a transfer request when the user proceeds to checkout (before payment).
	 * Updated to PENDING when payment succeeds and linked to the Nisc order; processor updates further.
	 */
	createCheckoutRequest: protectedProcedure
		.input(
			z.object({
				domain: z.string().min(1),
				authCode: z.string().min(1),
				provider: z.enum(["kenic", "openprovider"]),
				providerPriceAmount: z.string().optional(),
				providerPriceCurrency: z.string().optional(),
				customerPriceAmount: z.string().optional(),
				customerPriceCurrency: z.string().optional(),
				teamId: z.string().optional(),
				/** Agency only: transfer owner (customer) when starting checkout on their behalf. */
				createdForUserId: z.string().min(1).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const userRole = ctx.session.user.role;
			const createdFor = input.createdForUserId?.trim();
			if (createdFor) {
				if (!isAgencyUserRole(userRole) && !(await userIsAgencyStaff(userId))) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only agency users can create a transfer for another user.",
					});
				}
				const [target] = await db
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.id, createdFor))
					.limit(1);
				if (!target) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected user was not found.",
					});
				}
			}
			if (input.teamId && !isAgencyUserRole(userRole)) {
				const [membership] = await db
					.select({ id: teamMember.id })
					.from(teamMember)
					.where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)))
					.limit(1);
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have access to this team.",
					});
				}
			}

			const domainName = input.domain.trim().toLowerCase();
			const authCode = input.authCode.trim();
			const now = new Date();
			const id = crypto.randomUUID();

			await db.insert(domainTransferRequest).values({
				id,
				domainName,
				authCode,
				provider: input.provider === "kenic" ? "KENIC" : "OPENPROVIDER",
				status: "AWAITING_PAYMENT",
				providerPriceAmount: input.providerPriceAmount ?? null,
				providerPriceCurrency: input.providerPriceCurrency ?? null,
				customerPriceAmount: input.customerPriceAmount ?? null,
				customerPriceCurrency: input.customerPriceCurrency ?? null,
				teamId: input.teamId ?? null,
				createdById: createdFor ?? userId,
				createdAt: now,
				updatedAt: now,
				niscOrderId: null,
				submittedToProviderAt: null,
				providerResponse: null,
			});

			return { id, domainName, status: "AWAITING_PAYMENT" as const };
		}),

	/**
	 * Resume checkout for a transfer request awaiting payment (returns EPP code for buy-now only).
	 */
	getCheckoutResumeContext: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.select({
					id: domainTransferRequest.id,
					domainName: domainTransferRequest.domainName,
					authCode: domainTransferRequest.authCode,
					provider: domainTransferRequest.provider,
					status: domainTransferRequest.status,
					customerPriceAmount: domainTransferRequest.customerPriceAmount,
					customerPriceCurrency: domainTransferRequest.customerPriceCurrency,
					teamId: domainTransferRequest.teamId,
					niscOrderId: domainTransferRequest.niscOrderId,
				})
				.from(domainTransferRequest)
				.where(eq(domainTransferRequest.id, input.id))
				.limit(1);

			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transfer request not found.",
				});
			}

			if (row.status !== "AWAITING_PAYMENT") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This transfer request is not awaiting payment.",
				});
			}

			if (row.niscOrderId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This transfer request is already linked to an order.",
				});
			}

			const price = row.customerPriceAmount
				? Number.parseFloat(row.customerPriceAmount)
				: Number.NaN;
			if (Number.isNaN(price) || price <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Transfer price is missing or invalid.",
				});
			}

			return {
				id: row.id,
				domainName: row.domainName,
				authCode: row.authCode,
				provider: toCheckoutTransferProvider(row.provider),
				price,
				currency: row.customerPriceCurrency ?? "KES",
				teamId: row.teamId,
			};
		}),

	/**
	 * Delete a transfer request (agency only). Not allowed for completed or failed requests.
	 */
	deleteTransferRequest: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userRole = ctx.session.user.role;

			if (!isAgencyUserRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can delete transfer requests.",
				});
			}

			const [row] = await db
				.select({
					id: domainTransferRequest.id,
					status: domainTransferRequest.status,
					createdById: domainTransferRequest.createdById,
					teamId: domainTransferRequest.teamId,
				})
				.from(domainTransferRequest)
				.where(eq(domainTransferRequest.id, input.id))
				.limit(1);

			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transfer request not found.",
				});
			}

			if (!isTransferRequestDeletable(row.status)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Completed or failed transfer requests cannot be deleted.",
				});
			}

			await db
				.delete(domainTransferRequest)
				.where(eq(domainTransferRequest.id, input.id));

			return { success: true as const };
		}),

	/**
	 * List domain transfer requests for the agency (all requests; auth required).
	 * Does not return authCode for security.
	 */
	listTransferRequests: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const userRole = ctx.session.user.role;
		let whereClause: SQL | undefined;
		if (!isAgencyUserRole(userRole)) {
			const memberTeamIds = await getMemberTeamIds(userId);
			const scopes: SQL[] = [eq(domainTransferRequest.createdById, userId)];
			if (memberTeamIds.length > 0) {
				scopes.push(inArray(domainTransferRequest.teamId, memberTeamIds));
			}
			whereClause = scopes.length === 1 ? scopes[0] : or(...scopes);
		}

		const rows = await db
			.select({
				id: domainTransferRequest.id,
				domainName: domainTransferRequest.domainName,
				provider: domainTransferRequest.provider,
				status: domainTransferRequest.status,
				providerPriceAmount: domainTransferRequest.providerPriceAmount,
				providerPriceCurrency: domainTransferRequest.providerPriceCurrency,
				customerPriceAmount: domainTransferRequest.customerPriceAmount,
				customerPriceCurrency: domainTransferRequest.customerPriceCurrency,
				submittedToProviderAt: domainTransferRequest.submittedToProviderAt,
				niscOrderId: domainTransferRequest.niscOrderId,
				niscOrderNumber: niscOrder.orderNumber,
				niscOrderStatus: niscOrder.status,
				createdAt: domainTransferRequest.createdAt,
				updatedAt: domainTransferRequest.updatedAt,
				createdBy: {
					id: userTable.id,
					name: userTable.name,
					email: userTable.email,
				},
			})
			.from(domainTransferRequest)
			.innerJoin(userTable, eq(domainTransferRequest.createdById, userTable.id))
			.leftJoin(niscOrder, eq(domainTransferRequest.niscOrderId, niscOrder.id))
			.where(whereClause ?? undefined)
			.orderBy(desc(domainTransferRequest.createdAt));

		const incoming = rows.map(
			(r) =>
				({
					...r,
					direction: "incoming" as const,
					createdBy: r.createdBy,
				}) as DomainTransferRequestListItem,
		);

		if (!isAgencyUserRole(userRole)) {
			return incoming;
		}

		const [openProviderOutgoing, kenicOutgoingRows] = await Promise.all([
			listOutgoingOpenProviderTransfers(),
			listOutgoingKenicTransfers(),
		]);
		const outgoing = [
			...openProviderOutgoing,
			...mapOutgoingKenicTransfers(kenicOutgoingRows),
		];
		const incomingDomainNames = new Set(incoming.map((row) => row.domainName.toLowerCase()));
		const dedupedOutgoing = outgoing.filter(
			(row) => !incomingDomainNames.has(row.domainName.toLowerCase()),
		);

		return [...incoming, ...dedupedOutgoing].sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);
	}),
});
