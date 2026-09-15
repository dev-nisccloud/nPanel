import { useFormContext } from "react-hook-form";
import {
	buildEtimsFiscalFieldsFromManual,
	type EtimsFiscalFields,
} from "@npanel/api/lib/etims-fiscal-fields";

export function useInvoiceEtimsFiscalPreview(): EtimsFiscalFields {
	const { watch } = useFormContext();
	const invoiceNo = watch("invoiceNo");
	const issueDate = watch("issueDate");
	const items = watch("items") as unknown[] | undefined;
	const yourTaxId = watch("yourTaxId");
	const scuSdcId = watch("scuSdcId");
	const scuDate = watch("scuDate");
	const scuTime = watch("scuTime");
	const scuCurRcptNo = watch("scuCurRcptNo");
	const scuTotRcptNo = watch("scuTotRcptNo");
	const scuIntrlData = watch("scuIntrlData");
	const scuRcptSign = watch("scuRcptSign");
	const isCreditNote = Boolean(watch("originalCuInvoiceNo"));

	return buildEtimsFiscalFieldsFromManual(
		{
			sdcId: scuSdcId,
			sdcDate,
			sdcTime,
			curRcptNo: scuCurRcptNo,
			totRcptNo: scuTotRcptNo,
			intrlData: scuIntrlData,
			rcptSign: scuRcptSign,
			tin: yourTaxId,
			bhfId: "00",
		},
		{
			isCreditNote,
			tisReceiptNumber: invoiceNo || null,
			tisIssuedAt: issueDate || null,
			itemCount: Array.isArray(items) ? items.length : 0,
		},
	);
}
