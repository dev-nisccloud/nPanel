/**
 * Live AI Support (FAB) is a Zeepo AI surface: same engine, no wallet,
 * no generation, no extended thinking. Identity is guest-cookie or session.
 */
export declare const ZEEPO_AI_SUPPORT_FAB_SURFACE = "support_fab";
export declare const ZEEPO_AI_SUPPORT_CATALOG_TOOL_NAMES: readonly ["check_domain_availability", "get_web_hosting_plans", "get_email_hosting_plans", "get_wordpress_hosting_plans", "get_vps_plans", "get_vds_plans", "get_dedicated_server_plans", "create_support_ticket"];
export declare const ZEEPO_AI_SUPPORT_INVENTORY_TOOL_NAMES: readonly ["get_user_session", "get_domains_portfolio", "get_domain_detail", "get_cloud_servers", "get_hosting_resources", "get_hosting_detail", "get_wordpress_sites"];
export declare function isZeepoAiSupportFabSession(metadata: unknown): boolean;
export declare function isZeepoAiSupportGenerationTool(name: string): boolean;
export declare function isZeepoAiSupportInventoryTool(name: string): boolean;
export declare function isZeepoAiSupportGuestRole(role: string | null | undefined): boolean;
