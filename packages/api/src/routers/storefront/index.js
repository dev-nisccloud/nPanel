/**
 * Storefront router  public landing page checkout.
 *
 * This namespace is ISOLATED from all dashboard routers by design.
 * Every procedure here is either:
 *   • publicProcedure   (no session required)
 *   • token-gated       (requires a valid storefrontToken issued at registration)
 *
 * No dashboard protectedProcedure is ever used here.
 * No role other than "CUSTOMER" can be created through this router.
 * Any security incident in this namespace is immediately identifiable
 * because it will never touch ordersRouter, invoicingRouter, teamsRouter, etc.
 */
import { router } from "../../trpc";
import { storefrontAuthRouter } from "./auth";
import { storefrontPaymentRouter } from "./payment";
import { storefrontOrdersRouter } from "./orders";
export const storefrontRouter = router({
    /** Email check + new customer registration. */
    auth: storefrontAuthRouter,
    /** M-Pesa STK Push initiation + payment status polling. */
    payment: storefrontPaymentRouter,
    /** Order creation + handoff to order processor after confirmed payment. */
    orders: storefrontOrdersRouter,
});
