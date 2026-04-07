export declare const domainsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Link a domain to a team
     * Creates a domain record in the database and links it to a team
     */
    linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
            openProviderId: number;
            teamId: string;
            registrationDate: string | Date;
            openProviderPrice?: string | undefined;
            niscPrice?: string | undefined;
            activationDate?: string | Date | null | undefined;
            expirationDate?: string | Date | null | undefined;
            renewalDate?: string | Date | null | undefined;
            notes?: string | undefined;
        };
        output: {
            success: boolean;
            message: string;
            data: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get domain by ID.
     * For customers (non-agency), enforces that the domain is linked to a team
     * the user belongs to.
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    /**
     * Get domain by domain name (our DB Domain, if any)
     * Returns null if no Domain record exists for that name
     */
    getByDomainName: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domainName: string;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        } | null;
        meta: object;
    }>;
    /**
     * Get domains by team.
     * Verifies the caller has access to the team (member or agency) before returning domains.
     */
    getByTeam: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        }[];
        meta: object;
    }>;
    /**
     * Get domains by user
     */
    getByUser: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        }[];
        meta: object;
    }>;
    /**
     * Update domain notes
     */
    updateNotes: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            notes?: string | null | undefined;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    /**
     * Unlink domain from team
     */
    unlinkFromTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    /**
     * Update domain team link (link existing Domain to a team)
     * Use when the domain already exists in our DB.
     */
    updateTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            teamId: string;
            openProviderPrice?: string | undefined;
            niscPrice?: string | undefined;
            notes?: string | null | undefined;
        };
        output: {
            id: string;
            domainName: string;
            userId: string;
            teamId: string | null;
            openProviderId: number;
            activationDate: Date | null;
            expirationDate: Date | null;
            renewalDate: Date | null;
            registrationDate: Date;
            openProviderPrice: string | null;
            niscPrice: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
}>>;
