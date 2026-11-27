import { useGetValue, useItemParams } from "@/routes/agency.quotations/create/hooks/useGetValue";
import type { Item } from "@/routes/agency.quotations/create/types";

export type ServiceOrderItem = Item & {
	serviceCategory?: string;
	primaryDomain?: string;
};

export const useData = () => {
	const yourEmail = useGetValue("yourEmail");
	const yourName = useGetValue("yourName");
	const yourAddress = useGetValue("yourAddress");
	const yourCity = useGetValue("yourCity");
	const yourState = useGetValue("yourState");
	const yourCountry = useGetValue("yourCountry");
	const yourLogo = useGetValue("yourLogo");
	const yourTaxId = useGetValue("yourTaxId");
	const yourZip = useGetValue("yourZip");
	const preparedBy = useGetValue("preparedBy");

	const email = useGetValue("email");
	const companyName = useGetValue("companyName");
	const companyAddress = useGetValue("companyAddress");
	const companyCity = useGetValue("companyCity");
	const companyState = useGetValue("companyState");
	const companyCountry = useGetValue("companyCountry");
	const companyTaxId = useGetValue("companyTaxId");
	const companyZip = useGetValue("companyZip");
	const contactPerson = useGetValue("contactPerson");
	const billingEmail = useGetValue("billingEmail");
	const phone = useGetValue("phone");

	const note = useGetValue("note");
	const discount = useGetValue("discount");
	const taxPercentage = useGetValue("taxPercentage");
	const items = useItemParams() as ServiceOrderItem[];

	const orderNumber = useGetValue("orderNo");
	const issueDate = useGetValue("issueDate");
	const validUntil = useGetValue("validUntil");
	const paymentTerms = useGetValue("paymentTerms");
	const clientSignatoryName = useGetValue("clientSignatoryName");
	const clientSignatoryTitle = useGetValue("clientSignatoryTitle");
	const clientSignatoryDate = useGetValue("clientSignatoryDate");
	const niscSignatoryName = useGetValue("niscSignatoryName");
	const niscSignatoryTitle = useGetValue("niscSignatoryTitle");
	const niscSignatoryDate = useGetValue("niscSignatoryDate");

	const currency = useGetValue("currency") || "KES";

	const yourDetails = {
		yourName,
		yourAddress,
		yourCity,
		yourState,
		yourCountry,
		yourLogo,
		yourEmail,
		yourTaxId,
		yourZip,
		preparedBy,
	};

	const companyDetails = {
		companyName,
		companyAddress,
		companyCity,
		companyState,
		companyCountry,
		companyTaxId,
		companyZip,
		email,
		contactPerson,
		billingEmail,
		phone,
	};

	const orderDetails = {
		note,
		discount,
		taxPercentage: taxPercentage ? Number(taxPercentage) : 16,
		items,
		currency,
	};

	const orderTerms = {
		orderNumber,
		issueDate,
		validUntil,
		paymentTerms,
		clientSignatoryName,
		clientSignatoryTitle,
		clientSignatoryDate,
		niscSignatoryName,
		niscSignatoryTitle,
		niscSignatoryDate,
	};

	return { yourDetails, companyDetails, orderDetails, orderTerms };
};
