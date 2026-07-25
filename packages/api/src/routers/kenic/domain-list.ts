import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNotNull, isNull, like } from "@npanel/db";
import { db } from "@npanel/db";
import { protectedProcedure, router } from "../../trpc";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { user as userTable } from "@npanel/db/schema/auth";
import { team as teamTable } from "@npanel/db/schema/teams";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildDomainInfoXml, buildContactInfoXml, buildDomainUpdateXml, buildHostCheckXml, buildHostCreateXml } from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import {
	isKenicServerTransferLocked,
	isKenicTransferLocked,
	mapKenicEppStatusesToPortfolioStatus,
} from "../../lib/epp/kenic-domain-status";
import {
	isCoccaAuthInfoHash,
	setKenicDomainAuthCode,
} from "../../lib/kenic-nisc";
import { domainProductSqlFilter } from "../../lib/nisc-domain-product";

const parser = new XMLParser({ ignoreAttributes: false });

/** Extract EPP result code, message, etc. */
function getEppResult(parsed: any) {
	const response = parsed?.epp?.response;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	const code = String(res?.["@_code"] ?? "0");
	const msg = typeof res?.msg === "string" ? res.msg : String(res?.msg?.["#text"] ?? "");
	return { code, msg };
}

function normalizeDomainName(domain: string): string {
	return domain.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * KENIC Domain List router.
 */
export const kenicDomainListRouter = router({
	/**
	 * List all KENIC domains registered through this agency.
	 * One row per unique primaryDomain (latest non-superseded subscription).
	 */
	list: protectedProcedure
		.input(z.object({}).optional().default({}))
		.query(async () => {
			try {
				const rows = await db
					.select({
						id: niscClientSubscription.id,
						primaryDomain: niscClientSubscription.primaryDomain,
						status: niscClientSubscription.status,
						expiryDate: niscClientSubscription.expiryDate,
						subscriptionDate: niscClientSubscription.subscriptionDate,
						billingCycle: niscClientSubscription.billingCycle,
						userId: niscClientSubscription.userId,
						teamId: niscClientSubscription.teamId,
						userName: userTable.name,
						userEmail: userTable.email,
						teamName: teamTable.name,
					})
					.from(niscClientSubscription)
					.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
					.leftJoin(userTable, eq(niscClientSubscription.userId, userTable.id))
					.leftJoin(teamTable, eq(niscClientSubscription.teamId, teamTable.id))
					.where(
						and(
							isNotNull(niscClientSubscription.primaryDomain),
							like(niscClientSubscription.primaryDomain, "%.ke"),
							domainProductSqlFilter(),
							// Exclude superseded upgrade/downgrade chain rows
							isNull(niscClientSubscription.upgradedToSubscriptionId),
							isNull(niscClientSubscription.downgradedToSubscriptionId),
						),
					)
					.orderBy(desc(niscClientSubscription.subscriptionDate));

				const now = new Date();

				// Deduplicate by domain name  keep the newest subscription row.
				const byDomain = new Map<string, (typeof rows)[number]>();
				for (const row of rows) {
					const key = normalizeDomainName(row.primaryDomain ?? "");
					if (!key || byDomain.has(key)) continue;
					byDomain.set(key, row);
				}

				const mapped = Array.from(byDomain.values()).map((row) => {
					const domain = row.primaryDomain ?? "";
					const dotParts = domain.split(".");
					const tld =
						dotParts.length >= 3
							? `.${dotParts.slice(-2).join(".")}`
							: `.${dotParts[dotParts.length - 1] ?? "ke"}`;

					const statusMap: Record<string, any> = {
						ACTIVE: "ACTIVE",
						SUSPENDED: "SUSPENDED",
						CANCELLED: "EXPIRED",
						PENDING: "PENDING",
						PROCESSING: "PENDING",
					};

					const expiryDate = row.expiryDate ?? new Date((row.subscriptionDate ?? now).getTime() + 365 * 24 * 60 * 60 * 1000);
					const isExpired = expiryDate < now;
					const mappedStatus = isExpired ? "EXPIRED" : (statusMap[row.status] ?? "ACTIVE");

					return {
						id: `kenic-${row.id}`,
						domain,
						status: mappedStatus,
						registrationDate: (row.subscriptionDate ?? now).toISOString(),
						expiryDate: expiryDate.toISOString(),
						clientName: row.teamName ?? row.userName ?? "",
						clientEmail: row.userEmail ?? "",
						tld,
						autoRenewal: false,
						nameservers: [] as string[],
						source: "kenic" as const,
						teamId: row.teamId ?? null,
						userId: row.userId ?? null,
						teamName: row.teamName ?? null,
					};
				});

				return { success: true, data: mapped };
			} catch (error) {
				console.error("[KENIC] domain list error:", error);
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list KENIC domains" });
			}
		}),

	/**
	 * Get live info for a KENIC domain from the registry via EPP.
	 */
	info: protectedProcedure
		.input(z.object({ domain: z.string().min(1) }))
		.query(async ({ input }) => {
			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);
				await readFrame(socket); // Greeting

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginResXml = (await readFrame(socket)).toString("utf8");
				const loginResult = getEppResult(parser.parse(loginResXml));
				if (loginResult.code !== "1000") throw new Error(`Login failed: ${loginResult.msg}`);

				// 1. Fetch Domain Info
				sendFrame(socket, buildDomainInfoXml(input.domain));
				const infoResXml = (await readFrame(socket)).toString("utf8");
				const parsed = parser.parse(infoResXml);
				const infoResult = getEppResult(parsed);

				if (infoResult.code !== "1000") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Domain info failed: ${infoResult.msg}`,
					});
				}

				const infoData = parsed?.epp?.response?.resData?.["domain:infData"];
				const registrantHandle = infoData?.["domain:registrant"];

				// 2. Fetch Registrant Info (Live contact data)
				let registrantInfo = null;
				if (registrantHandle) {
					sendFrame(socket, buildContactInfoXml(registrantHandle));
					const contactResXml = (await readFrame(socket)).toString("utf8");
					const contactParsed = parser.parse(contactResXml);
					const contactResult = getEppResult(contactParsed);
					
					if (contactResult.code === "1000") {
						const cData = contactParsed?.epp?.response?.resData?.["contact:infData"];
						const postal = cData?.["contact:postalInfo"];
						const postalInfo = Array.isArray(postal) ? postal[0] : postal;
						
						registrantInfo = {
							handle: cData?.["contact:id"],
							roid: cData?.["contact:roid"],
							name: postalInfo?.["contact:name"],
							organization: postalInfo?.["contact:org"],
							address: {
								street: postalInfo?.["contact:addr"]?.["contact:street"],
								city: postalInfo?.["contact:addr"]?.["contact:city"],
								state: postalInfo?.["contact:addr"]?.["contact:sp"],
								postcode: postalInfo?.["contact:addr"]?.["contact:pc"],
								country: postalInfo?.["contact:addr"]?.["contact:cc"],
							},
							voice: cData?.["contact:voice"],
							fax: cData?.["contact:fax"],
							email: cData?.["contact:email"],
							clID: cData?.["contact:clID"],
							crID: cData?.["contact:crID"],
							crDate: cData?.["contact:crDate"],
							upDate: cData?.["contact:upDate"],
							status: cData?.["contact:status"],
						};
					}
				}
				
				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				// 3. Extract other details
				const nsList = infoData?.["domain:ns"]?.["domain:hostObj"];
				const nameservers = Array.isArray(nsList) ? nsList : nsList ? [nsList] : [];
				
				const statusNode = infoData?.["domain:status"];
				const statuses = Array.isArray(statusNode) 
					? statusNode.map((s: any) => ({ status: s["@_s"], label: s["#text"] })) 
					: statusNode ? [{ status: statusNode["@_s"], label: statusNode["#text"] }] : [];

				const contactNode = infoData?.["domain:contact"];
				const contacts = Array.isArray(contactNode)
					? contactNode.map((c: any) => ({ type: c["@_type"], handle: c["#text"] }))
					: contactNode ? [{ type: contactNode["@_type"], handle: contactNode["#text"] }] : [];

				const rgpNode = parsed?.epp?.response?.extension?.["rgp:infData"]?.["rgp:rgpStatus"];
				const rgpStatuses = Array.isArray(rgpNode)
					? rgpNode.map((r: any) => r["@_s"])
					: rgpNode ? [rgpNode["@_s"]] : [];

				const exDate = infoData?.["domain:exDate"] as string | undefined;

				return {
					success: true,
					data: {
						domain: infoData?.["domain:name"],
						roid: infoData?.["domain:roid"],
						status: mapKenicEppStatusesToPortfolioStatus(statuses, exDate),
						isTransferLocked: isKenicTransferLocked(statuses),
						isServerTransferLocked: isKenicServerTransferLocked(statuses),
						allStatuses: statuses,
						registrant: registrantHandle,
						registrantInfo, // Full live contact details
						contacts,
						nameservers,
						clID: infoData?.["domain:clID"],
						crID: infoData?.["domain:crID"],
						crDate: infoData?.["domain:crDate"],
						exDate,
						upID: infoData?.["domain:upID"],
						upDate: infoData?.["domain:upDate"],
						trDate: infoData?.["domain:trDate"],
						rgpStatuses,
						// CoCCA returns a one-way hash here  never expose it as the transfer code.
						authInfoSet: Boolean(
							(() => {
								const pw = infoData?.["domain:authInfo"]?.["domain:pw"];
								if (pw == null) return false;
								if (typeof pw === "string") return pw.length > 0;
								if (typeof pw === "object" && "#text" in pw) {
									return String((pw as { "#text": string })["#text"] ?? "").length > 0;
								}
								return true;
							})(),
						),
						raw: infoResXml,
						parsed: infoData,
					},
				};
			} catch (error) {
				console.error("[KENIC] domain info error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to fetch KENIC domain info",
				});
			} finally {
				socket?.destroy();
			}
		}),

	/**
	 * Update KENIC domain nameservers.
	 */
	updateNameservers: protectedProcedure
		.input(z.object({
			domain: z.string().min(1),
			nameservers: z.array(z.string().min(1)).min(1),
		}))
		.mutation(async ({ input }) => {
			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);
				await readFrame(socket);

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginResXml = (await readFrame(socket)).toString("utf8");
				const loginResult = getEppResult(parser.parse(loginResXml));
				if (loginResult.code !== "1000") throw new Error(`Login failed: ${loginResult.msg}`);

				// 1. Ensure all new nameservers exist as host objects
				for (const ns of input.nameservers) {
					sendFrame(socket, buildHostCheckXml([ns]));
					const checkResXml = (await readFrame(socket)).toString("utf8");
					const checkParsed = parser.parse(checkResXml);
					const checkResult = getEppResult(checkParsed);
					
					if (checkResult.code === "1000") {
						const hostCd = checkParsed?.epp?.response?.resData?.["host:chkData"]?.["host:cd"];
						const exists = hostCd?.["host:name"]?.["@_avail"] === "0" || hostCd?.["host:name"]?.["@_avail"] === "false";
						
						if (!exists) {
							// Host doesn't exist, create it
							sendFrame(socket, buildHostCreateXml(ns));
							const createResXml = (await readFrame(socket)).toString("utf8");
							const createResult = getEppResult(parser.parse(createResXml));
							if (createResult.code !== "1000") {
								console.warn(`[KENIC] Could not create host object for ${ns}: ${createResult.msg}`);
							}
						}
					}
				}

				// 2. Get current nameservers to know what to remove
				sendFrame(socket, buildDomainInfoXml(input.domain));
				const infoResXml = (await readFrame(socket)).toString("utf8");
				const parsed = parser.parse(infoResXml);
				const infoData = parsed?.epp?.response?.resData?.["domain:infData"];
				const currentNsRaw = infoData?.["domain:ns"]?.["domain:hostObj"];
				const currentNs = Array.isArray(currentNsRaw) ? currentNsRaw : currentNsRaw ? [currentNsRaw] : [];

				// 3. Calculate diff
				const toAdd = input.nameservers.filter(ns => !currentNs.includes(ns));
				const toRem = currentNs.filter(ns => !input.nameservers.includes(ns));

				if (toAdd.length === 0 && toRem.length === 0) {
					return { success: true, message: "No changes needed" };
				}

				// 4. Send update
				sendFrame(socket, buildDomainUpdateXml({
					domain: input.domain,
					addNs: toAdd,
					remNs: toRem,
				}));
				const updateResXml = (await readFrame(socket)).toString("utf8");
				const updateResult = getEppResult(parser.parse(updateResXml));

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				if (updateResult.code !== "1000" && updateResult.code !== "1001") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Update failed: ${updateResult.msg}`,
					});
				}

				return { success: true, message: "Nameservers updated successfully" };
			} catch (error) {
				console.error("[KENIC] update nameservers error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to update nameservers",
				});
			} finally {
				socket?.destroy();
			}
		}),

	/**
	 * Set or remove KENIC domain transfer lock (clientTransferProhibited).
	 */
	setTransferLock: protectedProcedure
		.input(z.object({
			domain: z.string().min(1),
			locked: z.boolean(),
		}))
		.mutation(async ({ input }) => {
			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);
				await readFrame(socket);

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginResXml = (await readFrame(socket)).toString("utf8");
				const loginResult = getEppResult(parser.parse(loginResXml));
				if (loginResult.code !== "1000") throw new Error(`Login failed: ${loginResult.msg}`);

				sendFrame(socket, buildDomainUpdateXml({
					domain: input.domain,
					...(input.locked
						? { addStatus: ["clientTransferProhibited"] }
						: { remStatus: ["clientTransferProhibited"] }),
				}));
				const updateResXml = (await readFrame(socket)).toString("utf8");
				const updateResult = getEppResult(parser.parse(updateResXml));

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				if (updateResult.code !== "1000" && updateResult.code !== "1001") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Transfer lock update failed: ${updateResult.msg}`,
					});
				}

				return {
					success: true,
					message: input.locked
						? "Domain locked for transfer"
						: "Domain unlocked for transfer",
				};
			} catch (error) {
				console.error("[KENIC] set transfer lock error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to update transfer lock",
				});
			} finally {
				socket?.destroy();
			}
		}),

	/**
	 * Read the stored plaintext KENIC auth code (never from domain:info  CoCCA returns a hash).
	 */
	getAuthCode: protectedProcedure
		.input(z.object({ domain: z.string().min(1) }))
		.query(async ({ input }) => {
			const domain = input.domain.trim();
			const rows = await db
				.select({
					id: niscClientSubscription.id,
					domainAuthCode: niscClientSubscription.domainAuthCode,
				})
				.from(niscClientSubscription)
				.where(
					and(
						ilike(niscClientSubscription.primaryDomain, domain),
						isNull(niscClientSubscription.upgradedToSubscriptionId),
						isNull(niscClientSubscription.downgradedToSubscriptionId),
					),
				)
				.orderBy(desc(niscClientSubscription.subscriptionDate))
				.limit(1);

			const row = rows[0];
			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No KENIC subscription found for this domain",
				});
			}

			const stored = row.domainAuthCode?.trim() || null;
			if (!stored || isCoccaAuthInfoHash(stored)) {
				return {
					success: true,
					data: {
						auth_code: null as string | null,
						needsRegenerate: true as const,
						message:
							"Authorization code is not available from the registry. Regenerate to set a new code.",
					},
				};
			}

			return {
				success: true,
				data: {
					auth_code: stored,
					needsRegenerate: false as const,
					message: null as string | null,
				},
			};
		}),

	/**
	 * Generate a new plaintext auth code, push to KENIC, and store locally.
	 */
	regenerateAuthCode: protectedProcedure
		.input(z.object({ domain: z.string().min(1) }))
		.mutation(async ({ input }) => {
			try {
				const domain = input.domain.trim();
				const authCode = await setKenicDomainAuthCode(domain);

				await db
					.update(niscClientSubscription)
					.set({ domainAuthCode: authCode, updatedAt: new Date() })
					.where(
						and(
							ilike(niscClientSubscription.primaryDomain, domain),
							isNull(niscClientSubscription.upgradedToSubscriptionId),
							isNull(niscClientSubscription.downgradedToSubscriptionId),
						),
					);

				return {
					success: true,
					data: { auth_code: authCode },
					message: "Authorization code regenerated successfully",
				};
			} catch (error) {
				console.error("[KENIC] regenerate auth code error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to regenerate authorization code",
				});
			}
		}),

	/**
	 * Update KENIC domain authorization (EPP) code and persist plaintext locally.
	 */
	updateAuthCode: protectedProcedure
		.input(z.object({
			domain: z.string().min(1),
			authCode: z.string().min(1).max(128),
		}))
		.mutation(async ({ input }) => {
			try {
				const domain = input.domain.trim();
				const trimmed = input.authCode.trim();
				if (isCoccaAuthInfoHash(trimmed)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "That value looks like a registry hash, not a transfer code. Enter or regenerate a new code.",
					});
				}

				const authCode = await setKenicDomainAuthCode(domain, trimmed);

				await db
					.update(niscClientSubscription)
					.set({ domainAuthCode: authCode, updatedAt: new Date() })
					.where(
						and(
							ilike(niscClientSubscription.primaryDomain, domain),
							isNull(niscClientSubscription.upgradedToSubscriptionId),
							isNull(niscClientSubscription.downgradedToSubscriptionId),
						),
					);

				return {
					success: true,
					message: "Authorization code updated successfully",
					data: { auth_code: authCode },
				};
			} catch (error) {
				console.error("[KENIC] update auth code error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to update authorization code",
				});
			}
		}),
});



