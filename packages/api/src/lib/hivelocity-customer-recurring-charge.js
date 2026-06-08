/**
 * Customer-facing recurring charge for a VPS (margined display price).
 * Uses subscription agreedPrice when set; otherwise device billing + agency margins.
 */
export { resolveMarginedVpsRecurringCharge as resolveCustomerVpsRecurringCharge } from "./hivelocity-display-pricing";
