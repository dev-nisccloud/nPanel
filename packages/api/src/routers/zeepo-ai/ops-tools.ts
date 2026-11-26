/**
 * Nisc Cloud operational tools for Zeepo AI (domain / hosting / session).
 * Reuses agent-internal-tools handlers; Anthropic-shaped tool schemas for Messages API.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { user as userTable } from "@npanel/db/schema/auth";
import { userProfile as userProfileTable } from "@npanel/db/schema/auth-extras";
import type { ToolUnion } from "@anthropic-ai/sdk/resources/messages";
import {
	agentCheckDomainAvailability,
	agentGetCloudServers,
	agentGetDedicatedServerPlans,
	agentGetDomainDetail,
	agentGetDomainsPortfolio,
	agentGetEmailHostingPlans,
	agentGetHostingDetail,
	agentGetHostingResources,
	agentGetVdsPlans,
	agentGetVpsPlans,
	agentGetWebHostingPlans,
	agentGetWordPressHostingPlans,
	agentGetWordPressSites,
	agentMarketingEmail,
	agentMarketingSeo,
	agentSubmitCreativeBrief,
	DEFAULT_DISPLAY_CURRENCY,
	DEFAULT_DOMAIN_EXTENSIONS,
} from "../../lib/agent-internal-tools";
import { createAiSupportTicket } from "../../lib/create-ai-support-ticket";
import {
	checkDomainAvailabilityArgsSchema,
	getCloudPlansArgsSchema,
	getCloudServersArgsSchema,
	getDomainDetailArgsSchema,
	getDomainsPortfolioArgsSchema,
	getEmailHostingPlansArgsSchema,
	getHostingDetailArgsSchema,
	getHostingResourcesArgsSchema,
	getSessionInfoArgsSchema,
	getWebHostingPlansArgsSchema,
	getWordPressHostingPlansArgsSchema,
	getWordPressSitesArgsSchema,
} from "../zeepo-agent/agent-tools";

export const ZEEPO_AI_OPS_TOOL_NAMES = [
	"get_user_session",
	"check_domain_availability",
	"get_domains_portfolio",
	"get_domain_detail",
	"get_web_hosting_plans",
	"get_email_hosting_plans",
	"get_wordpress_hosting_plans",
	"get_vps_plans",
	"get_vds_plans",
	"get_dedicated_server_plans",
	"get_cloud_servers",
	"get_hosting_resources",
	"get_hosting_detail",
	"get_wordpress_sites",
	"create_support_ticket",
	"marketing_email",
	"marketing_seo",
	"submit_creative_brief",
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
		name: "get_wordpress_hosting_plans",
		description:
			"List current Nisc Cloud WordPress hosting plans with retail prices. Use this to browse or purchase WordPress hosting. Do not use this for WordPress sites they already have.",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_vps_plans",
		description:
			"List or match Nisc Cloud VPS plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.",
		input_schema: {
			type: "object" as const,
			properties: {
				search: { type: "string", description: "Free-text fallback, e.g. 8GB 4 cores AMD London" },
				limit: { type: "integer", description: "Browse page size (1-24). Ignored for a specific config." },
				ram_gb: { type: "number", description: "Requested RAM in GB, e.g. 8" },
				cores: { type: "integer", description: "Requested vCPU / core count, e.g. 4" },
				cpu: { type: "string", enum: ["intel", "amd"], description: "CPU brand if the user specified one" },
				disk_gb: { type: "number", description: "Requested disk in GB" },
				location: { type: "string", description: "City or region, e.g. London, Frankfurt" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "get_vds_plans",
		description:
			"List or match Nisc Cloud VDS plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.",
		input_schema: {
			type: "object" as const,
			properties: {
				search: { type: "string", description: "Free-text fallback, e.g. 16GB 8 cores Intel Frankfurt" },
				limit: { type: "integer", description: "Browse page size (1-24). Ignored for a specific config." },
				ram_gb: { type: "number", description: "Requested RAM in GB, e.g. 16" },
				cores: { type: "integer", description: "Requested vCPU / core count, e.g. 8" },
				cpu: { type: "string", enum: ["intel", "amd"], description: "CPU brand if the user specified one" },
				disk_gb: { type: "number", description: "Requested disk in GB" },
				location: { type: "string", description: "City or region, e.g. London, Frankfurt" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "get_dedicated_server_plans",
		description:
			"List or match Nisc Cloud dedicated server plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.",
		input_schema: {
			type: "object" as const,
			properties: {
				search: { type: "string", description: "Free-text fallback, e.g. 64GB 16 cores Xeon Dallas" },
				limit: { type: "integer", description: "Browse page size (1-24). Ignored for a specific config." },
				ram_gb: { type: "number", description: "Requested RAM in GB, e.g. 64" },
				cores: { type: "integer", description: "Requested CPU core count, e.g. 16" },
				cpu: { type: "string", enum: ["intel", "amd"], description: "CPU brand if the user specified one" },
				disk_gb: { type: "number", description: "Requested disk in GB" },
				location: { type: "string", description: "City or region, e.g. Dallas, London" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "get_cloud_servers",
		description:
			"List VPS, VDS, or dedicated servers already purchased through Nisc Cloud. Agency admin sees all teams; customers only the active team. Pass type vps, vds, dedicated, or all.",
		input_schema: {
			type: "object" as const,
			properties: {
				type: {
					type: "string",
					enum: ["vps", "vds", "dedicated", "all"],
					description: "Which servers to list. Default all.",
				},
			},
			additionalProperties: false,
		},
	},
	{
		name: "get_hosting_resources",
		description:
			"List hosting subscriptions managed through Nisc Cloud for this user (agency-wide or team-scoped). When the user asks about their websites or what sites they have, also call get_wordpress_sites in the same turn: WordPress may exist on that hosting, including subdomains.",
		input_schema: { type: "object" as const, properties: {}, additionalProperties: false },
	},
	{
		name: "get_hosting_detail",
		description:
			"Fetch live detail for one hosting subscription by primary domain. Optional DNS/mail/subdomains/databases sections. When looking up a website they already have, also call get_wordpress_sites with the same domain in the same turn.",
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
	{
		name: "get_wordpress_sites",
		description:
			"List WordPress sites already hosted with Nisc Cloud. Agency admin sees all teams; customers only sites they own or WordPress on hosting they own (including subdomains, e.g. blog.ashut.com if they own ashut.com). Optional domain filters to that host plus its subdomains. Call this together with get_hosting_resources or get_hosting_detail whenever the user asks about their websites, even if they did not say WordPress. Use this for sites they already have, not for buying plans.",
		input_schema: {
			type: "object" as const,
			properties: {
				domain: {
					type: "string",
					description: "Optional domain or parent domain, e.g. ashut.com or blog.ashut.com",
				},
			},
			additionalProperties: false,
		},
	},
	{
		name: "create_support_ticket",
		description:
			"Open a Nisc Cloud support or sales ticket for a human. Summarise what the user needs in subject + summary. Use for billing disputes, lockouts, outages, custom quotes, sales follow-up, or anything you cannot finish in chat. Do not invent that a ticket was opened without calling this.",
		input_schema: {
			type: "object" as const,
			properties: {
				subject: {
					type: "string",
					description: "Short ticket subject, e.g. VPS not booting or Quote for 8GB VPS in London",
				},
				summary: {
					type: "string",
					description: "What the user wants, in 2–8 sentences, for the support/sales team. Include service names, domains, and error details they gave.",
				},
				intent: {
					type: "string",
					enum: ["support", "sales"],
					description: "support for help/issues; sales for quotes, buying help, or talking to sales",
				},
				category: {
					type: "string",
					enum: [
						"TECHNICAL",
						"BILLING",
						"FEATURE",
						"BUG",
						"ACCOUNT",
						"GENERAL",
						"HOSTING",
						"DOMAIN",
						"EMAIL",
						"WORDPRESS",
					],
					description: "Best matching ticket category. Sales enquiries use GENERAL.",
				},
				phone: {
					type: "string",
					description: "Optional callback number if the user provided one.",
				},
			},
			required: ["subject", "summary", "intent"],
		},
	},
	{
		name: "marketing_email",
		description:
			"Email marketing campaigns with SQL-aggregated totals (opens, clicks, bounces) plus the campaign HTML as creative context. Never request per-recipient dumps  totals are already aggregated.",
		input_schema: {
			type: "object" as const,
			properties: {
				action: {
					type: "string",
					enum: ["list_campaigns", "get_campaign", "get_totals"],
					description: "list_campaigns: summaries. get_campaign: one campaign with HTML + aggregates. get_totals: account-level aggregates.",
				},
				campaignId: { type: "string" },
				status: { type: "string", description: "Optional status filter for list_campaigns." },
				includeHtml: {
					type: "boolean",
					description: "Default true on get_campaign. Set false if you only need metrics.",
				},
				limit: { type: "integer", description: "Max campaigns to list (default 40)." },
			},
			required: ["action"],
		},
	},
	{
		name: "marketing_seo",
		description:
			"SEO Suite projects (rankings, organic traffic, audits, backlinks) and stored monthly SEO reports. Use list_projects, then get_overview / get_rankings for a project, or get_reports for GSC/GA4 monthly reports.",
		input_schema: {
			type: "object" as const,
			properties: {
				action: {
					type: "string",
					enum: ["list_projects", "get_overview", "get_rankings", "get_reports"],
				},
				projectId: { type: "string" },
				domain: { type: "string", description: "Find a project or filter reports by domain." },
				reportId: { type: "string" },
				limit: { type: "integer" },
			},
			required: ["action"],
		},
	},
	{
		name: "submit_creative_brief",
		description:
			"Submit a creative brief to the Nisc Cloud design team when new ads, emails, or brand assets need to be produced. Do not generate the finished agency creatives yourself unless the user explicitly asked for image generation. Use this when performance advice depends on new design work.",
		input_schema: {
			type: "object" as const,
			properties: {
				name: { type: "string", description: "Short brief title, e.g. Diamond Coffee Meta retargeting  May." },
				background: { type: "string", description: "Client, product, campaign, platforms, and why new creatives are needed." },
				objectives: { type: "string", description: "What success looks like (CTR, ROAS, brand, offer)." },
				requirements: { type: "string", description: "Formats, sizes, quantities, copy, brand rules, must-include elements." },
				comments: { type: "string" },
				style: { type: "string" },
				copy: { type: "string", description: "Headlines, CTAs, legal lines to include." },
				mandatoryElements: { type: "string" },
				designPreference: { type: "string" },
				timelineStartDate: { type: "string", description: "ISO date if known." },
				timelineEndDate: { type: "string", description: "ISO date if known." },
			},
			required: ["name", "background", "objectives", "requirements"],
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

/** FAB Live AI Support: catalog always; inventory only for logged-in team members. */
export function getZeepoAiSupportOpsTools(opts: { includeInventory: boolean }): ToolUnion[] {
	const allowed = new Set<string>([
		"check_domain_availability",
		"get_web_hosting_plans",
		"get_email_hosting_plans",
		"get_wordpress_hosting_plans",
		"get_vps_plans",
		"get_vds_plans",
		"get_dedicated_server_plans",
		"create_support_ticket",
		...(opts.includeInventory
			? [
					"get_user_session",
					"get_domains_portfolio",
					"get_domain_detail",
					"get_cloud_servers",
					"get_hosting_resources",
					"get_hosting_detail",
					"get_wordpress_sites",
				]
			: []),
	]);
	return (ZEEPO_AI_OPS_CLIENT_TOOLS as unknown as ToolUnion[]).filter((tool) => {
		const name = "name" in tool ? String((tool as { name?: string }).name ?? "") : "";
		return allowed.has(name);
	});
}

function toolError(prefix: string, e: unknown): { error: string } {
	const raw = e instanceof Error ? e.message : String(e);
	const combined = `${prefix}: ${raw}`;
	if (/hivelocity|core\.hivelocity|plesk|wp toolkit/i.test(combined)) {
		return {
			error: resolveHivelocityPublicMessageFromError(
				e,
				"Couldn't complete that lookup right now. Please try again.",
			),
		};
	}
	return { error: combined };
}

/** Drop checkout internals / wholesale fields before the model sees a tool result. */
export function stripZeepoAiOpsToolResultForModel(payload: unknown): unknown {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
	const rec = payload as Record<string, unknown>;
	if (!Array.isArray(rec.plans)) return payload;
	return {
		...rec,
		plans: rec.plans.map((plan) => {
			if (!plan || typeof plan !== "object" || Array.isArray(plan)) return plan;
			const { checkout: _checkout, __baseUsd: _baseUsd, location_option_id: _loc, ...rest } =
				plan as Record<string, unknown>;
			return rest;
		}),
	};
}

export type ExecuteZeepoAiOpsToolParams = {
	name: string;
	input: Record<string, unknown>;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
	teamName: string | null;
	baseCurrency: string | null;
	sessionId?: string;
	surface?: "support_fab" | "zeepo_ai";
	ipAddress?: string | null;
	userAgent?: string | null;
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

	if (name === "get_wordpress_hosting_plans") {
		getWordPressHostingPlansArgsSchema.safeParse(input);
		try {
			return await agentGetWordPressHostingPlans();
		} catch (e) {
			return toolError("WordPress hosting plans fetch failed", e);
		}
	}

	if (name === "get_vps_plans" || name === "get_vds_plans" || name === "get_dedicated_server_plans") {
		const parsed = getCloudPlansArgsSchema.safeParse(input ?? {});
		if (!parsed.success) return { error: parsed.error.message };
		try {
			if (name === "get_vps_plans") {
				return await agentGetVpsPlans(parsed.data);
			}
			if (name === "get_vds_plans") {
				return await agentGetVdsPlans(parsed.data);
			}
			return await agentGetDedicatedServerPlans(parsed.data);
		} catch (e) {
			return toolError("Server plans fetch failed", e);
		}
	}

	const role = (params.userRole ?? "CUSTOMER") as string;
	// Agency-wide portfolio/hosting is admin+ only; AGENCY_USER stays team-scoped.
	const isAgency =
		role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";

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

	if (name === "get_cloud_servers") {
		const parsed = getCloudServersArgsSchema.safeParse(input ?? {});
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentGetCloudServers({
				kind: parsed.data.type ?? "all",
				isAgency,
				teamId,
				teamName,
			});
		} catch (e) {
			return toolError("Cloud servers fetch failed", e);
		}
	}

	if (name === "get_hosting_resources") {
		getHostingResourcesArgsSchema.safeParse(input);
		try {
			const hosting = await agentGetHostingResources({
				isAgency,
				teamId,
				teamName,
			});
			try {
				const wordpressSites = await agentGetWordPressSites({
					isAgency,
					teamId,
					teamName,
				});
				return { ...hosting, wordpressSites };
			} catch {
				return hosting;
			}
		} catch (e) {
			return toolError("Hosting resources fetch failed", e);
		}
	}

	if (name === "get_hosting_detail") {
		const parsed = getHostingDetailArgsSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			const hosting = await agentGetHostingDetail({
				domain: parsed.data.domain,
				includeDns: parsed.data.include_dns,
				includeMail: parsed.data.include_mail,
				includeSubdomains: parsed.data.include_subdomains,
				includeDatabases: parsed.data.include_databases,
				isAgency,
				teamId,
			});
			try {
				const wordpressSites = await agentGetWordPressSites({
					isAgency,
					teamId,
					teamName,
					domain: parsed.data.domain,
				});
				return { ...hosting, wordpressSites };
			} catch {
				return hosting;
			}
		} catch (e) {
			return toolError("Hosting detail fetch failed", e);
		}
	}

	if (name === "get_wordpress_sites") {
		const parsed = getWordPressSitesArgsSchema.safeParse(input ?? {});
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentGetWordPressSites({
				isAgency,
				teamId,
				teamName,
				domain: parsed.data.domain,
			});
		} catch (e) {
			return toolError("WordPress sites fetch failed", e);
		}
	}

	if (name === "create_support_ticket") {
		if (!params.sessionId) {
			return { error: "Chat session is required to open a ticket." };
		}
		const parsed = z
			.object({
				subject: z.string().trim().min(1).max(120),
				summary: z.string().trim().min(1).max(4000),
				intent: z.enum(["support", "sales"]),
				category: z
					.enum([
						"TECHNICAL",
						"BILLING",
						"FEATURE",
						"BUG",
						"ACCOUNT",
						"GENERAL",
						"HOSTING",
						"DOMAIN",
						"EMAIL",
						"WORDPRESS",
					])
					.optional(),
				phone: z.string().trim().max(40).optional().nullable(),
			})
			.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await createAiSupportTicket({
				userId,
				userRole: params.userRole,
				teamId,
				sessionId: params.sessionId,
				surface: params.surface ?? "zeepo_ai",
				subject: parsed.data.subject,
				summary: parsed.data.summary,
				intent: parsed.data.intent,
				category: parsed.data.category,
				phone: parsed.data.phone,
				ipAddress: params.ipAddress,
				userAgent: params.userAgent,
			});
		} catch (e) {
			if (e instanceof TRPCError) {
				return { error: e.message };
			}
			return toolError("Could not open a ticket", e);
		}
	}

	if (name === "marketing_email") {
		const parsed = z
			.object({
				action: z.enum(["list_campaigns", "get_campaign", "get_totals"]),
				campaignId: z.string().min(1).optional(),
				search: z.string().optional(),
				status: z.string().optional(),
				includeHtml: z.boolean().optional(),
				limit: z.number().int().optional(),
			})
			.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentMarketingEmail({
				...parsed.data,
				userId,
				userRole: params.userRole,
				teamId,
			});
		} catch (e) {
			if (e instanceof TRPCError) return { error: e.message };
			return toolError("Could not load email marketing data", e);
		}
	}

	if (name === "marketing_seo") {
		const parsed = z
			.object({
				action: z.enum(["list_projects", "get_overview", "get_rankings", "get_reports"]),
				projectId: z.string().min(1).optional(),
				domain: z.string().optional(),
				reportId: z.string().min(1).optional(),
				limit: z.number().int().optional(),
			})
			.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentMarketingSeo({
				...parsed.data,
				userId,
				userRole: params.userRole,
				teamId,
			});
		} catch (e) {
			if (e instanceof TRPCError) return { error: e.message };
			return toolError("Could not load SEO data", e);
		}
	}

	if (name === "submit_creative_brief") {
		const parsed = z
			.object({
				name: z.string().trim().min(1).max(255),
				background: z.string().trim().min(1).max(20000),
				objectives: z.string().trim().min(1).max(20000),
				requirements: z.string().trim().min(1).max(20000),
				comments: z.string().max(10000).optional(),
				style: z.string().max(5000).optional(),
				copy: z.string().max(10000).optional(),
				mandatoryElements: z.string().max(5000).optional(),
				designPreference: z.string().max(5000).optional(),
				timelineStartDate: z.string().optional(),
				timelineEndDate: z.string().optional(),
			})
			.safeParse(input);
		if (!parsed.success) return { error: parsed.error.message };
		try {
			return await agentSubmitCreativeBrief({
				...parsed.data,
				userId,
				userRole: params.userRole,
				teamId,
			});
		} catch (e) {
			if (e instanceof TRPCError) return { error: e.message };
			return toolError("Could not submit creative brief", e);
		}
	}

	return { error: `Unknown operational tool: ${name}` };
}
