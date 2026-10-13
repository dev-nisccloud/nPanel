/** Commission / ad account context for COMMISSION pricing plan items */
export type ItemCommissionContext = {
	metaAdsAccountId: string;
	metaAdsAccountName?: string;
	metaAdsCampaignId: string;
	metaAdsCampaignName: string;
	dateRangeSince: string;
	dateRangeUntil: string;
	adSpend: number;
	commissionRatePercent: number;
};

export type Item = {
	id?: string;
	itemDescription: string;
	amount?: number;
	qty?: number;
	/** When the line was picked from the product catalog */
	productId?: string;
	/** When the product has plans, the selected plan id */
	productPlanId?: string;
	/** When the selected plan uses COMMISSION pricing */
	commissionContext?: ItemCommissionContext;
	/** Optional billing cycle for the item */
	billingCycle?: string;
	/** Product KRA tax band (A–E). Shown with the tax table rate label. */
	etimsTaxTyCd?: string;
};

/** Persist catalog selection alongside billing cycle so edit restores the same source. */
export function quotationLineItemMetadata(item: Item): Record<string, unknown> | null {
	const metadata: Record<string, unknown> = {};
	if (item.billingCycle && item.billingCycle !== "__unset__") {
		metadata.billingCycle = item.billingCycle;
	}
	if (item.productId) metadata.productId = item.productId;
	if (item.productPlanId) metadata.productPlanId = item.productPlanId;
	if (item.commissionContext) metadata.commissionContext = item.commissionContext;
	if (item.etimsTaxTyCd) metadata.etimsTaxTyCd = item.etimsTaxTyCd;
	if (item.productId) metadata.productId = item.productId;
	return Object.keys(metadata).length > 0 ? metadata : null;
}

export type YourDetails = {
	yourEmail?: string;
	yourName?: string;
	yourAddress?: string;
	yourCity?: string;
	yourState?: string;
	yourCountry?: string;
	yourLogo?: string;
	yourTaxId?: string;
	yourZip?: string;
};

export type CompanyDetails = {
	email?: string;
	companyName?: string;
	companyAddress?: string;
	companyCity?: string;
	companyState?: string;
	companyCountry?: string;
	companyTaxId?: string;
	companyZip?: string;
};

export type QuotationItemDetails = {
	note?: string;
	discount?: string;
	taxPercentage?: number;
	items: Item[];
	currency?: string;
};

/** Quotation terms: no due date, no payment method */
export type QuotationTerms = {
	quotationNumber?: string;
	issueDate?: string | Date;
};
