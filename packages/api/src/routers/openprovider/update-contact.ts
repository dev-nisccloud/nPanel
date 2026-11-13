import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";
import { createOpenProviderClient, OpenProviderApiError } from "../../lib/openprovider-client";
import type { OpenProviderCustomerRequest, OpenProviderDomainUpdateRequest } from "../../types/openprovider";
import {
	splitDomainNameExtension,
	splitOpenProviderPhone,
	splitStreetNumber,
	toAlpha2Country,
} from "../../lib/domain-contact-edit";
import { assertDomainContactEditAccess } from "../../lib/domain-contact-access";

const contactFieldsSchema = z.object({
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	company_name: z.string().optional(),
	email: z.string().email(),
	phone: z.string().min(1, "Phone is required"),
	fax: z.string().optional(),
	street: z.string().min(1, "Street is required"),
	number: z.string().optional(),
	city: z.string().min(1, "City is required"),
	state: z.string().optional(),
	zipcode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
});

type ContactRole = "owner" | "admin" | "tech" | "billing";
type ContactInput = z.infer<typeof contactFieldsSchema>;

const ROLES: ContactRole[] = ["owner", "admin", "tech", "billing"];

function toCustomerPayload(contact: ContactInput): OpenProviderCustomerRequest {
	const { street, number } = splitStreetNumber(contact.street, contact.number);
	const phone = splitOpenProviderPhone(contact.phone);
	const fax = contact.fax?.trim() ? splitOpenProviderPhone(contact.fax) : undefined;
	return {
		name: {
			first_name: contact.first_name.trim(),
			last_name: contact.last_name.trim(),
		},
		address: {
			street,
			number,
			zipcode: contact.zipcode.trim(),
			city: contact.city.trim(),
			country: toAlpha2Country(contact.country),
			state: contact.state?.trim() || undefined,
		},
		phone,
		email: contact.email.trim(),
		company_name: contact.company_name?.trim() || undefined,
		...(fax ? { fax } : {}),
	};
}

/** modifyCustomer accepts address, phone, fax, and email. Name and company stay on the handle. */
function toInPlacePayload(contact: ContactInput): Partial<OpenProviderCustomerRequest> {
	const full = toCustomerPayload(contact);
	return {
		address: full.address,
		phone: full.phone,
		email: full.email,
		...(full.fax ? { fax: full.fax } : {}),
	};
}

async function authenticateClient() {
	const client = createOpenProviderClient();
	try {
		await client.authenticate({
			username: process.env.OPENPROVIDER_USERNAME!,
			password: process.env.OPENPROVIDER_PASSWORD!,
			ip: process.env.OPENPROVIDER_IP,
		});
	} catch {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "OpenProvider service unavailable. Please check server configuration.",
		});
	}
	return client;
}

function handleOpError(error: unknown): never {
	if (error instanceof TRPCError) throw error;
	if (error instanceof OpenProviderApiError) {
		throw new TRPCError({
			code: error.code >= 400 && error.code < 500 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
			message: error.description,
		});
	}
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: error instanceof Error ? error.message : "OpenProvider contact update failed",
	});
}

function ownerChangeNeedsTrade(message: string): boolean {
	const m = message.toLowerCase();
	if (m.includes("321") || m.includes("cannot be traded")) return false;
	return (
		m.includes("trade") ||
		m.includes("modify_owner") ||
		m.includes("owner change") ||
		m.includes("not allowed to change owner")
	);
}

function normalizeFqdn(value: string): string {
	return value.trim().toLowerCase().replace(/\.$/, "");
}

function liveDomainParts(data: Record<string, unknown>): {
	id: number;
	fqdn: string;
	name: string;
	extension: string;
	ownerHandle: string;
	adminHandle: string;
	techHandle: string;
	billingHandle: string;
} {
	const id = Number(data.id);
	const rawDomain = data.domain;
	let name = "";
	let extension = "";
	if (rawDomain && typeof rawDomain === "object") {
		const d = rawDomain as { name?: string; extension?: string };
		name = String(d.name ?? "").toLowerCase();
		extension = String(d.extension ?? "")
			.toLowerCase()
			.replace(/^\./, "");
	} else if (typeof rawDomain === "string" && rawDomain.trim()) {
		const split = splitDomainNameExtension(rawDomain);
		name = split.name;
		extension = split.extension;
	}
	return {
		id,
		fqdn: name && extension ? `${name}.${extension}` : "",
		name,
		extension,
		ownerHandle: String(data.owner_handle ?? ""),
		adminHandle: String(data.admin_handle ?? ""),
		techHandle: String(data.tech_handle ?? ""),
		billingHandle: String(data.billing_handle ?? ""),
	};
}

type LiveDomain = ReturnType<typeof liveDomainParts>;

function handleForRole(live: LiveDomain, role: ContactRole): string {
	if (role === "owner") return live.ownerHandle;
	if (role === "admin") return live.adminHandle;
	if (role === "tech") return live.techHandle;
	return live.billingHandle;
}

function assignmentKey(
	role: ContactRole,
): "owner_handle" | "admin_handle" | "tech_handle" | "billing_handle" {
	if (role === "owner") return "owner_handle";
	if (role === "admin") return "admin_handle";
	if (role === "tech") return "tech_handle";
	return "billing_handle";
}

type RoleSupport = Record<ContactRole, boolean>;

async function loadRoleSupport(
	client: Awaited<ReturnType<typeof authenticateClient>>,
	live: LiveDomain,
): Promise<RoleSupport> {
	let tld:
		| {
				owner_handle_supported?: boolean;
				admin_handle_supported?: boolean;
				tech_handle_supported?: boolean;
				billing_handle_supported?: boolean;
				modify_owner_allowed?: boolean;
				trade_available?: boolean;
				trade_allowed?: boolean;
		  }
		| undefined;
	try {
		const tldResponse = await client.getTlds({
			extensions: [live.extension],
			status: "ACT",
			with_restrictions: true,
		});
		const extNorm = live.extension.replace(/^\./, "");
		tld = tldResponse.data?.results?.find((t) => (t?.name ?? "").replace(/^\./, "") === extNorm) as
			| typeof tld
			| undefined;
	} catch {
		tld = undefined;
	}

	const flag = (value: boolean | undefined, role: ContactRole): boolean => {
		if (handleForRole(live, role)) return true;
		if (value === false) return false;
		return true;
	};

	return {
		owner: flag(tld?.owner_handle_supported, "owner"),
		admin: flag(tld?.admin_handle_supported, "admin"),
		tech: flag(tld?.tech_handle_supported, "tech"),
		billing: flag(tld?.billing_handle_supported, "billing"),
	};
}

async function loadTldTradeFlags(
	client: Awaited<ReturnType<typeof authenticateClient>>,
	live: LiveDomain,
): Promise<{ modifyOwnerAllowed?: boolean; tradeAvailable?: boolean }> {
	try {
		const tldResponse = await client.getTlds({
			extensions: [live.extension],
			status: "ACT",
			with_restrictions: true,
		});
		const extNorm = live.extension.replace(/^\./, "");
		const tld = tldResponse.data?.results?.find((t) => (t?.name ?? "").replace(/^\./, "") === extNorm) as
			| { modify_owner_allowed?: boolean; trade_available?: boolean; trade_allowed?: boolean }
			| undefined;
		return {
			modifyOwnerAllowed: tld?.modify_owner_allowed,
			tradeAvailable: tld?.trade_available ?? tld?.trade_allowed,
		};
	} catch {
		return {};
	}
}

function rolesUsingHandle(live: LiveDomain, handle: string): ContactRole[] {
	if (!handle) return [];
	return ROLES.filter((role) => handleForRole(live, role) === handle);
}

async function assignHandles(
	client: Awaited<ReturnType<typeof authenticateClient>>,
	domainId: number,
	live: LiveDomain,
	assignment: OpenProviderDomainUpdateRequest,
): Promise<{ usedTrade: boolean }> {
	const includesOwner = !!assignment.owner_handle;
	if (!includesOwner) {
		const updated = await client.updateDomain(domainId, assignment);
		if (updated.code !== 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: updated.desc || "Could not assign the new contact",
			});
		}
		return { usedTrade: false };
	}

	const { modifyOwnerAllowed, tradeAvailable } = await loadTldTradeFlags(client, live);

	const tryTrade = async () => {
		if (tradeAvailable === false) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This TLD does not allow owner changes.",
			});
		}
		const traded = await client.tradeDomain({
			domain: { name: live.name, extension: live.extension },
			owner_handle: assignment.owner_handle!,
			...(assignment.admin_handle ? { admin_handle: assignment.admin_handle } : {}),
			...(assignment.tech_handle ? { tech_handle: assignment.tech_handle } : {}),
			...(assignment.billing_handle ? { billing_handle: assignment.billing_handle } : {}),
		});
		if (traded.code !== 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: traded.desc || "Owner trade failed",
			});
		}
		return { usedTrade: true };
	};

	if (modifyOwnerAllowed === false) {
		if (tradeAvailable === false) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This extension does not allow an owner change.",
			});
		}
		return await tryTrade();
	}

	try {
		const updated = await client.updateDomain(domainId, assignment);
		if (updated.code !== 0) {
			if (ownerChangeNeedsTrade(updated.desc || "")) return await tryTrade();
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: updated.desc || "Could not assign the new owner",
			});
		}
		return { usedTrade: false };
	} catch (error) {
		if (error instanceof TRPCError) {
			if (ownerChangeNeedsTrade(error.message)) return await tryTrade();
			throw error;
		}
		if (error instanceof OpenProviderApiError && ownerChangeNeedsTrade(error.description)) {
			return await tryTrade();
		}
		throw error;
	}
}

/**
 * Update contact details, or replace a handler with a new customer.
 * applyToAll writes every supported role. A per-role save of a shared handle
 * creates a new customer so the other roles keep the original contact.
 */
export const updateContactProcedure = protectedProcedure
	.input(
		z
			.object({
				domainId: z.number().min(1),
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
		await assertDomainContactEditAccess({
			userId: ctx.session.user.id,
			intent: input.intent,
			teamSlug: input.teamSlug,
			openProviderId: input.domainId,
			domainName: input.domain,
		});

		try {
			const client = await authenticateClient();
			const liveResponse = await client.getDomain(input.domainId);
			if (liveResponse.code !== 0 || !liveResponse.data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: liveResponse.desc || "Domain not found",
				});
			}

			const live = liveDomainParts(liveResponse.data);
			if (!live.fqdn) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
			}
			if (Number.isFinite(live.id) && live.id !== input.domainId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
			}
			if (live.fqdn !== normalizeFqdn(input.domain)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Domain does not match the OpenProvider record.",
				});
			}

			const support = await loadRoleSupport(client, live);
			const requested: ContactRole[] = input.applyToAll
				? ROLES.filter((role) => support[role])
				: [input.role!];

			for (const role of requested) {
				if (!support[role]) {
					const label = role === "tech" ? "technical" : role;
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `This extension does not use a ${label} contact.`,
					});
				}
			}

			const payload = toCustomerPayload(input.contact);
			const inPlace = toInPlacePayload(input.contact);

			if (input.intent === "replace") {
				const created = await client.createCustomer(payload);
				if (created.code !== 0 || !created.data?.handle) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: created.desc || "Could not create a new contact handle",
					});
				}
				const newHandle = created.data.handle;
				const assignment: OpenProviderDomainUpdateRequest = {};
				for (const role of requested) {
					assignment[assignmentKey(role)] = newHandle;
				}
				const assigned = await assignHandles(client, input.domainId, live, assignment);
				let emailVerificationStarted = false;
				if (requested.includes("owner")) {
					try {
						const verify = await client.startEmailVerification({
							email: payload.email,
							handle: newHandle,
						});
						emailVerificationStarted = verify.code === 0;
					} catch {
						emailVerificationStarted = false;
					}
				}
				return {
					success: true,
					method: "replace" as const,
					handle: newHandle,
					usedTrade: assigned.usedTrade,
					emailVerificationStarted,
					split: false,
				};
			}

			const inplaceHandles = new Set<string>();
			const splitRoles: ContactRole[] = [];
			let emailVerificationStarted = false;

			for (const role of requested) {
				const current = handleForRole(live, role);
				if (!current) {
					if (!input.applyToAll) splitRoles.push(role);
					continue;
				}
				if (input.applyToAll) {
					inplaceHandles.add(current);
					continue;
				}
				const shared = rolesUsingHandle(live, current).some((other) => other !== role);
				if (shared) splitRoles.push(role);
				else inplaceHandles.add(current);
			}

			if (inplaceHandles.size === 0 && splitRoles.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No contact is attached to this domain for that handler.",
				});
			}

			for (const handle of inplaceHandles) {
				let previousEmail = "";
				const updatesOwner = rolesUsingHandle(live, handle).includes("owner");
				if (updatesOwner) {
					try {
						const current = await client.getCustomer(handle);
						previousEmail = String((current.data as { email?: string } | undefined)?.email ?? "");
					} catch {
						previousEmail = "";
					}
				}
				const response = await client.updateCustomer(handle, inPlace);
				if (response.code !== 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: response.desc || "Contact update failed",
					});
				}
				if (
					updatesOwner &&
					payload.email &&
					previousEmail &&
					payload.email.trim().toLowerCase() !== previousEmail.trim().toLowerCase()
				) {
					try {
						const verify = await client.startEmailVerification({
							email: payload.email,
							handle,
						});
						emailVerificationStarted = verify.code === 0;
					} catch {
						emailVerificationStarted = false;
					}
				}
			}

			let createdHandle = "";
			for (const role of splitRoles) {
				const created = await client.createCustomer(payload);
				if (created.code !== 0 || !created.data?.handle) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: created.desc || "Could not create a new contact handle",
					});
				}
				createdHandle = created.data.handle;
				const assignment: OpenProviderDomainUpdateRequest = {
					[assignmentKey(role)]: createdHandle,
				};
				await assignHandles(client, input.domainId, live, assignment);
				if (role === "owner") {
					try {
						const verify = await client.startEmailVerification({
							email: payload.email,
							handle: createdHandle,
						});
						emailVerificationStarted = verify.code === 0;
					} catch {
						emailVerificationStarted = false;
					}
				}
			}

			const handle =
				createdHandle ||
				(requested.includes("owner") ? live.ownerHandle : handleForRole(live, requested[0]!)) ||
				"";

			return {
				success: true,
				method: "update" as const,
				handle,
				emailVerificationStarted,
				split: splitRoles.length > 0,
				usedTrade: false,
			};
		} catch (error) {
			handleOpError(error);
		}
	});
