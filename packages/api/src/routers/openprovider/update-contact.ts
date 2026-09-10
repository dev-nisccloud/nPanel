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
import { assertAgencySuperAdmin } from "../../lib/domain-transfer-access";

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

function toCustomerPayload(contact: z.infer<typeof contactFieldsSchema>): OpenProviderCustomerRequest {
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

function handleForRole(
	live: ReturnType<typeof liveDomainParts>,
	role: ContactRole,
): string {
	if (role === "owner") return live.ownerHandle;
	if (role === "admin") return live.adminHandle;
	if (role === "tech") return live.techHandle;
	return live.billingHandle;
}

/**
 * Update an existing handle, or create a new one and assign it (update or trade).
 * Domain id and handles are loaded from OpenProvider; client-supplied handles are ignored.
 */
export const updateContactProcedure = protectedProcedure
	.input(
		z.object({
			domainId: z.number().min(1),
			domain: z.string().min(1),
			intent: z.enum(["update", "replace"]),
			role: z.enum(["owner", "admin", "tech", "billing"]).optional().default("owner"),
			contact: contactFieldsSchema,
		}),
	)
	.mutation(async ({ ctx, input }) => {
		await assertAgencySuperAdmin(ctx.session.user.id);

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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Domain not found",
				});
			}
			if (Number.isFinite(live.id) && live.id !== input.domainId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Domain not found",
				});
			}
			if (live.fqdn !== normalizeFqdn(input.domain)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Domain does not match the OpenProvider record.",
				});
			}

			const role = input.role ?? "owner";
			const currentHandle = handleForRole(live, role);
			if (!currentHandle) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No contact handle is attached to this domain for that role.",
				});
			}

			const payload = toCustomerPayload(input.contact);

			if (input.intent === "update") {
				let previousEmail = "";
				if (role === "owner") {
					try {
						const current = await client.getCustomer(currentHandle);
						previousEmail = String((current.data as { email?: string } | undefined)?.email ?? "");
					} catch {
						previousEmail = "";
					}
				}

				const updateData: Partial<OpenProviderCustomerRequest> = {
					address: payload.address,
					phone: payload.phone,
					email: payload.email,
					...(payload.fax ? { fax: payload.fax } : {}),
				};
				const response = await client.updateCustomer(currentHandle, updateData);
				if (response.code !== 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: response.desc || "Contact update failed",
					});
				}

				let emailVerificationStarted = false;
				if (
					role === "owner" &&
					payload.email &&
					previousEmail &&
					payload.email.trim().toLowerCase() !== previousEmail.trim().toLowerCase()
				) {
					try {
						const verify = await client.startEmailVerification({
							email: payload.email,
							handle: currentHandle,
						});
						emailVerificationStarted = verify.code === 0;
					} catch {
						emailVerificationStarted = false;
					}
				}

				return {
					success: true,
					method: "update" as const,
					handle: currentHandle,
					emailVerificationStarted,
				};
			}

			const created = await client.createCustomer(payload);
			if (created.code !== 0 || !created.data?.handle) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: created.desc || "Could not create a new contact handle",
				});
			}
			const newHandle = created.data.handle;

			const assignment: OpenProviderDomainUpdateRequest = {};
			if (role === "owner") {
				assignment.owner_handle = newHandle;
				if (live.adminHandle && live.adminHandle === live.ownerHandle) {
					assignment.admin_handle = newHandle;
				}
				if (live.techHandle && live.techHandle === live.ownerHandle) {
					assignment.tech_handle = newHandle;
				}
				if (live.billingHandle && live.billingHandle === live.ownerHandle) {
					assignment.billing_handle = newHandle;
				}
			} else if (role === "admin") {
				assignment.admin_handle = newHandle;
			} else if (role === "tech") {
				assignment.tech_handle = newHandle;
			} else {
				assignment.billing_handle = newHandle;
			}

			if (role !== "owner") {
				const updated = await client.updateDomain(input.domainId, assignment);
				if (updated.code !== 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: updated.desc || "Could not assign the new contact",
					});
				}
				return { success: true, method: "replace" as const, handle: newHandle, usedTrade: false };
			}

			let modifyOwnerAllowed: boolean | undefined;
			let tradeAvailable: boolean | undefined;
			try {
				const tldResponse = await client.getTlds({
					extensions: [live.extension],
					status: "ACT",
					with_restrictions: true,
				});
				const extNorm = live.extension.replace(/^\./, "");
				const tld = tldResponse.data?.results?.find((t) => {
					const tldName = (t?.name ?? "").replace(/^\./, "");
					return tldName === extNorm;
				}) as { modify_owner_allowed?: boolean; trade_available?: boolean; trade_allowed?: boolean } | undefined;
				modifyOwnerAllowed = tld?.modify_owner_allowed;
				tradeAvailable = tld?.trade_available ?? tld?.trade_allowed;
			} catch {
				modifyOwnerAllowed = undefined;
			}

			const tryTrade = async () => {
				if (tradeAvailable === false) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This TLD does not allow owner changes.",
					});
				}
				const traded = await client.tradeDomain({
					domain: { name: live.name, extension: live.extension },
					owner_handle: newHandle,
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
				return { success: true, method: "replace" as const, handle: newHandle, usedTrade: true };
			};

			if (modifyOwnerAllowed === false) {
				return await tryTrade();
			}

			try {
				const updated = await client.updateDomain(input.domainId, assignment);
				if (updated.code !== 0) {
					if (ownerChangeNeedsTrade(updated.desc || "")) {
						return await tryTrade();
					}
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: updated.desc || "Could not assign the new owner",
					});
				}
				return { success: true, method: "replace" as const, handle: newHandle, usedTrade: false };
			} catch (error) {
				if (error instanceof TRPCError) {
					if (ownerChangeNeedsTrade(error.message)) {
						return await tryTrade();
					}
					throw error;
				}
				if (error instanceof OpenProviderApiError && ownerChangeNeedsTrade(error.description)) {
					return await tryTrade();
				}
				throw error;
			}
		} catch (error) {
			handleOpError(error);
		}
	});
