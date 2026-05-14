/**
 * KENIC EPP integration for Nisc domain orders (.ke, .co.ke, etc.).
 * Ensures KENIC contact (registrant) exists, then registers the domain via EPP.
 */
import * as crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { customerIntegration, userProfile } from "@npanel/db/schema/auth-extras";
import { createConnection, readFrame, sendFrame } from "./epp/epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
	buildContactCreateXml,
	buildDomainCreateXml,
	type ContactCreateParams,
	type ContactCreatePostalInfo,
	type DomainCreateParams,
} from "./epp/epp-xml";
import { getKenicEppConfig } from "./epp/kenic-config";
import { isKenicDomain } from "./epp/kenic-tlds";
import { niscLog } from "./nisc-order-logger";

const parser = new XMLParser({ ignoreAttributes: false });

const PROFILE_REQUIRED = [
	"firstName",
	"lastName",
	"address",
	"city",
	"country",
	"postalCode",
	"phone",
] as const;

/** EPP result code 2302 = object already exists (idempotent success for ensure). */
const EPP_CODE_OBJECT_EXISTS = "2302";
const EPP_CODE_SUCCESS = "1000";

function getEppResult(parsed: Record<string, unknown>): { code: string; msg: string } {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	if (!res || typeof res !== "object") return { code: "0", msg: "Unknown response structure" };
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

function getResData(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	return response?.resData as Record<string, unknown> | undefined;
}

/** Normalize Kenyan phone to E.164 for EPP voice (e.g. 0712345678 -> +254712345678). */
function normalizePhoneToE164(phone: string, countryCode: string): string {
	const digits = phone.replace(/\D/g, "");
	if (countryCode === "KE" || countryCode === "Kenya") {
		if (digits.startsWith("254")) return `+${digits}`;
		if (digits.startsWith("0") && digits.length >= 9) return `+254${digits.slice(1)}`;
		if (digits.length >= 9) return `+254${digits}`;
	}
	return phone.startsWith("+") ? phone : `+${digits || phone}`;
}

/** Build EPP contact id from userId (alphanumeric only; max 16 chars for EPP compliance). */
function buildKenicContactId(userId: string): string {
	const safe = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 11);
	return `nisc-${safe}`;
}

/** Build EPP contact create params from user profile (same shape as OpenProvider flow). */
function buildKenicContactParams(
	profile: {
		firstName: string;
		lastName: string;
		address: string;
		city: string;
		country: string;
		postalCode: string;
		state?: string | null;
		phone: string;
	},
	email: string,
	userId: string,
): ContactCreateParams {
	const name = `${(profile.firstName ?? "").trim()} ${(profile.lastName ?? "").trim()}`.trim() || "Registrant";
	const cc = profile.country === "Kenya" ? "KE" : (profile.country?.trim().slice(0, 2).toUpperCase() ?? "KE");
	const voice = normalizePhoneToE164(profile.phone ?? "", profile.country ?? "");
	const postalInfo: ContactCreatePostalInfo = {
		name,
		street: (profile.address ?? "").trim() || "N/A",
		city: (profile.city ?? "").trim() || "N/A",
		sp: profile.state?.trim(),
		pc: (profile.postalCode ?? "").trim() || "00000",
		cc,
	};
	return {
		id: buildKenicContactId(userId),
		postalInfo,
		voice,
		email: email.trim(),
	};
}

export type EnsureKenicIntegrationResult = { contactId: string };

/**
 * Ensure the owner has a KENIC EPP contact (registrant). Creates CustomerIntegration
 * with platformCustomerId = contact id if not present; creates the contact via EPP if needed.
 */
export type ManualRegistrantDetails = {
	firstName: string;
	lastName: string;
	email: string;
	address: string;
	city: string;
	country: string;
	postalCode?: string | null;
	phone: string;
	state?: string | null;
};

export async function ensureKenicIntegration(
	ownerId: string | null,
	createdBy: string,
	options?: {
		logContext?: { niscOrderId: string; orderItemId: string };
		manualDetails?: ManualRegistrantDetails;
	},
): Promise<EnsureKenicIntegrationResult> {
	void niscLog("ensure_kenic_integration_start", {
		ownerId,
		createdBy,
		hasManualDetails: !!options?.manualDetails,
		manualDetails: options?.manualDetails,
		...options?.logContext,
	});

	let profile: ManualRegistrantDetails;
	let email: string;
	let contactLookupId: string;

	if (options?.manualDetails) {
		profile = options.manualDetails;
		email = options.manualDetails.email;
		// Use a stable but unique identifier for manual registrations based on email
		const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex").slice(0, 8);
		contactLookupId = `nisc-man-${hash}`;

		// For manual registrations, we skip the customerIntegration lookup and proceed to EPP
	} else {
		if (!ownerId) {
			throw new Error("Owner ID is required for KENIC domain registration.");
		}
		const [userRow] = await db
			.select({
				id: user.id,
				email: user.email,
				profileUserId: userProfile.userId,
				firstName: userProfile.firstName,
				lastName: userProfile.lastName,
				phone: userProfile.phone,
				address: userProfile.address,
				city: userProfile.city,
				state: userProfile.state,
				country: userProfile.country,
				postalCode: userProfile.postalCode,
			})
			.from(user)
			.leftJoin(userProfile, eq(userProfile.userId, user.id))
			.where(eq(user.id, ownerId))
			.limit(1);

		if (!userRow?.profileUserId) {
			throw new Error("User or profile not found. Complete your profile information and retry.");
		}

		profile = {
			firstName: userRow.firstName!,
			lastName: userRow.lastName!,
			address: userRow.address!,
			city: userRow.city!,
			state: userRow.state,
			country: userRow.country!,
			postalCode: userRow.postalCode,
			phone: userRow.phone!,
		};
		email = userRow.email!;
		contactLookupId = ownerId;

		const [integrationRow] = await db
			.select({
				id: customerIntegration.id,
				platformCustomerId: customerIntegration.platformCustomerId,
			})
			.from(customerIntegration)
			.where(
				and(eq(customerIntegration.userId, ownerId), eq(customerIntegration.platform, "KENIC")),
			)
			.limit(1);

		if (integrationRow?.platformCustomerId) {
			const expectedId = buildKenicContactId(contactLookupId);
			if (integrationRow.platformCustomerId === expectedId) {
				return { contactId: integrationRow.platformCustomerId };
			}
			// If the stored ID doesn't match our current naming/length convention,
			// we proceed to EPP to ensure the correct one is created/synced.
		}
	}

	const missing = PROFILE_REQUIRED.filter(
		(k) =>
			!(profile as Record<string, unknown>)[k] ||
			String((profile as Record<string, unknown>)[k]).trim() === "",
	);
	if (missing.length > 0) {
		throw new Error(
			`Complete registrant information (${missing.join(", ")}) and retry domain registration.`,
		);
	}

	const contactId = buildKenicContactId(contactLookupId);
	const contactParams = buildKenicContactParams(
		profile as {
			firstName: string;
			lastName: string;
			address: string;
			city: string;
			country: string;
			postalCode: string;
			state?: string | null;
			phone: string;
		},
		email,
		contactLookupId,
	);

	let socket;
	try {
		const config = getKenicEppConfig(true);
		socket = await createConnection(config);
		await readFrame(socket);

		sendFrame(socket, buildLoginXml(config.username, config.password));
		const loginBuf = await readFrame(socket);
		const loginParsed = parser.parse(loginBuf.toString("utf8")) as Record<string, unknown>;
		const loginResult = getEppResult(loginParsed);
		if (loginResult.code !== EPP_CODE_SUCCESS) {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			throw new Error(`KENIC EPP login failed: ${loginResult.msg}`);
		}

		sendFrame(socket, buildContactCreateXml(contactParams));
		const contactBuf = await readFrame(socket);
		const contactXml = contactBuf.toString("utf8");
		const contactParsed = parser.parse(contactXml) as Record<string, unknown>;
		const contactResult = getEppResult(contactParsed);

		sendFrame(socket, buildLogoutXml());
		await readFrame(socket);

		if (options?.logContext) {
			void niscLog("processor_api_raw_response", {
				niscOrderId: options.logContext.niscOrderId,
				orderItemId: options.logContext.orderItemId,
				provider: "kenic",
				call: "contactCreate",
				rawResponse: {
					code: contactResult.code,
					msg: contactResult.msg,
					raw: contactXml,
				},
			});
		}

		// 1000 = created; 2303 = contact already exists (e.g. from a previous run)
		if (contactResult.code !== EPP_CODE_SUCCESS && contactResult.code !== EPP_CODE_OBJECT_EXISTS) {
			throw new Error(`KENIC contact create failed: ${contactResult.msg}`);
		}

		const now = new Date();
		const resolvedId =
			contactResult.code === EPP_CODE_SUCCESS
				? (getResData(contactParsed)?.["contact:creData"] as Record<string, unknown>)?.["contact:id"] ?? contactId
				: contactId;
		const finalContactId = String(resolvedId ?? contactId);

		if (!options?.manualDetails) {
			const now = new Date();
			const [existingIntegration] = await db
				.select()
				.from(customerIntegration)
				.where(
					and(eq(customerIntegration.userId, ownerId!), eq(customerIntegration.platform, "KENIC")),
				)
				.limit(1);

			if (!existingIntegration) {
				await db.insert(customerIntegration).values({
					id: crypto.randomUUID(),
					userId: ownerId!,
					platform: "KENIC",
					platformCustomerId: finalContactId,
					isCreated: true,
					isActive: true,
					createdBy,
					createdAt: now,
					lastSyncedAt: now,
					updatedAt: now,
					platformData: { contactId: finalContactId },
				});
			} else {
				await db
					.update(customerIntegration)
					.set({
						platformCustomerId: finalContactId,
						lastSyncedAt: now,
						updatedAt: now,
						platformData: { contactId: finalContactId },
					})
					.where(eq(customerIntegration.id, existingIntegration.id));
			}
		}

		void niscLog("ensure_kenic_integration_success", {
			contactId: finalContactId,
			...options?.logContext,
		});

		return { contactId: finalContactId };
	} finally {
		socket?.destroy();
	}
}

export type RegisterKenicDomainResult = { success: true; domain: string; exDate?: string | null };

/**
 * Register a domain with KENIC via EPP. Contact must already exist (call ensureKenicIntegration first).
 */
export async function registerKenicDomain(
	params: {
		domainName: string;
		registrantContactId: string;
		period?: number;
		orderId?: string;
		orderItemId?: string;
		nameServers?: Array<{ name: string; ip?: string }>;
	},
): Promise<RegisterKenicDomainResult> {
	if (!isKenicDomain(params.domainName)) {
		throw new Error(`Domain ${params.domainName} is not a KENIC TLD. Use OpenProvider for other TLDs.`);
	}

	const period = params.period ?? 1;
	const authInfo = crypto.randomBytes(12).toString("base64url");
	const createParams: DomainCreateParams = {
		name: params.domainName,
		period,
		registrant: params.registrantContactId,
		adminContacts: [params.registrantContactId],
		techContacts: [params.registrantContactId],
		authInfo,
		...(params.nameServers &&
			params.nameServers.length > 0 && {
				ns: {
					type: "hostObj",
					hosts: params.nameServers.map((ns) => ns.name),
				},
			}),
	};

	if (params.orderId && params.orderItemId) {
		void niscLog("processor_register_domain_request", {
			niscOrderId: params.orderId,
			orderItemId: params.orderItemId,
			provider: "kenic",
			call: "domainCreate",
			request: createParams,
		});
	}

	let socket;
	try {
		const config = getKenicEppConfig(true);
		socket = await createConnection(config);
		await readFrame(socket);

		sendFrame(socket, buildLoginXml(config.username, config.password));
		const loginBuf = await readFrame(socket);
		const loginParsed = parser.parse(loginBuf.toString("utf8")) as Record<string, unknown>;
		const loginResult = getEppResult(loginParsed);
		if (loginResult.code !== EPP_CODE_SUCCESS) {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			throw new Error(`KENIC EPP login failed: ${loginResult.msg}`);
		}

		const createXml = buildDomainCreateXml(createParams);
		sendFrame(socket, createXml);
		const createBuf = await readFrame(socket);
		const createXmlStr = createBuf.toString("utf8");
		const createParsed = parser.parse(createXmlStr) as Record<string, unknown>;
		const createResult = getEppResult(createParsed);

		sendFrame(socket, buildLogoutXml());
		await readFrame(socket);

		if (params.orderId && params.orderItemId) {
			void niscLog("processor_api_raw_response", {
				niscOrderId: params.orderId,
				orderItemId: params.orderItemId,
				provider: "kenic",
				call: "domainCreate",
				rawResponse: { code: createResult.code, msg: createResult.msg, raw: createXmlStr },
			});
		}

		if (createResult.code !== EPP_CODE_SUCCESS) {
			throw new Error(`KENIC domain create failed: ${createResult.msg}`);
		}

		const resData = getResData(createParsed);
		const creData = resData?.["domain:creData"] as Record<string, unknown> | undefined;
		const name = (creData?.["domain:name"] as string) ?? params.domainName;
		const exDate = creData?.["domain:exDate"] as string | undefined;

		return { success: true, domain: name, exDate: exDate ?? null };
	} finally {
		socket?.destroy();
	}
}
