/**
 * Nisc Cloud operational tools for Zeepo AI (domain / hosting / session).
 * Reuses agent-internal-tools handlers; Anthropic-shaped tool schemas for Messages API.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { userProfile as userProfileTable } from "@npanel/db/schema/auth-extras";
import type { ToolUnion } from "@anthropic-ai/sdk/resources/messages";
import {
	agentCheckDomainAvailability,
	agentGetDomainDetail,
	agentGetDomainsPortfolio,
	agentGetEmailHostingPlans,
	agentGetHostingDetail,
	agentGetHostingResources,
	agentGetWebHostingPlans,
	DEFAULT_DISPLAY_CURRENCY,
	DEFAULT_DOMAIN_EXTENSIONS,
} from "../../lib/agent-internal-tools";
import {
	checkDomainAvailabilityArgsSchema,
	getDomainDetailArgsSchema,
	getDomainsPortfolioArgsSchema,
	getEmailHostingPlansArgsSchema,
	getHostingDetailArgsSchema,
	getHostingResourcesArgsSchema,
	getSessionInfoArgsSchema,
	getWebHostingPlansArgsSchema,
} from "../zeepo-agent/agent-tools";

export const ZEEPO_AI_OPS_TOOL_NAMES = [
	"get_user_session",
	"check_domain_availability",
	"get_domains_portfolio",
	"get_domain_detail",
	"get_web_hosting_plans",
	"get_email_hosting_plans",
	"get_hosting_resources",
	"get_hosting_detail",
] as const;

export type ZeepoAiOpsToolName = (typeof ZEEPO_AI_OPS_TOOL_NAMES)[number];

export function isZeepoAiOpsToolName(name: string): name is ZeepoAiOpsToolName {
	return (ZEEPO_AI_OPS_TOOL_NAMES as readonly string[]).includes(name);
}

/** Anthropic client tools for live Nisc Cloud operations. */
export const ZEEPO_AI_OPS_CLIENT_TOOLS = [
	{
		name: "get_user_session",
		description:
			"Get the current user's role and domain-registration profile completeness. Call after presenting domain availability so you can tailor checkout guidance.",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "check_domain_availability",
		description:
			"Check whether domain names are available for registration through Nisc Cloud. Pass the SLD without dots/TLD (e.g. diamond-coffee). Optionally pass extensions like .co.ke, .com.",
		input_schema: {
			type: "object" as const,
			properties: {
				name: {
					type: "string",
					description: "SLD only  letters, digits, hyphens; no dots or TLD",
				},
				extensions: {
					type: "array",
					items: { type: "string" },
					description: "TLD extensions to check (e.g. .co.ke, .com)",
				},
			},
			required: ["name"],
		},
	},
	{
		name: "get_domains_portfolio",
		description:
			"List domains already registered/owned through Nisc Cloud for this user (agency-wide or team-scoped).",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_domain_detail",
		description:
			"Fetch registry detail for one domain. Optionally include nameservers and DNS records.",
		input_schema: {
			type: "object" as const,
			properties: {
				domain: { type: "string" },
				include_nameservers: { type: "boolean" },
				include_dns: { type: "boolean" },
			},
			required: ["domain"],
		},
	},
	{
		name: "get_web_hosting_plans",
		description: "List current Nisc Cloud web hosting plans with retail prices.",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_email_hosting_plans",
		description: "List current Nisc Cloud email hosting plans with retail prices.",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_hosting_resources",
		description:
			"List hosting subscriptions managed through Nisc Cloud for this user (agency-wide or team-scoped).",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_hosting_detail",
		description:
			"Fetch live detail for one hosting subscription by primary domain. Optional DNS/mail/subdomains/databases sections.",
		input_schema: {
			type: "object" as const,
			properties: {
				domain: { type: "string" },
				include_dns: { type: "boolean" },
				include_mail: { type: "boolean" },
				include_subdomains: { type: "boolean" },
				include_databases: { type: "boolean" },
			},
			required: ["domain"],
		},
	},
] as const satisfies ReadonlyArray<{
	name: string;
	description: string;
	input_schema: Record<string, unknown>;
}>;

export function getZeepoAiOpsTools(): ToolUnion[] {
	return ZEEPO_AI_OPS_CLIENT_TOOLS as unknown as ToolUnion[];
}

function toolError(prefix: string, e: unknown): { error: string } {
	const msg = e instanceof Error ? e.message : String(e);
	return { error: `${prefix}: ${msg}` };
}

export type ExecuteZeepoAiOpsToolParams = {
	name: string;
	input: Record<string, unknown>;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
	teamName: string | null;
	baseCurrency: string | null;
};

export async function executeZeepoAiOpsTool(
	params: ExecuteZeepoAiOpsToolParams,
): Promise<unknown> {
	const { name, input, userId, teamId, teamName, baseCurrency } = params;

	if (name === "get_user_session") {
		getSessionInfoArgsSchema.safeParse(input);
		try {
			const [dbUser, profile] = await Promise.all([
				db.query.user.findFirst({
					where: eq(userTable.id, userId),
					columns: { id: true, role: true },
				}),
				db.query.userProfile.findFirst({
					where: eq(userProfileTable.userId, userId),
					columns: {
						firstName: true,
						lastName: true,
						phone: true,
						address: true,
						city: true,
						country: true,
						postalCode: true,
					},
				}),
			]);
			const role = (dbUser?.role ?? "CUSTOMER") as string;
			const isAgency =
				role === "AGENCY_USER" ||
				role === "AGENCY_ADMIN" ||
				role === "AGENCY_SUPER_ADMIN";
			const REQUIRED = [
				"firstName",
				"lastName",
				"phone",
				"address",
				"city",
				"country",
				"postalCode",
			] as const;
			const missingFields: string[] = [];
			if (!isAgency) {
				for (const field of REQUIRED) {
					const val = profile?.[field];
					if (!val || String(val).trim() === "") missingFields.push(field);
				}
			}
			return {
				_tool: "get_user_session",
				role,
				isAgency,
				profileComplete: missingFields.length === 0,
				missingFields,
			};
		} catch (e) {
			return toolError("get_user_session failed", e);
		}
	}

	if (name === "check_domain_availability") {
		const parsed = checkDomainAvailabilityArgsSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentCheckDomainAvailability({
				name: parsed.data.name,
				extensions: parsed.data.extensions ?? DEFAULT_DOMAIN_EXTENSIONS,
				targetCurrency: baseCurrency ?? DEFAULT_DISPLAY_CURRENCY,
			});
		} catch (e) {
			return toolError("Domain check failed", e);
		}
	}

	if (name === "get_web_hosting_plans") {
		getWebHostingPlansArgsSchema.safeParse(input);
		try {
			return await agentGetWebHostingPlans();
		} catch (e) {
			return toolError("Web hosting plans fetch failed", e);
		}
	}

	if (name === "get_email_hosting_plans") {
		getEmailHostingPlansArgsSchema.safeParse(input);
		try {
			return await agentGetEmailHostingPlans();
		} catch (e) {
			return toolError("Email hosting plans fetch failed", e);
		}
	}

	const role = (params.userRole ?? "CUSTOMER") as string;
	const isAgency =
		role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";

	if (name === "get_domains_portfolio") {
		getDomainsPortfolioArgsSchema.safeParse(input);
		try {
			return await agentGetDomainsPortfolio({
				isAgency,
				teamId,
				teamName,
			});
		} catch (e) {
			return toolError("Domains portfolio fetch failed", e);
		}
	}

	if (name === "get_domain_detail") {
		const parsed = getDomainDetailArgsSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentGetDomainDetail({
				domain: parsed.data.domain,
				includeNameservers: parsed.data.include_nameservers,
				includeDns: parsed.data.include_dns,
				isAgency,
				teamId,
			});
		} catch (e) {
			return toolError("Domain detail fetch failed", e);
		}
	}

	if (name === "get_hosting_resources") {
		getHostingResourcesArgsSchema.safeParse(input);
		try {
			return await agentGetHostingResources({
				isAgency,
				teamId,
				teamName,
			});
		} catch (e) {
			return toolError("Hosting resources fetch failed", e);
		}
	}

	if (name === "get_hosting_detail") {
		const parsed = getHostingDetailArgsSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentGetHostingDetail({
				domain: parsed.data.domain,
				includeDns: parsed.data.include_dns,
				includeMail: parsed.data.include_mail,
				includeSubdomains: parsed.data.include_subdomains,
				includeDatabases: parsed.data.include_databases,
				isAgency,
				teamId,
			});
		} catch (e) {
			return toolError("Hosting detail fetch failed", e);
		}
	}

	return { error: `Unknown operational tool: ${name}` };
}
