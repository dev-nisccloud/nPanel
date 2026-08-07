import { type TransferStatus } from "../lib/domain-transfer-check";
export type { TransferStatus };
type TransferDirection = "incoming" | "outgoing";
type DomainTransferRequestListItem = {
    id: string;
    domainName: string;
    provider: string;
    status: string;
    direction: TransferDirection;
    providerPriceAmount: string | null;
    providerPriceCurrency: string | null;
    customerPriceAmount: string | null;
    customerPriceCurrency: string | null;
    submittedToProviderAt: Date | null;
    niscOrderId: string | null;
    niscOrderNumber: string | null;
    niscOrderStatus: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        id: string;
        name: string;
        email: string;
    } | null;
};
/** Statuses that may still change while the user watches the transfer requests list. */
export declare const ACTIVE_DOMAIN_TRANSFER_REQUEST_STATUSES: readonly ["AWAITING_PAYMENT", "PENDING", "SUBMITTED_TO_PROVIDER"];
/** Terminal outcomes - transfer requests in these statuses cannot be deleted. */
export declare const NON_DELETABLE_DOMAIN_TRANSFER_REQUEST_STATUSES: readonly ["COMPLETED", "FAILED"];
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
        output: import("../lib/domain-transfer-check").CheckTransferResult;
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
     * Create a transfer request when the user proceeds to checkout (before payment).
     * Updated to PENDING when payment succeeds and linked to the Nisc order; processor updates further.
     */
    createCheckoutRequest: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
            authCode: string;
            provider: "kenic" | "openprovider";
            providerPriceAmount?: string | undefined;
            providerPriceCurrency?: string | undefined;
            customerPriceAmount?: string | undefined;
            customerPriceCurrency?: string | undefined;
            teamId?: string | undefined;
            createdForUserId?: string | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            domainName: string;
            status: "AWAITING_PAYMENT";
        };
        meta: object;
    }>;
    /**
     * Resume checkout for a transfer request awaiting payment (returns EPP code for buy-now only).
     */
    getCheckoutResumeContext: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            authCode: string;
            provider: "kenic" | "openprovider";
            price: number;
            currency: string;
            teamId: string | null;
        };
        meta: object;
    }>;
    /**
     * Delete a transfer request (agency only). Not allowed for completed or failed requests.
     */
    deleteTransferRequest: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: true;
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
