import {
  NPANEL_APP,
  trpcCredentialedMutation,
  trpcCredentialedQuery,
  trpcMutation,
  trpcQuery,
} from "@/lib/domain-search/api.ts";

export const PLANLESS_PRODUCT_IDS = {
  domain_registration: "nisc-domains",
  domains: "nisc-domains",
  vps: "nisc-vps-hosting",
  vds: "nisc-vds-hosting",
  dedicated_servers: "nisc-dedicated-servers",
} as const;

export type StorefrontBillingCycle =
  | "MONTHLY"
  | "YEARLY"
  | "BIENNIALLY"
  | "TRIENNIALLY"
  | "QUADRENNIALLY";

export type StorefrontCartQuoteRequest = {
  handoff?: string;
  transferAuthCode?: string;
  main?: {
    serviceType?: string;
    planId?: string;
    productId?: string;
    planName?: string;
    productName?: string;
    billingCycle?: StorefrontBillingCycle;
    locationName?: string;
    bundleDomains?: string[];
  };
  upsellDomain?: {
    domain: string;
    isExisting?: boolean;
    isTransfer?: boolean;
    provider?: "kenic" | "openprovider";
  };
  upsellHosting?: {
    serviceType: "web_hosting" | "wordpress_hosting" | "email_hosting";
    planId: string;
    billingCycle: StorefrontBillingCycle;
  };
  hivelocity?: {
    hivelocityProductId: number;
    locationName: string;
    selectedOsId: string;
    selectedOptionIds: number[];
  };
};

export type StorefrontCartQuote = {
  currency: string;
  monthlyPrice: number;
  yearlyPrice: number;
  planName: string;
  productName: string;
  serviceType: string;
  planId?: string;
  productId?: string;
  locationName?: string;
  billingCycle: StorefrontBillingCycle;
  subtotal: number;
  taxAmount: number;
  total: number;
};

export function resolveStorefrontProductId(
  serviceType: string,
  productIdFromUrl?: string,
): string {
  if (productIdFromUrl?.trim()) return productIdFromUrl.trim();
  const mapped = PLANLESS_PRODUCT_IDS[serviceType as keyof typeof PLANLESS_PRODUCT_IDS];
  if (mapped) return mapped;
  return productIdFromUrl ?? "";
}

export async function createStorefrontHandoff(input: {
  serviceType: string;
  planId?: string;
  productId?: string;
  planName?: string;
  productName?: string;
  billingCycle?: StorefrontBillingCycle;
  locationName?: string;
  bundleDomains?: string[];
  transferProvider?: "kenic" | "openprovider";
  providerPriceAmount?: number;
  providerPriceCurrency?: string;
  customerPriceAmount?: number;
  customerPriceCurrency?: string;
}): Promise<{ handoff: string }> {
  return trpcMutation("storefront.cart.createHandoff", input);
}

export async function fetchStorefrontCartQuote(
  input: StorefrontCartQuoteRequest,
): Promise<StorefrontCartQuote> {
  return trpcQuery<StorefrontCartQuote>("storefront.cart.quote", input);
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

export type StorefrontCheckoutTeam = {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
};

export type StorefrontProfilePrefill = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export type StorefrontCheckoutIdentity =
  | { authenticated: false }
  | {
      authenticated: true;
      user: { id: string; name: string };
      profile: {
        complete: boolean;
        missing: Array<
          | "firstName"
          | "lastName"
          | "phone"
          | "address"
          | "city"
          | "country"
          | "postalCode"
        >;
        prefill: StorefrontProfilePrefill;
      };
      teams: StorefrontCheckoutTeam[];
    };

/** One request: session probe + profile completeness + organizations. */
export async function fetchStorefrontCheckoutIdentity(): Promise<StorefrontCheckoutIdentity> {
  try {
    return await trpcCredentialedQuery<StorefrontCheckoutIdentity>(
      "storefront.auth.checkoutIdentity",
    );
  } catch {
    return { authenticated: false };
  }
}

export async function completeStorefrontProfile(
  input: StorefrontProfilePrefill,
): Promise<{
  complete: boolean;
  missing: string[];
  displayName: string;
  prefill: StorefrontProfilePrefill;
}> {
  return trpcCredentialedMutation("storefront.auth.completeProfile", input);
}

export async function createStorefrontOrganization(name: string): Promise<StorefrontCheckoutTeam> {
  return trpcCredentialedMutation("storefront.auth.createOrganization", { name });
}

export async function issueStorefrontCheckoutToken(teamId: string): Promise<{
  storefrontToken: string;
  teamSlug: string;
}> {
  return trpcCredentialedMutation("storefront.auth.issueCheckoutToken", { teamId });
}

/** nPanel login URL that returns to the landing cart after sign-in. */
export function buildStorefrontSignInUrl(returnTo?: string): string {
  let target = returnTo?.trim() || "";
  if (!target && typeof window !== "undefined") {
    const url = new URL(window.location.href);
    // Open the details step after login so the signed-in checkout UI shows immediately.
    url.searchParams.set("resume", "1");
    target = url.toString();
    // Landing-origin backup: survives refresh after `resume` is stripped from the URL.
    const handoff = url.searchParams.get("h")?.trim();
    if (handoff) persistStorefrontCartResume(handoff);
  }
  const params = new URLSearchParams({ redirect: target });
  return `${NPANEL_APP}/auth/login?${params.toString()}`;
}

const STOREFRONT_CART_RESUME_KEY = "npanel_storefront_cart_resume";

export function persistStorefrontCartResume(handoff: string): void {
  if (typeof window === "undefined") return;
  const value = handoff.trim();
  if (!value) return;
  try {
    sessionStorage.setItem(
      STOREFRONT_CART_RESUME_KEY,
      JSON.stringify({ handoff: value, at: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function peekStorefrontCartResume(handoff: string): boolean {
  if (typeof window === "undefined") return false;
  const expected = handoff.trim();
  if (!expected) return false;
  try {
    const raw = sessionStorage.getItem(STOREFRONT_CART_RESUME_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { handoff?: string; at?: number };
    if (parsed.handoff !== expected) return false;
    // Expire after 2 hours so stale carts don't auto-jump forever.
    if (typeof parsed.at === "number" && Date.now() - parsed.at > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STOREFRONT_CART_RESUME_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearStorefrontCartResume(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STOREFRONT_CART_RESUME_KEY);
  } catch {
    // ignore
  }
}

export async function initiateStorefrontStkPush(input: {
  storefrontToken: string;
  phone: string;
  cart: StorefrontCartQuoteRequest;
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
  billingCycle: StorefrontBillingCycle;
  primaryDomain?: string;
  cart?: StorefrontCartQuoteRequest;
}): Promise<{ orderId: string; orderNumber: string; teamSlug: string }> {
  return trpcMutation("storefront.orders.createFromPayment", input);
}

export function formatMpesaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (!digits.startsWith("254")) digits = `254${digits}`;
  return digits;
}

export function generateAccountReference(): string {
  return `NISC${Date.now().toString().slice(-8)}`;
}
