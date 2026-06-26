import { trpcMutation, trpcQuery } from "@/lib/domain-search/api.ts";

export const PLANLESS_PRODUCT_IDS = {
  domain_registration: "nisc-domains",
  domains: "nisc-domains",
  vps: "nisc-vps-hosting",
  vds: "nisc-vds-hosting",
  dedicated_servers: "nisc-dedicated-servers",
} as const;

export function resolveStorefrontProductId(
  serviceType: string,
  productIdFromUrl?: string,
): string {
  if (productIdFromUrl?.trim()) return productIdFromUrl.trim();
  const mapped = PLANLESS_PRODUCT_IDS[serviceType as keyof typeof PLANLESS_PRODUCT_IDS];
  if (mapped) return mapped;
  return productIdFromUrl ?? "";
}

export async function checkStorefrontEmail(email: string): Promise<boolean> {
  const res = await trpcQuery<{ exists: boolean }>("storefront.auth.checkEmail", { email });
  return res.exists;
}

export async function registerStorefrontCustomer(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  password: string;
  acceptedTermsAndConditions: true;
  planName?: string;
}): Promise<{ storefrontToken: string; teamSlug: string; displayName: string }> {
  return trpcMutation("storefront.auth.register", input);
}

export async function initiateStorefrontStkPush(input: {
  storefrontToken: string;
  phone: string;
  planId?: string;
  billingCycle: "MONTHLY" | "YEARLY";
  clientAmount: number;
}): Promise<{ checkoutRequestId: string; message: string }> {
  return trpcMutation("storefront.payment.initiateStkPush", input);
}

export async function pollStorefrontPaymentStatus(input: {
  storefrontToken: string;
  checkoutRequestId: string;
}): Promise<{ status: string; failureReason?: string }> {
  return trpcQuery("storefront.payment.pollPaymentStatus", input);
}

export async function queryStorefrontStkPush(input: {
  storefrontToken: string;
  checkoutRequestId: string;
}): Promise<{
  success: true;
  data: {
    resultCode: string;
    resultDesc?: string;
  };
}> {
  return trpcQuery("storefront.payment.queryStkPush", input);
}

export async function createStorefrontOrderFromPayment(input: {
  storefrontToken: string;
  checkoutRequestId: string;
  planId?: string;
  productId: string;
  billingCycle: "MONTHLY" | "YEARLY";
  primaryDomain?: string;
}): Promise<{ orderId: string; orderNumber: string; teamSlug: string }> {
  return trpcMutation("storefront.orders.createFromPayment", input);
}

/** Format phone to 254XXXXXXXXX for M-Pesa. */
export function formatMpesaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (!digits.startsWith("254")) digits = `254${digits}`;
  return digits;
}

export function generateAccountReference(): string {
  return `NISC${Date.now().toString().slice(-8)}`;
}
