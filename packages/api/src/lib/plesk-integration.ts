/**
 * Shared Plesk integration helpers: ensure customer exists in Plesk, provision webspace.
 * Used by orders router and NISC order processor.
 *
 * XML structures and tooling must match the canonical Plesk routers:
 * - Customer add: packages/api/src/routers/plesk/customers-create.ts (buildCustomerCreateXml)
 * - Webspace add: packages/api/src/routers/plesk/subscriptions-create.ts (buildSubscriptionCreateXml)
 * - Transport: packages/api/src/lib/plesk/xml-client.ts (sendPleskXmlRequest)
 *
 * Plesk docs: Creating a Subscription (plan-id / plan-name), customer add gen_info.
 */
import * as crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
import prisma from "@nPanel/db";
import { sendPleskXmlRequest } from "./plesk/xml-client";

export async function ensurePleskIntegration(
	teamOwnerId: string,
	createdBy: string,
): Promise<string> {
	let integration = await prisma.customerIntegration.findUnique({
		where: {
			userId_platform: {
				userId: teamOwnerId,
				platform: "PLESK",
			},
		},
		include: {
			user: { include: { profile: true } },
		},
	});

	if (integration?.isCreated && integration.platformCustomerId) {
		return integration.platformCustomerId;
	}

	const user = await prisma.user.findUnique({
		where: { id: teamOwnerId },
		include: { profile: true },
	});
	if (!user) {
		throw new Error("Team owner not found");
	}
	if (!user.profile) {
		throw new Error(
			"Team owner profile is incomplete. Please ask the customer to complete their profile information.",
		);
	}

	const profile = user.profile;
	const requiredFields = [
		profile.firstName,
		profile.lastName,
		profile.address,
		profile.city,
		profile.country,
		profile.postalCode,
		profile.phone,
	];
	if (requiredFields.some((field) => !field || String(field).trim() === "")) {
		throw new Error(
			"Team owner profile is incomplete. Required fields: first name, last name, address, city, country, postal code, phone. Please ask the customer to complete their profile information.",
		);
	}

	const escapeXml = (str: string): string =>
		str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");

	const generateRandomLogin = () => {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		let result = "";
		for (let i = 0; i < 6; i++) {
			result += letters.charAt(Math.floor(Math.random() * letters.length));
		}
		return result;
	};

	const login = generateRandomLogin();
	const password = Math.random().toString(36).slice(-12) + "A1!";
	const personName = user.name || `${profile.firstName} ${profile.lastName}`;

	// gen_info element order aligned with customers-create.ts (buildCustomerCreateXml)
	const pleskXml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <add>
      <gen_info>
        <cname></cname>
        <pname>${escapeXml(personName)}</pname>
        <login>${escapeXml(login)}</login>
        <passwd>${escapeXml(password)}</passwd>
        <email>${escapeXml(user.email ?? "")}</email>
        ${profile.address ? `<address>${escapeXml(profile.address)}</address>` : "<address></address>"}
        ${profile.city ? `<city>${escapeXml(profile.city)}</city>` : "<city></city>"}
        ${profile.state ? `<state>${escapeXml(profile.state)}</state>` : "<state></state>"}
        ${profile.postalCode ? `<pcode>${escapeXml(String(profile.postalCode))}</pcode>` : "<pcode></pcode>"}
        <country>${profile.country ? escapeXml(profile.country === "Kenya" ? "KE" : profile.country) : ""}</country>
        <locale>en-US</locale>
        <owner-id>1</owner-id>
        <description></description>
      </gen_info>
    </add>
  </customer>
</packet>`;

	const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(pleskXml);

	if (isHostUnreachable) throw new Error("Plesk host is unreachable");
	if (isAuthError) throw new Error("Invalid Plesk credentials");
	if (!xml || xml.trim() === "") throw new Error("Empty response from Plesk server");

	const parser = new XMLParser({ ignoreAttributes: false });
	const parsed = parser.parse(xml) as any;

	if (parsed?.packet?.system?.status === "error") {
		const errCode = parsed.packet.system.errcode;
		const errText = parsed.packet.system.errtext;
		throw new Error(`Plesk API Error ${errCode}: ${errText}`);
	}
	if (parsed?.packet?.customer?.add?.result?.status === "error") {
		throw new Error(`Customer creation failed: ${parsed.packet.customer.add.result.errtext}`);
	}

	const customerId =
		parsed?.packet?.customer?.add?.result?.id?.["#text"] ??
		parsed?.packet?.customer?.add?.result?.id;
	if (!customerId) {
		throw new Error("Failed to create Plesk customer: customer ID not found in response");
	}

	const now = new Date();
	let integrationId: string;
	if (integration) {
		await prisma.customerIntegration.update({
			where: { id: integration.id },
			data: {
				platformCustomerId: String(customerId),
				isCreated: true,
				isActive: true,
				lastSyncedAt: now,
				updatedAt: now,
				platformData: parsed,
			},
		});
		integrationId = integration.id;
	} else {
		const created = await prisma.customerIntegration.create({
			data: {
				id: crypto.randomUUID(),
				userId: teamOwnerId,
				platform: "PLESK",
				platformCustomerId: String(customerId),
				isCreated: true,
				isActive: true,
				createdBy,
				createdAt: now,
				lastSyncedAt: now,
				updatedAt: now,
				platformData: parsed,
			},
		});
		integrationId = created.id;
	}

	await prisma.customerIntegrationActivityLog.create({
		data: {
			id: crypto.randomUUID(),
			userId: teamOwnerId,
			customerIntegrationId: integrationId,
			action: "CREATED",
			description: "Plesk customer integration created (e.g. during order creation)",
			metadata: { customerId: String(customerId), createdBy },
			createdAt: now,
		},
	});

	return String(customerId);
}

export async function provisionToPlesk(input: {
	domainName: string;
	pleskOwnerId: string;
	pleskServicePlanId: string;
	ipAddress?: string;
	description?: string;
	adminDescription?: string;
}): Promise<{
	pleskServiceId: string;
	pleskFtpLogin: string;
	pleskFtpPassword: string;
	pleskStatus: number;
	pleskGuid: string | null;
	pleskResponseData: any;
}> {
	const generateRandomLogin = () => {
		const letters = "abcdefghijklmnopqrstuvwxyz0123456789";
		let result = "ftp";
		for (let i = 0; i < 6; i++) {
			result += letters.charAt(Math.floor(Math.random() * letters.length));
		}
		return result;
	};
	const generateRandomPassword = () => Math.random().toString(36).slice(-12) + "A1!";

	const ftpLogin = generateRandomLogin();
	const ftpPassword = generateRandomPassword();

	const escapeXml = (str: string): string =>
		str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");

	const planIdNumber = parseInt(input.pleskServicePlanId, 10);
	const isNumericPlanId =
		!Number.isNaN(planIdNumber) && planIdNumber.toString() === input.pleskServicePlanId;
	const planSection = isNumericPlanId
		? `<plan-id>${planIdNumber}</plan-id>`
		: `<plan-name>${escapeXml(input.pleskServicePlanId)}</plan-name>`;

	// gen_setup + hosting + plan order aligned with subscriptions-create.ts and Plesk "Creating a Subscription" docs
	const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <add>
      <gen_setup>
        <name>${escapeXml(input.domainName)}</name>
        <owner-id>${input.pleskOwnerId}</owner-id>
        ${input.ipAddress ? `<ip_address>${escapeXml(input.ipAddress)}</ip_address>` : ""}
        <status>0</status>
        <htype>vrt_hst</htype>
        ${input.description ? `<description>${escapeXml(input.description)}</description>` : ""}
        ${input.adminDescription ? `<admin-description>${escapeXml(input.adminDescription)}</admin-description>` : ""}
      </gen_setup>
      <hosting>
        <vrt_hst>
          <property><name>ftp_login</name><value>${escapeXml(ftpLogin)}</value></property>
          <property><name>ftp_password</name><value>${escapeXml(ftpPassword)}</value></property>
        </vrt_hst>
      </hosting>
      ${planSection}
    </add>
  </webspace>
</packet>`;

	const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

	if (isHostUnreachable) throw new Error("Plesk host is unreachable");
	if (isAuthError) throw new Error("Invalid Plesk credentials");
	if (!xml || xml.trim() === "") throw new Error("Empty response from Plesk server");

	const parser = new XMLParser({ ignoreAttributes: false });
	const parsed = parser.parse(xml) as any;
	const result = parsed?.packet?.webspace?.add?.result;
	if (!result) throw new Error("Invalid response structure from Plesk - missing result");
	if (result.status === "error") {
		const code = result.errcode || "unknown";
		const text = result.errtext || "Unknown error from Plesk";
		throw new Error(`Plesk error ${code}: ${text}`);
	}

	let pleskServiceId: string | number | null = null;
	if (result.id) {
		pleskServiceId =
			typeof result.id === "object" && result.id["#text"]
				? result.id["#text"]
				: result.id;
	}
	if (!pleskServiceId && result["filter-id"]) {
		pleskServiceId =
			typeof result["filter-id"] === "object" && result["filter-id"]["#text"]
				? result["filter-id"]["#text"]
				: result["filter-id"];
	}
	if (!pleskServiceId) {
		throw new Error(
			`Failed to create Plesk subscription: service ID not found. ${JSON.stringify(result)}`,
		);
	}

	const pleskStatusText = result?.status?.["#text"] ?? result?.status;
	let pleskStatus = 0;
	if (pleskStatusText) {
		if (typeof pleskStatusText === "string" && pleskStatusText.toLowerCase() === "ok") {
			pleskStatus = 0;
		} else {
			const n = parseInt(String(pleskStatusText), 10);
			pleskStatus = Number.isNaN(n) ? 0 : n;
		}
	}
	const pleskGuid = result?.guid?.["#text"] ?? result?.guid ?? null;

	return {
		pleskServiceId: String(pleskServiceId),
		pleskFtpLogin: ftpLogin,
		pleskFtpPassword: ftpPassword,
		pleskStatus,
		pleskGuid: pleskGuid != null ? String(pleskGuid) : null,
		pleskResponseData: parsed,
	};
}
