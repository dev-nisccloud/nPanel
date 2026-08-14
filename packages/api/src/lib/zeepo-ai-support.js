/**
 * Live AI Support (FAB) is a Zeepo AI surface: same engine, no wallet,
 * no generation, no extended thinking. Identity is guest-cookie or session.
 */
export const ZEEPO_AI_SUPPORT_FAB_SURFACE = "support_fab";
export const ZEEPO_AI_SUPPORT_CATALOG_TOOL_NAMES = [
    "check_domain_availability",
    "get_web_hosting_plans",
    "get_email_hosting_plans",
    "get_wordpress_hosting_plans",
    "get_vps_plans",
    "get_vds_plans",
    "get_dedicated_server_plans",
    "create_support_ticket",
];
export const ZEEPO_AI_SUPPORT_INVENTORY_TOOL_NAMES = [
    "get_user_session",
    "get_domains_portfolio",
    "get_domain_detail",
    "get_cloud_servers",
    "get_hosting_resources",
    "get_hosting_detail",
    "get_wordpress_sites",
];
const GENERATION_TOOL_NAMES = new Set([
    "generate_images",
    "create_document",
    "create_presentation",
    "create_image_presentation",
    "ask_clarifying_questions",
]);
const INVENTORY_TOOL_NAMES = new Set(ZEEPO_AI_SUPPORT_INVENTORY_TOOL_NAMES);
export function isZeepoAiSupportFabSession(metadata) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return false;
    return metadata.surface === ZEEPO_AI_SUPPORT_FAB_SURFACE;
}
export function isZeepoAiSupportGenerationTool(name) {
    return GENERATION_TOOL_NAMES.has(name);
}
export function isZeepoAiSupportInventoryTool(name) {
    return INVENTORY_TOOL_NAMES.has(name);
}
export function isZeepoAiSupportGuestRole(role) {
    return (role ?? "").toUpperCase() === "GUEST";
}
