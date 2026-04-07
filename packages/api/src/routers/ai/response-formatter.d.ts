/**
 * Response formatting utilities for AI chat
 *
 * These utilities help format function responses concisely,
 * extracting only relevant fields based on user intent.
 */
/**
 * Format array responses by extracting specific fields
 */
export declare function formatArrayResponse<T extends Record<string, any>>(items: T[], fields: (keyof T)[], options?: {
    maxItems?: number;
    showCount?: boolean;
    separator?: string;
}): string;
/**
 * Format object response by extracting specific fields
 */
export declare function formatObjectResponse<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): string;
/**
 * Smart format - automatically determine best format based on response type
 */
export declare function smartFormat(data: any, context?: {
    userQuery?: string;
    functionName?: string;
}): string;
/**
 * Format domain list
 */
export declare function formatDomains(domains: Array<{
    domainName: string;
    expirationDate?: Date | string;
}>): string;
/**
 * Format team list
 */
export declare function formatTeams(teams: Array<{
    name: string;
    id: string;
}>): string;
/**
 * Format ticket list
 */
export declare function formatTickets(tickets: Array<{
    ticketNumber: string;
    subject: string;
    priority?: string;
    status?: string;
}>): string;
/**
 * Format subscription list
 */
export declare function formatSubscriptions(subscriptions: Array<{
    name: string;
    status: string;
}>): string;
