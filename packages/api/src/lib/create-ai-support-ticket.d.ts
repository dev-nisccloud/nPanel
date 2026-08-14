/**
 * Opens a human support ticket from a Zeepo AI or Live AI Support chat.
 * Ownership is always the calling user (guest cookie user or Better Auth user).
 */
export declare const AI_SUPPORT_TICKET_CATEGORIES: readonly ["TECHNICAL", "BILLING", "FEATURE", "BUG", "ACCOUNT", "GENERAL", "HOSTING", "DOMAIN", "EMAIL", "WORDPRESS"];
export type AiSupportTicketCategory = (typeof AI_SUPPORT_TICKET_CATEGORIES)[number];
export type AiSupportTicketIntent = "support" | "sales";
export type AiSupportTicketSurface = "support_fab" | "zeepo_ai";
export declare function buildSessionTranscriptSummary(sessionId: string): Promise<string>;
export declare function createAiSupportTicket(params: {
    userId: string;
    userRole?: string | null;
    teamId: string | null;
    sessionId: string;
    surface: AiSupportTicketSurface;
    subject: string;
    summary: string;
    intent: AiSupportTicketIntent;
    category?: string | null;
    phone?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}): Promise<{
    _tool: "create_support_ticket";
    ok: true;
    alreadyOpen: boolean;
    ticketId: string;
    ticketNumber: string;
    intent: AiSupportTicketIntent;
    subject: string;
}>;
