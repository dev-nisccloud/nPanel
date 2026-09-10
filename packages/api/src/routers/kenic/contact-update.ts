import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNotNull, isNull, like } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { protectedProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
	buildDomainInfoXml,
	buildContactCreateXml,
	buildContactInfoXml,
	buildContactUpdateXml,
	buildDomainUpdateXml,
	type ContactCreatePostalInfo,
	type DomainContactType,
} from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import { toAlpha2Country, toE164Phone } from "../../lib/domain-contact-edit";
import { assertAgencySuperAdmin } from "../../lib/domain-transfer-access";
import { domainProductSqlFilter } from "../../lib/nisc-domain-product";

const parser = new XMLParser({ ignoreAttributes: false });

function getEppResult(parsed: Record<string, unknown>): { code: string; msg: string } {
	const response = (parsed?.epp as Record<string, unknown> | undefined)?.response as
		| Record<string, unknown>
		| undefined;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	if (!res || typeof res !== "object") {
		return { code: "0", msg: "Unknown response structure" };
	}
	const r = res as Record<string, unknown>;
	const code = String((r["@_code"] as string) ?? "0");
	const msgNode = r.msg;
	const msg =
		typeof msgNode === "string"
			? msgNode
			: Array.isArray(msgNode)
				? String(msgNode[0] ?? "")
				: typeof msgNode === "object" && msgNode !== null && "#text" in msgNode
					? String((msgNode as { "#text": string })["#text"])
					: "";
	return { code, msg };
}

function isSuccess(code: string): boolean {
	return code === "1000" || code === "1001";
}

function newKenicContactId(): string {
	return `nupd${Date.now().toString(36)}`.slice(0, 16);
}

function statusList(node: unknown): string[] {
	const arr = Array.isArray(node) ? node : node ? [node] : [];
	return arr
		.map((s) => {
			if (typeof s === "string") return s;
			if (s && typeof s === "object" && "@_s" in s) return String((s as { "@_s": string })["@_s"]);
			return "";
		})
		.filter(Boolean);
}

function isUpdateProhibited(statuses: string[]): boolean {
	return statuses.includes("clientUpdateProhibited") || statuses.includes("serverUpdateProhibited");
}

function streetLine(street: string | string[]): string {
	return (Array.isArray(street) ? street.filter(Boolean).join(" ") : street).trim();
}

function normalizeDomainName(domain: string): string {
	return domain.trim().toLowerCase().replace(/\.$/, "");
}

async function assertKenicDomainInAgencyLedger(domain: string): Promise<string> {
	const normalized = normalizeDomainName(domain);
	const rows = await db
		.select({ primaryDomain: niscClientSubscription.primaryDomain })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.where(
			and(
				ilike(niscClientSubscription.primaryDomain, normalized),
				isNotNull(niscClientSubscription.primaryDomain),
				like(niscClientSubscription.primaryDomain, "%.ke"),
				domainProductSqlFilter(),
				isNull(niscClientSubscription.upgradedToSubscriptionId),
				isNull(niscClientSubscription.downgradedToSubscriptionId),
			),
		)
		.orderBy(desc(niscClientSubscription.subscriptionDate))
		.limit(1);

	if (!rows[0]?.primaryDomain) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "No KENIC subscription found for this domain",
		});
	}

	return normalizeDomainName(rows[0].primaryDomain);
}

const contactFieldsSchema = z.object({
	name: z.string().min(1, "Name is required"),
	org: z.string().optional(),
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	sp: z.string().optional(),
	pc: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	voice: z.string().min(1, "Phone is required"),
	fax: z.string().optional(),
	email: z.string().email(),
});

/**
 * Agency super admin: update the live KENIC registrant, or replace them with a new contact.
 */
export const kenicContactUpdateRouter = router({
	update: protectedProcedure
		.input(
			z.object({
				domain: z.string().min(1),
				intent: z.enum(["update", "replace"]),
				contact: contactFieldsSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertAgencySuperAdmin(ctx.session.user.id);
			const domainName = await assertKenicDomainInAgencyLedger(input.domain);

			const cc = toAlpha2Country(input.contact.country);
			const voice = toE164Phone(input.contact.voice, cc);
			const fax = input.contact.fax?.trim() ? toE164Phone(input.contact.fax, cc) : "";
			const postalInfo: ContactCreatePostalInfo = {
				name: input.contact.name.trim(),
				org: input.contact.org?.trim() || undefined,
				street: streetLine(input.contact.street),
				city: input.contact.city.trim(),
				sp: input.contact.sp?.trim() || undefined,
				pc: input.contact.pc.trim(),
				cc,
			};

			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);
				await readFrame(socket);

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginParsed = parser.parse((await readFrame(socket)).toString("utf8")) as Record<
					string,
					unknown
				>;
				const loginResult = getEppResult(loginParsed);
				if (loginResult.code !== "1000") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `EPP login failed: ${loginResult.msg}`,
					});
				}

				sendFrame(socket, buildDomainInfoXml(domainName));
				const infoParsed = parser.parse((await readFrame(socket)).toString("utf8")) as Record<
					string,
					unknown
				>;
				const infoResult = getEppResult(infoParsed);
				if (infoResult.code !== "1000") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Domain info failed: ${infoResult.msg}`,
					});
				}

				const infoData = (infoParsed?.epp as Record<string, unknown> | undefined)?.response as
					| Record<string, unknown>
					| undefined;
				const infData = (infoData?.resData as Record<string, unknown> | undefined)?.[
					"domain:infData"
				] as Record<string, unknown> | undefined;
				const registryName = normalizeDomainName(String(infData?.["domain:name"] ?? ""));
				if (registryName && registryName !== domainName) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Domain does not match the registry record.",
					});
				}

				const registrantHandle = String(infData?.["domain:registrant"] ?? "");
				const domainStatuses = statusList(infData?.["domain:status"]);

				if (isUpdateProhibited(domainStatuses)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This domain is locked against updates at the registry.",
					});
				}

				const contactNode = infData?.["domain:contact"];
				const domainContacts: Array<{ type: string; handle: string }> = Array.isArray(contactNode)
					? contactNode.map((c: Record<string, unknown>) => ({
							type: String(c["@_type"] ?? ""),
							handle: String(c["#text"] ?? ""),
						}))
					: contactNode
						? [
								{
									type: String((contactNode as Record<string, unknown>)["@_type"] ?? ""),
									handle: String((contactNode as Record<string, unknown>)["#text"] ?? ""),
								},
							]
						: [];

				if (input.intent === "update") {
					if (!registrantHandle) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "No registrant contact is attached to this domain.",
						});
					}

					sendFrame(socket, buildContactInfoXml(registrantHandle));
					const contactInfoParsed = parser.parse((await readFrame(socket)).toString("utf8")) as Record<
						string,
						unknown
					>;
					const contactInfoResult = getEppResult(contactInfoParsed);
					if (!isSuccess(contactInfoResult.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: contactInfoResult.msg || "Could not load the registrant contact.",
						});
					}
					const contactResData = (contactInfoParsed?.epp as Record<string, unknown> | undefined)
						?.response as Record<string, unknown> | undefined;
					const contactInf = (contactResData?.resData as Record<string, unknown> | undefined)?.[
						"contact:infData"
					] as Record<string, unknown> | undefined;
					if (isUpdateProhibited(statusList(contactInf?.["contact:status"]))) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "This contact is locked against updates at the registry.",
						});
					}

					sendFrame(
						socket,
						buildContactUpdateXml({
							id: registrantHandle,
							postalInfo,
							voice,
							fax: fax || null,
							email: input.contact.email.trim(),
						}),
					);
					const updateResult = getEppResult(
						parser.parse((await readFrame(socket)).toString("utf8")) as Record<string, unknown>,
					);

					sendFrame(socket, buildLogoutXml());
					await readFrame(socket);

					if (!isSuccess(updateResult.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: updateResult.msg || "Contact update failed",
						});
					}

					return { success: true, method: "update" as const, contactId: registrantHandle };
				}

				const newId = newKenicContactId();
				sendFrame(
					socket,
					buildContactCreateXml({
						id: newId,
						postalInfo,
						voice,
						email: input.contact.email.trim(),
						...(fax ? { fax } : {}),
					}),
				);
				const createResult = getEppResult(
					parser.parse((await readFrame(socket)).toString("utf8")) as Record<string, unknown>,
				);
				if (!isSuccess(createResult.code)) {
					sendFrame(socket, buildLogoutXml());
					await readFrame(socket);
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: createResult.msg || "Could not create the new contact",
					});
				}

				const swapTypes: DomainContactType[] = ["admin", "tech"];
				const remContacts = domainContacts
					.filter(
						(c) =>
							swapTypes.includes(c.type as DomainContactType) &&
							c.handle &&
							c.handle === registrantHandle,
					)
					.map((c) => ({ type: c.type as DomainContactType, id: c.handle }));
				const addContacts = remContacts.map((c) => ({ type: c.type, id: newId }));

				sendFrame(
					socket,
					buildDomainUpdateXml({
						domain: domainName,
						registrant: newId,
						...(addContacts.length ? { addContacts } : {}),
						...(remContacts.length ? { remContacts } : {}),
					}),
				);
				const domainUpdateResult = getEppResult(
					parser.parse((await readFrame(socket)).toString("utf8")) as Record<string, unknown>,
				);

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				if (!isSuccess(domainUpdateResult.code)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: domainUpdateResult.msg || "Could not assign the new owner",
					});
				}

				return { success: true, method: "replace" as const, contactId: newId };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `KENIC contact update failed: ${message}`,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
