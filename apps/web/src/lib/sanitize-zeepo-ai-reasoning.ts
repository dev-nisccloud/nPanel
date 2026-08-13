/**
 * Redact proprietary / internal details from Zeepo AI "thought" text before UI display.
 * Defense in depth  prompts also forbid this, but models still leak tool names occasionally.
 */

const KNOWN_TOOL_NAMES = [
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
  "ask_clarifying_questions",
  "create_document",
  "create_presentation",
  "web_search",
  "web_fetch",
] as const;

const TOOL_NAME_ALT = KNOWN_TOOL_NAMES.map((n) =>
  n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");

/** snake_case / kebab-case identifiers that look like internal tool names */
const GENERIC_TOOL_ID =
  /\b(?:get|check|create|ask|list|run|fetch|search|update|delete)_[a-z0-9]+(?:_[a-z0-9]+){0,6}\b/gi;

export function sanitizeZeepoAiReasoning(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = raw;

  // Exact known tool ids
  if (TOOL_NAME_ALT) {
    text = text.replace(new RegExp(`\\b(?:${TOOL_NAME_ALT})\\b`, "gi"), "a live lookup");
  }

  // Generic internal tool-style identifiers
  text = text.replace(GENERIC_TOOL_ID, "a live lookup");

  // Common narration patterns
  text = text
    .replace(/\b(?:calling|invoking|using|running)\s+(?:the\s+)?(?:tool|function|API)\b/gi, "checking")
    .replace(/\b(?:tool|function)\s+call(?:s|ed|ing)?\b/gi, "check")
    .replace(/\bI(?:'ll| will)?\s+(?:call|invoke|use)\s+(?:the\s+)?(?:tool|function)\b/gi, "I'll look this up")
    .replace(/\bsystem\s+prompt\b/gi, "instructions")
    .replace(/\b(?:developer|hidden)\s+prompt\b/gi, "instructions")
    .replace(/\bprompt\s+injection\b/gi, "unsafe instruction")
    .replace(/\bHivelocity\b/gi, "Nisc Cloud")
    .replace(/\bPlesk\b/gi, "Nisc Cloud")
    .replace(/\bWP Toolkit\b/gi, "WordPress")
    .replace(/\bour provider\b/gi, "Nisc Cloud")
    .replace(/\bthe provider\b/gi, "Nisc Cloud")
    .replace(/\bupstream vendor\b/gi, "Nisc Cloud")
    .replace(/```[\s\S]*?```/g, "[redacted]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
