/**
 * Storefront router  public landing page checkout.
 *
 * This namespace is ISOLATED from all dashboard routers by design.
 * Every procedure here is either:
 *   • publicProcedure   (no session required)
 *   • token-gated       (requires a valid storefrontToken issued at registration
 *                        or via session-backed issueCheckoutToken)
 *   • optional-session  (checkoutIdentity / issueCheckoutToken only; LANDING_PAGE_ORIGINS gated)
 *
 * No dashboard protectedProcedure is ever used here.
 * No role other than "CUSTOMER" can be created through this router.
 * Any security incident in this namespace is immediately identifiable
 * because it will never touch ordersRouter, invoicingRouter, teamsRouter, etc.
 */
import { router } from "../../trpc";
import { storefrontAuthRouter } from "./auth";
import { storefrontCartRouter } from "./cart";
import { storefrontPaymentRouter } from "./payment";
import { storefrontOrdersRouter } from "./orders";
export const storefrontRouter = router({
    /** Email check + new customer registration. */
    auth: storefrontAuthRouter,
    /** Authoritative cart pricing (never trust URL amounts). */
    cart: storefrontCartRouter,
    /** M-Pesa STK Push initiation + payment status polling. */
    payment: storefrontPaymentRouter,
    /** Order creation + handoff to order processor after confirmed payment. */
    orders: storefrontOrdersRouter,
});
