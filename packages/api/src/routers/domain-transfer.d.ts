/** User-facing transfer check status for the UI. */
export type TransferStatus = "available" | "locked" | "ready" | "pending_check" | "reserved" | "unavailable";
type DomainTransferRequestListItem = {
    id: string;
    domainName: string;
    provider: string;
    status: string;
    providerPriceAmount: string | null;
    providerPriceCurrency: string | null;
    customerPriceAmount: string | null;
    customerPriceCurrency: string | null;
    submittedToProviderAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
};
export declare const domainTransferRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Check if a domain can be transferred and get the price.
     * Identifies TLD first (same as domain search): KENIC for .ke/.co.ke/etc., OpenProvider for others.
     * KENIC: EPP domain check only Ã¢â€ â€™ available or ready + price.
     * OpenProvider: RDAP for status (available / locked / ready), then transfer pricing when ready.
     */
    checkTransfer: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
        };
        output: {
            transferStatus: TransferStatus;
            transferrable: boolean;
            provider: "kenic" | "openprovider" | null;
            domain: string;
            name: string;
            extension: string;
            price: number | null;
            currency: string | null;
            createPrice: number | null;
            createCurrency: string | null;
            error: string | null;
        } | {
            transferStatus: "unavailable";
            transferrable: boolean;
            provider: null;
            domain: string;
            name: null;
            extension: null;
            price: null;
            currency: null;
            error: string;
        };
        meta: object;
    }>;
    /**
     * Initiate domain transfer: save to DB (DomainTransferRequest) then send to provider (KENIC or OpenProvider).
     * EPP/auth code is required. Caller must be authenticated.
     */
    initiateTransfer: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
            authCode: string;
            provider: "kenic" | "openprovider";
            domainName: string;
            extension: string;
            providerPriceAmount?: string | undefined;
            providerPriceCurrency?: string | undefined;
            customerPriceAmount?: string | undefined;
            customerPriceCurrency?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            success: boolean;
            id: `${string}-${string}-${string}-${string}-${string}`;
            pending: boolean;
            domain: string;
        } | {
            success: boolean;
            id: `${string}-${string}-${string}-${string}-${string}`;
            domain: string;
            pending?: undefined;
        };
        meta: object;
    }>;
    /**
     * List domain transfer requests for the agency (all requests; auth required).
     * Does not return authCode for security.
     */
    listTransferRequests: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: DomainTransferRequestListItem[];
        meta: object;
    }>;
}>>;
export {};
