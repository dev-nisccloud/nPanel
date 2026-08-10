import { router } from "../../trpc";
import { mpesaRouter } from "./mpesa";
import { jengaRouter } from "./jenga";
/**
 * Payment Gateway Router
 *
 * This router contains all payment gateway integrations.
 * Currently supports:
 * - M-Pesa (Kenya)  STK Push
 * - Jenga  hosted card checkout
 *
 * Future gateways can be added here:
 * - Stripe
 * - PayPal
 * - Flutterwave
 * - etc.
 */
export const paymentGatewayRouter = router({
    mpesa: mpesaRouter,
    jenga: jengaRouter,
});
