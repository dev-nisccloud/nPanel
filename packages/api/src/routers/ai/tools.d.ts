/**
 * Tool to get the system navigation structure.
 */
export declare const getSystemNavigationTool: () => {
    description: string;
    parameters: {
        type: string;
        properties: {
            role: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
    execute: ({ role }: {
        role: "AGENCY" | "CUSTOMER";
    }) => Promise<{
        group: string;
        items: {
            title: string;
            url: string;
            subItems: any[];
        }[];
    }[]>;
};
/**
 * Tool to get the current user's profile and team context.
 */
export declare const getUserContextTool: (userId: string) => {
    description: string;
    parameters: {
        type: string;
        properties: {};
        required: never[];
    };
    execute: (_input: {}) => Promise<{
        teamMemberships: {
            team: {
                id: string;
                name: string;
                slug: string;
            };
        }[];
        id: string;
        name: string;
        email: string;
        role: string;
    } | null>;
};
/**
 * Tool to search for user-specific data
 */
export declare const getActiveServicesTool: (userId: string) => {
    description: string;
    parameters: {
        type: string;
        properties: {
            teamId: {
                type: string;
                description: string;
            };
        };
    };
    execute: ({ teamId }: {
        teamId?: string;
    }) => Promise<{
        error: string;
        hosting?: undefined;
        domains?: undefined;
        wordpress?: undefined;
    } | {
        hosting: {
            id: string;
            pleskName: string | null;
            status: string;
            expiryDate: Date | null;
        }[];
        domains: {
            id: string;
            domainName: string;
            expirationDate: Date | null;
        }[];
        wordpress: {
            id: string;
            url: string | null;
            status: string | undefined;
        }[];
        error?: undefined;
    }>;
};
/**
 * Tool to escalate the conversation to a human agent.
 */
export declare const escalateToHumanTool: (userId: string) => {
    description: string;
    parameters: {
        type: string;
        properties: {
            subject: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                default: string;
            };
            teamId: {
                type: string;
            };
        };
        required: string[];
    };
    execute: ({ subject, summary, priority, teamId, }: {
        subject: string;
        summary: string;
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        teamId?: string;
    }) => Promise<{
        success: boolean;
        ticketId: string;
        ticketNumber: string;
        message: string;
    }>;
};
