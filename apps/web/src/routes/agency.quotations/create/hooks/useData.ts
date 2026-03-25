import { useGetValue, useItemParams } from "./useGetValue";

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

	const email = useGetValue("email");
	const companyName = useGetValue("companyName");
	const companyAddress = useGetValue("companyAddress");
	const companyCity = useGetValue("companyCity");
	const companyState = useGetValue("companyState");
	const companyCountry = useGetValue("companyCountry");
	const companyTaxId = useGetValue("companyTaxId");
	const companyZip = useGetValue("companyZip");

	const note = useGetValue("note");
	const discount = useGetValue("discount");
	const taxPercentage = useGetValue("taxPercentage");
	const items = useItemParams();

	const quotationNumber = useGetValue("quotationNo");
	const issueDate = useGetValue("issueDate");

	const currency = useGetValue("currency") || "KES";

	const quotationTerms = {
		quotationNumber,
		issueDate,
	};

	const quotationDetails = {
		note,
		discount,
		taxPercentage: taxPercentage ? Number(taxPercentage) : undefined,
		items,
		currency,
	};

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
	};

	return {
		companyDetails,
		yourDetails,
		quotationTerms,
		quotationDetails,
	};
};
