/**
 * Zeepo AI Agent - internal tool registry.
 *
 * This module is the single place to register all Nisc Cloud internal API
 * wrappers that the agent can call. Adding a new internal tool:
 *   1. Create a new file in this directory with the implementation.
 *   2. Export it from here.
 *   3. Add its Zod schema to `agent-tools.ts`.
 *   4. Add a handler branch in `chat.ts`.
 *   5. Document when to call it in `prompts.ts`.
 */
export { agentCheckDomainAvailability, DEFAULT_DOMAIN_EXTENSIONS, type DomainCheckResult, type DomainCheckEntry, } from "./domains";
export { DEFAULT_DISPLAY_CURRENCY } from "./pricing";
export { agentGetWebHostingPlans, agentGetEmailHostingPlans, agentGetWordPressHostingPlans, type HostingPlansResult, type HostingPlanEntry, type HostingPlanFeatureRow, type HostingPlansToolName, } from "./hosting-plans";
export { agentGetVpsPlans, agentGetVdsPlans, agentGetDedicatedServerPlans, agentGetCloudPlans, type CloudPlansResult, type CloudPlanEntry, type CloudPlanKind, type CloudPlansToolName, } from "./cloud-plans";
export { agentGetCloudServers, type CloudServersResult, type CloudServerEntry, type CloudServerKind, } from "./cloud-servers";
export { agentGetDomainsPortfolio, type DomainsPortfolioResult, type PortfolioDomainEntry, type PortfolioDomainStatus, } from "./domains-portfolio";
export { agentGetDomainDetail, type DomainDetailResult, type DomainDetailDnsRecord, } from "./domain-detail";
export { agentGetHostingResources, agentGetHostingDetail, type HostingResourceEntry, type HostingResourcesResult, type HostingDetailResult, } from "./hosting-resources";
export { agentGetWordPressSites, type WordPressSitesResult, type WordPressSiteEntry, type WordPressSiteKind, } from "./wordpress-sites";
