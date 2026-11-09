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
import { assertDomainContactEditAccess } from "../../lib/domain-contact-access";
import { domainProductSqlFilter } from "../../lib/nisc-domain-product";
import { user as userTable } from "@npanel/db/schema/auth";

const parser = new XMLParser({ ignoreAttributes: false });

type ContactRole = "owner" | "admin" | "tech" | "billing";
const HANDLER_TYPES: DomainContactType[] = ["admin", "tech", "billing"];

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
	return `nupd${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 16);
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

async function isAgencySuperAdmin(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);
	return row?.role === "AGENCY_SUPER_ADMIN";
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

type DomainContactLink = { type: string; handle: string };

function parseDomainContacts(node: unknown): DomainContactLink[] {
	const list = Array.isArray(node) ? node : node ? [node] : [];
	return list.map((c) => {
		const row = c as Record<string, unknown>;
		return {
			type: String(row["@_type"] ?? ""),
			handle: String(row["#text"] ?? ""),
		};
	});
}

function handleForRole(registrant: string, contacts: DomainContactLink[], role: ContactRole): string {
	if (role === "owner") return registrant;
	return contacts.find((c) => c.type === role && c.handle)?.handle ?? "";
}

function rolesUsingHandle(
	registrant: string,
	contacts: DomainContactLink[],
	handle: string,
): ContactRole[] {
	if (!handle) return [];
	const roles: ContactRole[] = [];
	if (registrant === handle) roles.push("owner");
	for (const type of HANDLER_TYPES) {
		if (contacts.some((c) => c.type === type && c.handle === handle)) roles.push(type);
	}
	return roles;
}

async function eppCommand(
	socket: NonNullable<Awaited<ReturnType<typeof createConnection>>>,
	xml: string,
): Promise<{ code: string; msg: string; parsed: Record<string, unknown> }> {
	sendFrame(socket, xml);
	const parsed = parser.parse((await readFrame(socket)).toString("utf8")) as Record<string, unknown>;
	const result = getEppResult(parsed);
	return { ...result, parsed };
}

/**
 * Agency super admin: update or replace registrant, admin, tech, and billing.
 * A customer team member can update details only.
 */
export const kenicContactUpdateRouter = router({
	update: protectedProcedure
		.input(
			z
				.object({
					domain: z.string().min(1),
					intent: z.enum(["update", "replace"]),
					applyToAll: z.boolean().default(false),
					role: z.enum(["owner", "admin", "tech", "billing"]).optional(),
					teamSlug: z.string().min(1).optional(),
					contact: contactFieldsSchema,
				})
				.superRefine((value, ctx) => {
					if (!value.applyToAll && !value.role) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Choose a contact handler",
							path: ["role"],
						});
					}
				}),
		)
		.mutation(async ({ ctx, input }) => {
			const superAdmin = await isAgencySuperAdmin(ctx.session.user.id);
			if (superAdmin) {
				await assertKenicDomainInAgencyLedger(input.domain);
			}
			await assertDomainContactEditAccess({
				userId: ctx.session.user.id,
				intent: input.intent,
				teamSlug: input.teamSlug,
				domainName: input.domain,
			});
			const domainName = normalizeDomainName(input.domain);

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
			const email = input.contact.email.trim();

			let socket: Awaited<ReturnType<typeof createConnection>> | undefined;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);
				await readFrame(socket);

				const login = await eppCommand(socket, buildLoginXml(config.username, config.password));
				if (login.code !== "1000") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `EPP login failed: ${login.msg}`,
					});
				}

				const info = await eppCommand(socket, buildDomainInfoXml(domainName));
				if (info.code !== "1000") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Domain info failed: ${info.msg}`,
					});
				}

				const infoData = (info.parsed?.epp as Record<string, unknown> | undefined)?.response as
					| Record<string, unknown>
					| undefined;
				const infData = (infoData?.resData as Record<string, unknown> | undefined)?.["domain:infData"] as
					| Record<string, unknown>
					| undefined;
				const registryName = normalizeDomainName(String(infData?.["domain:name"] ?? ""));
				if (registryName && registryName !== domainName) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Domain does not match the registry record.",
					});
				}
				if (isUpdateProhibited(statusList(infData?.["domain:status"]))) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This domain is locked against updates at the registry.",
					});
				}

				const registrantHandle = String(infData?.["domain:registrant"] ?? "");
				const domainContacts = parseDomainContacts(infData?.["domain:contact"]);
				const requested: ContactRole[] = input.applyToAll
					? ["owner", "admin", "tech", "billing"]
					: [input.role!];

				const assertContactMutable = async (handle: string) => {
					const current = await eppCommand(socket!, buildContactInfoXml(handle));
					if (!isSuccess(current.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: current.msg || "Could not load the contact.",
						});
					}
					const resData = (current.parsed?.epp as Record<string, unknown> | undefined)?.response as
						| Record<string, unknown>
						| undefined;
					const contactInf = (resData?.resData as Record<string, unknown> | undefined)?.[
						"contact:infData"
					] as Record<string, unknown> | undefined;
					if (isUpdateProhibited(statusList(contactInf?.["contact:status"]))) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "This contact is locked against updates at the registry.",
						});
					}
				};

				const createContact = async () => {
					const newId = newKenicContactId();
					const created = await eppCommand(
						socket!,
						buildContactCreateXml({
							id: newId,
							postalInfo,
							voice,
							email,
							...(fax ? { fax } : {}),
						}),
					);
					if (!isSuccess(created.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: created.msg || "Could not create the new contact",
						});
					}
					return newId;
				};

				const linkContacts = async (params: {
					registrant?: string;
					remContacts?: Array<{ type: DomainContactType; id: string }>;
					addContacts?: Array<{ type: DomainContactType; id: string }>;
				}) => {
					if (!params.registrant && !params.remContacts?.length && !params.addContacts?.length) return;
					const updated = await eppCommand(
						socket!,
						buildDomainUpdateXml({
							domain: domainName,
							...(params.registrant ? { registrant: params.registrant } : {}),
							...(params.addContacts?.length ? { addContacts: params.addContacts } : {}),
							...(params.remContacts?.length ? { remContacts: params.remContacts } : {}),
						}),
					);
					if (!isSuccess(updated.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: updated.msg || "Could not assign the contact",
						});
					}
				};

				const updateObject = async (handle: string) => {
					await assertContactMutable(handle);
					const updated = await eppCommand(
						socket!,
						buildContactUpdateXml({
							id: handle,
							postalInfo,
							voice,
							fax: fax || null,
							email,
						}),
					);
					if (!isSuccess(updated.code)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: updated.msg || "Contact update failed",
						});
					}
				};

				if (input.intent === "replace") {
					const newId = await createContact();
					const remContacts: Array<{ type: DomainContactType; id: string }> = [];
					const addContacts: Array<{ type: DomainContactType; id: string }> = [];
					for (const type of HANDLER_TYPES) {
						if (!requested.includes(type)) continue;
						for (const existing of domainContacts.filter((c) => c.type === type && c.handle)) {
							remContacts.push({ type, id: existing.handle });
						}
						addContacts.push({ type, id: newId });
					}
					await linkContacts({
						...(requested.includes("owner") ? { registrant: newId } : {}),
						remContacts,
						addContacts,
					});

					await eppCommand(socket, buildLogoutXml());
					return { success: true, method: "replace" as const, contactId: newId, split: false };
				}

				const inplaceHandles = new Set<string>();
				const splitRoles: ContactRole[] = [];
				for (const role of requested) {
					const current = handleForRole(registrantHandle, domainContacts, role);
					if (!current) {
						if (!input.applyToAll) splitRoles.push(role);
						continue;
					}
					const users = rolesUsingHandle(registrantHandle, domainContacts, current);
					const coversEveryUser = users.every((userRole) => requested.includes(userRole));
					if (coversEveryUser) inplaceHandles.add(current);
					else splitRoles.push(role);
				}

				if (inplaceHandles.size === 0 && splitRoles.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No contact is attached to this domain for that handler.",
					});
				}

				for (const handle of inplaceHandles) {
					await updateObject(handle);
				}

				let createdId = "";
				for (const role of splitRoles) {
					createdId = await createContact();
					if (role === "owner") {
						await linkContacts({ registrant: createdId });
						continue;
					}
					const remContacts = domainContacts
						.filter((c) => c.type === role && c.handle)
						.map((c) => ({ type: role, id: c.handle }));
					await linkContacts({
						remContacts,
						addContacts: [{ type: role, id: createdId }],
					});
				}

				await eppCommand(socket, buildLogoutXml());
				const contactId =
					createdId ||
					handleForRole(registrantHandle, domainContacts, requested.includes("owner") ? "owner" : requested[0]!) ||
					registrantHandle;
				return {
					success: true,
					method: "update" as const,
					contactId,
					split: splitRoles.length > 0,
				};
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
