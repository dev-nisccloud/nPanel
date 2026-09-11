/**
 * Nisc order processor branch for renewing an existing subscription.
 * Registrar/host APIs are called here; local dates are always updated after success.
 */
import { eq } from "@npanel/db";
import { XMLParser } from "fast-xml-parser";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { isKenicDomain } from "./epp/kenic-tlds";
import { renewKenicDomain } from "./kenic-nisc";
import { niscLog } from "./nisc-order-logger";
import { sendPleskXmlRequest } from "./plesk/xml-client";
import { renewOpenProviderDomain } from "./openprovider-nisc";
import {
	applyLocalSubscriptionRenewal,
	computeRenewalExpiry,
	renewalPeriodYears,
	resolveRenewalBillingCycle,
} from "./nisc-subscription-renewal-apply";

const PLESK_SERVICE_TYPES = new Set([
	"web_hosting",
	"email_hosting",
	"wordpress_hosting",
	"website_hosting",
]);

const DOMAIN_SERVICE_TYPES = new Set(["domain_registration", "domain_transfer", "domains"]);

export const NISC_ORDER_RENEWAL_DESCRIPTION = "renewal";

type RenewalItemMeta = {
	existingSubscriptionId?: unknown;
};

export function isRenewalOrderItem(item: {
	description: string | null;
	metadata: unknown;
}): boolean {
	if (item.description?.trim().toLowerCase() === NISC_ORDER_RENEWAL_DESCRIPTION) {
		return true;
	}
	const meta = parseItemMeta(item.metadata);
	return typeof meta.existingSubscriptionId === "string" && Boolean(meta.existingSubscriptionId.trim());
}

function parseItemMeta(metadata: unknown): RenewalItemMeta {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
	return metadata as RenewalItemMeta;
}

function parseProviderDate(value: string | null | undefined): Date | null {
	if (!value?.trim()) return null;
	const d = new Date(value.trim());
	return Number.isNaN(d.getTime()) ? null : d;
}

function resolvePleskWebspaceId(sub: {
	pleskFilterId: string | null;
	serviceRefs: unknown;
}): number | null {
	const fromFilter = Number.parseInt(sub.pleskFilterId ?? "", 10);
	if (Number.isFinite(fromFilter) && fromFilter > 0) return fromFilter;
	if (!sub.serviceRefs || typeof sub.serviceRefs !== "object" || Array.isArray(sub.serviceRefs)) {
		return null;
	}
	const refs = sub.serviceRefs as Record<string, unknown>;
	const fromRefs = Number.parseInt(String(refs.pleskSubscriptionId ?? ""), 10);
	if (Number.isFinite(fromRefs) && fromRefs > 0) return fromRefs;
	return null;
}

/**
 * Plesk expiration is a limit named `expiration` (UNIX timestamp).
 * @see https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-subscriptions/subscription-settings/limits-permissions-and-hosting-settings/limits.39975/
 */
async function renewPleskWebspace(params: {
	webspaceId: number;
	expiry: Date;
	orderId: string;
	orderItemId: string;
}): Promise<unknown> {
	const unix = Math.floor(params.expiry.getTime() / 1000);
	const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <set>
      <filter><id>${params.webspaceId}</id></filter>
      <values>
        <gen_setup><status>0</status></gen_setup>
        <limits>
          <limit>
            <name>expiration</name>
            <value>${unix}</value>
          </limit>
        </limits>
      </values>
    </set>
  </webspace>
</packet>`;
	const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
	if (isHostUnreachable) throw new Error("Plesk host is unreachable");
	if (isAuthError) throw new Error("Invalid Plesk credentials");
	if (!xml?.trim()) throw new Error("Empty response from Plesk server");

	const parser = new XMLParser({ ignoreAttributes: false });
	const parsed = parser.parse(xml) as Record<string, unknown>;
	void niscLog("processor_api_raw_response", {
		niscOrderId: params.orderId,
		orderItemId: params.orderItemId,
		provider: "plesk",
		call: "webspace.set expiration",
		rawResponse: parsed,
	});

	const packet = parsed.packet as Record<string, unknown> | undefined;
	const setNode = (packet?.webspace as { set?: { result?: unknown } } | undefined)?.set;
	const rawResults = setNode?.result;
	const results = rawResults === undefined ? [] : Array.isArray(rawResults) ? rawResults : [rawResults];
	for (const result of results) {
		const entry = result as { status?: string; errcode?: number; errtext?: string };
		if (entry.status === "error") {
			throw new Error(`Plesk API Error ${entry.errcode}: ${entry.errtext ?? "Unknown error"}`);
		}
	}
	return parsed;
}

export async function processNiscOrderRenewalItem(params: {
	order: { id: string; createdBy: string | null; currency: string };
	item: {
		id: string;
		productId: string;
		billingCycle: string | null;
		itemPrice: string;
		description: string | null;
		metadata: unknown;
		product: { name: string; serviceType: string };
	};
	serviceType: string;
}): Promise<{ subscriptionId: string; rawResponse: unknown }> {
	const meta = parseItemMeta(params.item.metadata);
	const subscriptionId =
		typeof meta.existingSubscriptionId === "string" ? meta.existingSubscriptionId.trim() : "";
	if (!subscriptionId) {
		throw new Error("Renewal order item is missing metadata.existingSubscriptionId.");
	}

	const [sub] = await db
		.select({
			id: niscClientSubscription.id,
			name: niscClientSubscription.name,
			billingCycle: niscClientSubscription.billingCycle,
			agreedPrice: niscClientSubscription.agreedPrice,
			agreedCurrency: niscClientSubscription.agreedCurrency,
			expiryDate: niscClientSubscription.expiryDate,
			nextRenewalDate: niscClientSubscription.nextRenewalDate,
			primaryDomain: niscClientSubscription.primaryDomain,
			openProviderId: niscClientSubscription.openProviderId,
			pleskFilterId: niscClientSubscription.pleskFilterId,
			serviceRefs: niscClientSubscription.serviceRefs,
			status: niscClientSubscription.status,
			productName: niscProduct.name,
			serviceType: niscProduct.serviceType,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(eq(niscClientSubscription.id, subscriptionId))
		.limit(1);

	if (!sub) {
		throw new Error(`Subscription ${subscriptionId} was not found for renewal.`);
	}

	const billingCycle = resolveRenewalBillingCycle({
		serviceType: sub.serviceType,
		productName: sub.productName,
		billingCycle: params.item.billingCycle ?? sub.billingCycle,
	});
	const periodYears = renewalPeriodYears(billingCycle);
	const fallbackExpiry = computeRenewalExpiry({
		currentExpiry: sub.expiryDate ?? sub.nextRenewalDate,
		billingCycle,
		serviceType: sub.serviceType,
		productName: sub.productName,
	});

	const resolvedService = params.serviceType || sub.serviceType;
	const domainName = sub.primaryDomain?.trim() || sub.name?.trim() || null;
	const isDomain = DOMAIN_SERVICE_TYPES.has(resolvedService) || DOMAIN_SERVICE_TYPES.has(sub.serviceType);
	let providerExpiry: Date | null = null;
	let rawResponse: unknown = { local: true };
	let discoveredOpenProviderId: number | null = null;

	await niscLog("processor_item_branch", {
		niscOrderId: params.order.id,
		orderItemId: params.item.id,
		branch: "renewal",
		serviceType: resolvedService,
		subscriptionId: sub.id,
	});

	if (isDomain && domainName && isKenicDomain(domainName)) {
		const kenic = await renewKenicDomain({
			domainName,
			periodYears,
			orderId: params.order.id,
			orderItemId: params.item.id,
		});
		rawResponse = kenic.rawResponse;
		providerExpiry = parseProviderDate(kenic.exDate);
	} else if (isDomain) {
		const op = await renewOpenProviderDomain({
			openProviderId: sub.openProviderId,
			domainName,
			periodYears,
			orderId: params.order.id,
			orderItemId: params.item.id,
		});
		rawResponse = op.rawResponse;
		providerExpiry = parseProviderDate(op.expirationDate) ?? parseProviderDate(op.renewalDate);
		discoveredOpenProviderId = op.openProviderId;
	} else if (PLESK_SERVICE_TYPES.has(resolvedService) || PLESK_SERVICE_TYPES.has(sub.serviceType)) {
		const webspaceId = resolvePleskWebspaceId(sub);
		if (!webspaceId) {
			throw new Error(
				"Plesk webspace id is missing on this subscription; cannot extend hosting expiry at Plesk.",
			);
		}
		rawResponse = await renewPleskWebspace({
			webspaceId,
			expiry: fallbackExpiry,
			orderId: params.order.id,
			orderItemId: params.item.id,
		});
	}

	const newExpiry = providerExpiry ?? fallbackExpiry;

	if (discoveredOpenProviderId && discoveredOpenProviderId !== sub.openProviderId) {
		await db
			.update(niscClientSubscription)
			.set({ openProviderId: discoveredOpenProviderId, updatedAt: new Date() })
			.where(eq(niscClientSubscription.id, sub.id));
	}

	await applyLocalSubscriptionRenewal({
		subscriptionId: sub.id,
		newExpiryDate: newExpiry,
		billingCycle,
		renewalPrice: params.item.itemPrice || sub.agreedPrice,
		renewalCurrency: sub.agreedCurrency ?? params.order.currency,
		orderId: params.order.id,
		renewedBy: params.order.createdBy,
	});

	return { subscriptionId: sub.id, rawResponse };
}
