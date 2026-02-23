export type Item = {
	id?: string;
	itemDescription: string;
	amount?: number;
	qty?: number;
};

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
