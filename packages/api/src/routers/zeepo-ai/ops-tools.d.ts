import type { ToolUnion } from "@anthropic-ai/sdk/resources/messages";
export declare const ZEEPO_AI_OPS_TOOL_NAMES: readonly ["get_user_session", "check_domain_availability", "get_domains_portfolio", "get_domain_detail", "get_web_hosting_plans", "get_email_hosting_plans", "get_wordpress_hosting_plans", "get_vps_plans", "get_vds_plans", "get_dedicated_server_plans", "get_cloud_servers", "get_hosting_resources", "get_hosting_detail", "get_wordpress_sites", "create_support_ticket"];
export type ZeepoAiOpsToolName = (typeof ZEEPO_AI_OPS_TOOL_NAMES)[number];
export declare function isZeepoAiOpsToolName(name: string): name is ZeepoAiOpsToolName;
/** Anthropic client tools for live Nisc Cloud operations. */
export declare const ZEEPO_AI_OPS_CLIENT_TOOLS: readonly [{
    readonly name: "get_user_session";
    readonly description: "Get the current user's role and domain-registration profile completeness. Call after presenting domain availability so you can tailor checkout guidance.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "check_domain_availability";
    readonly description: "Check whether domain names are available for registration through Nisc Cloud. Pass the SLD without dots/TLD (e.g. diamond-coffee). Optionally pass extensions like .co.ke, .com.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "SLD only  letters, digits, hyphens; no dots or TLD";
            };
            readonly extensions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "TLD extensions to check (e.g. .co.ke, .com)";
            };
        };
        readonly required: readonly ["name"];
    };
}, {
    readonly name: "get_domains_portfolio";
    readonly description: "List domains already registered/owned through Nisc Cloud for this user (agency-wide or team-scoped).";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_domain_detail";
    readonly description: "Fetch registry detail for one domain. Optionally include nameservers and DNS records.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly domain: {
                readonly type: "string";
            };
            readonly include_nameservers: {
                readonly type: "boolean";
            };
            readonly include_dns: {
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["domain"];
    };
}, {
    readonly name: "get_web_hosting_plans";
    readonly description: "List current Nisc Cloud web hosting plans with retail prices.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_email_hosting_plans";
    readonly description: "List current Nisc Cloud email hosting plans with retail prices.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_wordpress_hosting_plans";
    readonly description: "List current Nisc Cloud WordPress hosting plans with retail prices. Use this to browse or purchase WordPress hosting. Do not use this for WordPress sites they already have.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_vps_plans";
    readonly description: "List or match Nisc Cloud VPS plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly search: {
                readonly type: "string";
                readonly description: "Free-text fallback, e.g. 8GB 4 cores AMD London";
            };
            readonly limit: {
                readonly type: "integer";
                readonly description: "Browse page size (1-24). Ignored for a specific config.";
            };
            readonly ram_gb: {
                readonly type: "number";
                readonly description: "Requested RAM in GB, e.g. 8";
            };
            readonly cores: {
                readonly type: "integer";
                readonly description: "Requested vCPU / core count, e.g. 4";
            };
            readonly cpu: {
                readonly type: "string";
                readonly enum: readonly ["intel", "amd"];
                readonly description: "CPU brand if the user specified one";
            };
            readonly disk_gb: {
                readonly type: "number";
                readonly description: "Requested disk in GB";
            };
            readonly location: {
                readonly type: "string";
                readonly description: "City or region, e.g. London, Frankfurt";
            };
        };
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_vds_plans";
    readonly description: "List or match Nisc Cloud VDS plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly search: {
                readonly type: "string";
                readonly description: "Free-text fallback, e.g. 16GB 8 cores Intel Frankfurt";
            };
            readonly limit: {
                readonly type: "integer";
                readonly description: "Browse page size (1-24). Ignored for a specific config.";
            };
            readonly ram_gb: {
                readonly type: "number";
                readonly description: "Requested RAM in GB, e.g. 16";
            };
            readonly cores: {
                readonly type: "integer";
                readonly description: "Requested vCPU / core count, e.g. 8";
            };
            readonly cpu: {
                readonly type: "string";
                readonly enum: readonly ["intel", "amd"];
                readonly description: "CPU brand if the user specified one";
            };
            readonly disk_gb: {
                readonly type: "number";
                readonly description: "Requested disk in GB";
            };
            readonly location: {
                readonly type: "string";
                readonly description: "City or region, e.g. London, Frankfurt";
            };
        };
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_dedicated_server_plans";
    readonly description: "List or match Nisc Cloud dedicated server plans. Browse with no filters (paginated). When the user names a config (RAM, cores, CPU, disk, location), pass those fields and this returns the single best matching plan they can buy.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly search: {
                readonly type: "string";
                readonly description: "Free-text fallback, e.g. 64GB 16 cores Xeon Dallas";
            };
            readonly limit: {
                readonly type: "integer";
                readonly description: "Browse page size (1-24). Ignored for a specific config.";
            };
            readonly ram_gb: {
                readonly type: "number";
                readonly description: "Requested RAM in GB, e.g. 64";
            };
            readonly cores: {
                readonly type: "integer";
                readonly description: "Requested CPU core count, e.g. 16";
            };
            readonly cpu: {
                readonly type: "string";
                readonly enum: readonly ["intel", "amd"];
                readonly description: "CPU brand if the user specified one";
            };
            readonly disk_gb: {
                readonly type: "number";
                readonly description: "Requested disk in GB";
            };
            readonly location: {
                readonly type: "string";
                readonly description: "City or region, e.g. Dallas, London";
            };
        };
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_cloud_servers";
    readonly description: "List VPS, VDS, or dedicated servers already purchased through Nisc Cloud. Agency admin sees all teams; customers only the active team. Pass type vps, vds, dedicated, or all.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly type: {
                readonly type: "string";
                readonly enum: readonly ["vps", "vds", "dedicated", "all"];
                readonly description: "Which servers to list. Default all.";
            };
        };
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_hosting_resources";
    readonly description: "List hosting subscriptions managed through Nisc Cloud for this user (agency-wide or team-scoped). When the user asks about their websites or what sites they have, also call get_wordpress_sites in the same turn: WordPress may exist on that hosting, including subdomains.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {};
        readonly additionalProperties: false;
    };
}, {
    readonly name: "get_hosting_detail";
    readonly description: "Fetch live detail for one hosting subscription by primary domain. Optional DNS/mail/subdomains/databases sections. When looking up a website they already have, also call get_wordpress_sites with the same domain in the same turn.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly domain: {
                readonly type: "string";
            };
            readonly include_dns: {
                readonly type: "boolean";
            };
            readonly include_mail: {
                readonly type: "boolean";
            };
            readonly include_subdomains: {
                readonly type: "boolean";
            };
            readonly include_databases: {
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["domain"];
    };
}, {
    readonly name: "get_wordpress_sites";
    readonly description: "List WordPress sites already hosted with Nisc Cloud. Agency admin sees all teams; customers only sites they own or WordPress on hosting they own (including subdomains, e.g. blog.ashut.com if they own ashut.com). Optional domain filters to that host plus its subdomains. Call this together with get_hosting_resources or get_hosting_detail whenever the user asks about their websites, even if they did not say WordPress. Use this for sites they already have, not for buying plans.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly domain: {
                readonly type: "string";
                readonly description: "Optional domain or parent domain, e.g. ashut.com or blog.ashut.com";
            };
        };
        readonly additionalProperties: false;
    };
}, {
    readonly name: "create_support_ticket";
    readonly description: "Open a Nisc Cloud support or sales ticket for a human. Summarise what the user needs in subject + summary. Use for billing disputes, lockouts, outages, custom quotes, sales follow-up, or anything you cannot finish in chat. Do not invent that a ticket was opened without calling this.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly subject: {
                readonly type: "string";
                readonly description: "Short ticket subject, e.g. VPS not booting or Quote for 8GB VPS in London";
            };
            readonly summary: {
                readonly type: "string";
                readonly description: "What the user wants, in 2–8 sentences, for the support/sales team. Include service names, domains, and error details they gave.";
            };
            readonly intent: {
                readonly type: "string";
                readonly enum: readonly ["support", "sales"];
                readonly description: "support for help/issues; sales for quotes, buying help, or talking to sales";
            };
            readonly category: {
                readonly type: "string";
                readonly enum: readonly ["TECHNICAL", "BILLING", "FEATURE", "BUG", "ACCOUNT", "GENERAL", "HOSTING", "DOMAIN", "EMAIL", "WORDPRESS"];
                readonly description: "Best matching ticket category. Sales enquiries use GENERAL.";
            };
            readonly phone: {
                readonly type: "string";
                readonly description: "Optional callback number if the user provided one.";
            };
        };
        readonly required: readonly ["subject", "summary", "intent"];
    };
}];
export declare function getZeepoAiOpsTools(): ToolUnion[];
/** FAB Live AI Support: catalog always; inventory only for logged-in team members. */
export declare function getZeepoAiSupportOpsTools(opts: {
    includeInventory: boolean;
}): ToolUnion[];
/** Drop checkout internals / wholesale fields before the model sees a tool result. */
export declare function stripZeepoAiOpsToolResultForModel(payload: unknown): unknown;
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
export declare function executeZeepoAiOpsTool(params: ExecuteZeepoAiOpsToolParams): Promise<unknown>;
