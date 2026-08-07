/**
 * Storefront order procedure.
 *
 * After M-Pesa payment is confirmed (status = "SUCCESS"), the landing page calls
 * createFromPayment which:
 *  1. Verifies the storefrontToken
 *  2. Confirms the payment transaction belongs to this user and is SUCCESS
 *  3. Creates the niscOrder + niscOrderItems in a DB transaction
 *  4. Calls enqueueNiscOrderProcessing  IDENTICAL handoff to the existing
 *     order processor (QStash → processNiscOrder).  Nothing changes here.
 *  5. Returns { orderId, orderNumber, teamSlug } so the landing page can
 *     redirect the user to nPanel.
 *
 * Idempotent: a duplicate call with the same checkoutRequestId returns the
 * existing orderId/orderNumber without creating a second order.
 */
export declare const storefrontOrdersRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a Nisc order from a confirmed M-Pesa payment on the landing page.
     *
     * The order processor handoff (enqueueNiscOrderProcessing) is identical to
     * the dashboard flow. No changes to the processor or QStash pipeline.
     */
    createFromPayment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            storefrontToken: string;
            checkoutRequestId: string;
            productId: string;
            planId?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
            primaryDomain?: string | undefined;
            cart?: {
                handoff?: string | undefined;
                main?: {
                    serviceType?: string | undefined;
                    planId?: string | undefined;
                    productId?: string | undefined;
                    planName?: string | undefined;
                    productName?: string | undefined;
                    billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                    locationName?: string | undefined;
                    bundleDomains?: string[] | undefined;
                    transferProvider?: "kenic" | "openprovider" | undefined;
                    providerPriceAmount?: number | undefined;
                    providerPriceCurrency?: string | undefined;
                    customerPriceAmount?: number | undefined;
                    customerPriceCurrency?: string | undefined;
                } | undefined;
                transferAuthCode?: string | undefined;
                upsellDomain?: {
                    domain: string;
                    isExisting?: boolean | undefined;
                    isTransfer?: boolean | undefined;
                    provider?: "kenic" | "openprovider" | undefined;
                } | undefined;
                upsellHosting?: {
                    serviceType: "web_hosting" | "wordpress_hosting" | "email_hosting";
                    planId: string;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";
                } | undefined;
                hivelocity?: {
                    hivelocityProductId: number;
                    locationName: string;
                    selectedOsId: string;
                    selectedOptionIds: number[];
                } | undefined;
            } | undefined;
        };
        output: {
            orderId: string;
            orderNumber: string;
            teamSlug: string;
        };
        meta: object;
    }>;
}>>;
