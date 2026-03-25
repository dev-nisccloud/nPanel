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

  const paymentMethod = useGetValue("paymentMethod", "bank");
  
  const bankName = useGetValue("bankName");
  const accountNumber = useGetValue("accountNumber");
  const accountName = useGetValue("accountName");
  const branchName = useGetValue("branchName");
  const branchCode = useGetValue("branchCode");
  const swiftCode = useGetValue("swiftCode");

  const mpesaPaybillNumber = useGetValue("mpesaPaybillNumber");
  const mpesaAccountNumber = useGetValue("mpesaAccountNumber");
  const mpesaInstructions = useGetValue("mpesaInstructions");

  const chequeDeliveryAddress = useGetValue("chequeDeliveryAddress");
  const chequeInstructions = useGetValue("chequeInstructions");

  const qrCodeValue = useGetValue("qrCodeValue");

  const invoiceNumber = useGetValue("invoiceNo");
  const issueDate = useGetValue("issueDate");
  const dueDate = useGetValue("dueDate");

  const currency = useGetValue("currency") || "KES";

  const invoiceTerms = {
    invoiceNumber,
    issueDate,
    dueDate,
  };

  const invoiceDetails = {
    note,
    discount,
    taxPercentage: taxPercentage ? Number(taxPercentage) : undefined,
    items,
    currency,
  };

  const paymentDetails = {
    paymentMethod: paymentMethod as "bank" | "mpesa" | "cheque",
    currency,
    qrCodeValue,
    // Bank transfer fields
    bankName,
    accountNumber,
    accountName,
    branchName,
    branchCode,
    swiftCode,
    // MPESA fields
    mpesaPaybillNumber,
    mpesaAccountNumber,
    mpesaInstructions,
    // Cheque fields
    chequeDeliveryAddress,
    chequeInstructions,
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
    paymentDetails,
    invoiceTerms,
    invoiceDetails,
  };
};
