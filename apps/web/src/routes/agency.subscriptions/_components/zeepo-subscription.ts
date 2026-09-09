import { ZEEPO_AI_PRODUCT_ID } from "@npanel/api/lib/zeepo-ai-billing";
import { ZEEPO_AI_AGENT_PRODUCT_ID } from "@npanel/api/lib/zeepo-agent-billing";

export function isZeepoAiProduct(productId: string | null | undefined): boolean {
	return productId === ZEEPO_AI_PRODUCT_ID;
}

/** Zeepo AI / Agent wallets are billed as ONE_TIME but are not delivery-tracked jobs. */
export function isZeepoTokenProduct(productId: string | null | undefined): boolean {
	return productId === ZEEPO_AI_AGENT_PRODUCT_ID || productId === ZEEPO_AI_PRODUCT_ID;
}

export function isProgressTrackedOneTime(
	billingCycle: string | null | undefined,
	productId?: string | null,
): boolean {
	return billingCycle === "ONE_TIME" && !isZeepoTokenProduct(productId);
}

