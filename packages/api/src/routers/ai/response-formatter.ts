/**
 * Response formatting utilities for AI chat
 * 
 * These utilities help format function responses concisely,
 * extracting only relevant fields based on user intent.
 */

/**
 * Format array responses by extracting specific fields
 */
export function formatArrayResponse<T extends Record<string, any>>(
    items: T[],
    fields: (keyof T)[],
    options: {
        maxItems?: number;
        showCount?: boolean;
        separator?: string;
    } = {}
): string {
    const {
        maxItems = 5,
        showCount = true,
        separator = ', '
    } = options;

    if (!items || items.length === 0) {
        return 'No items found.';
    }

    const total = items.length;
    const displayItems = items.slice(0, maxItems);

    // Extract specified fields from each item
    const formatted = displayItems.map(item => {
        const values = fields.map(field => item[field]);
        return values.join(' - ');
    });

    let result = formatted.join(separator);

    if (showCount) {
        result = `Found ${total} item${total !== 1 ? 's' : ''}: ${result}`;
    }

    if (total > maxItems) {
        result += ` ... and ${total - maxItems} more`;
    }

    return result;
}

/**
 * Format object response by extracting specific fields
 */
export function formatObjectResponse<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
): string {
    if (!obj) {
        return 'No data found.';
    }

    const parts: string[] = [];
    for (const field of fields) {
        const value = obj[field];
        if (value !== undefined && value !== null) {
            parts.push(`${String(field)}: ${value}`);
        }
    }

    return parts.join(', ');
}

/**
 * Smart format - automatically determine best format based on response type
 */
export function smartFormat(
    data: any,
    context?: {
        userQuery?: string;
        functionName?: string;
    }
): string {
    // Handle null/undefined
    if (data === null || data === undefined) {
        return 'No data available.';
    }

    // Handle errors
    if (data.error) {
        return `Error: ${data.message || 'An error occurred'}`;
    }

    // Handle arrays
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return 'No items found.';
        }

        // Try to extract meaningful fields based on common patterns
        const firstItem = data[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
            // Common field patterns
            const nameField = 'name' in firstItem ? 'name' :
                'title' in firstItem ? 'title' :
                    'subject' in firstItem ? 'subject' :
                        'domainName' in firstItem ? 'domainName' : null;

            if (nameField) {
                return formatArrayResponse(data, [nameField as keyof typeof firstItem], {
                    maxItems: 5,
                    showCount: true
                });
            }
        }

        // Fallback: show count
        return `Found ${data.length} item${data.length !== 1 ? 's' : ''}.`;
    }

    // Handle objects with common patterns
    if (typeof data === 'object') {
        // Check for paginated response pattern
        if ('campaigns' in data && 'total' in data) {
            return smartFormat(data.campaigns, context);
        }
        if ('clients' in data && 'total' in data) {
            return smartFormat(data.clients, context);
        }
        if ('results' in data) {
            return smartFormat(data.results, context);
        }

        // Single object - extract key fields
        const keyFields = ['id', 'name', 'title', 'status', 'email'];
        const availableFields = keyFields.filter(field => field in data);

        if (availableFields.length > 0) {
            return formatObjectResponse(data, availableFields);
        }
    }

    // Fallback: JSON stringify with truncation
    const str = JSON.stringify(data);
    if (str.length > 200) {
        return str.substring(0, 200) + '... (truncated)';
    }
    return str;
}

/**
 * Format domain list
 */
export function formatDomains(domains: Array<{ domainName: string; expirationDate?: Date | string }>): string {
    if (!domains || domains.length === 0) {
        return 'No domains found.';
    }

    const names = domains.slice(0, 5).map(d => d.domainName);
    let result = `You have ${domains.length} domain${domains.length !== 1 ? 's' : ''}: ${names.join(', ')}`;

    if (domains.length > 5) {
        result += ` and ${domains.length - 5} more`;
    }

    return result;
}

/**
 * Format team list
 */
export function formatTeams(teams: Array<{ name: string; id: string }>): string {
    if (!teams || teams.length === 0) {
        return "You're not part of any teams.";
    }

    const names = teams.map(t => t.name);
    return `You're part of ${teams.length} team${teams.length !== 1 ? 's' : ''}: ${names.join(', ')}`;
}

/**
 * Format ticket list
 */
export function formatTickets(tickets: Array<{
    ticketNumber: string;
    subject: string;
    priority?: string;
    status?: string;
}>): string {
    if (!tickets || tickets.length === 0) {
        return 'No tickets found.';
    }

    const formatted = tickets.slice(0, 5).map(t => {
        let str = `${t.ticketNumber}`;
        if (t.priority) str += ` (${t.priority})`;
        return str;
    });

    let result = `You have ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}: ${formatted.join(', ')}`;

    if (tickets.length > 5) {
        result += ` and ${tickets.length - 5} more`;
    }

    return result;
}

/**
 * Format subscription list
 */
export function formatSubscriptions(subscriptions: Array<{ name: string; status: string }>): string {
    if (!subscriptions || subscriptions.length === 0) {
        return 'No subscriptions found.';
    }

    const active = subscriptions.filter(s => s.status.toLowerCase() === 'active');
    const names = subscriptions.slice(0, 3).map(s => `${s.name} (${s.status})`);

    let result = `You have ${subscriptions.length} subscription${subscriptions.length !== 1 ? 's' : ''}`;
    if (active.length > 0) {
        result += ` (${active.length} active)`;
    }
    result += `: ${names.join(', ')}`;

    if (subscriptions.length > 3) {
        result += ` and ${subscriptions.length - 3} more`;
    }

    return result;
}
