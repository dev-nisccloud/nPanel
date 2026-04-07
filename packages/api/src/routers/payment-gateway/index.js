import { router } from "../../trpc";
import { mpesaRouter } from "./mpesa";
/**
 * Payment Gateway Router
 *
 * This router contains all payment gateway integrations.
 * Currently supports:
 * - M-Pesa (Kenya)
 *
 * Future gateways can be added here:
 * - Stripe
 * - PayPal
 * - Flutterwave
 * - etc.
 */
export const paymentGatewayRouter = router({
    mpesa: mpesaRouter,
});
