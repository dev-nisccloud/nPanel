import { useFormContext } from "react-hook-form";
import {
	buildEtimsFiscalFieldsFromManual,
	type EtimsFiscalFields,
} from "@npanel/api/lib/etims-fiscal-fields";
import { trpc } from "@/utils/trpc";

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
	const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery(undefined, {
		retry: false,
		throwOnError: false,
		enabled: typeof window === "undefined" ? false : window.location.pathname.startsWith("/agency"),
	});
	const cfg = (etimsConfig as { config?: { kraPin?: string; branchId?: string; isSandbox?: boolean; sdcId?: string | null } } | undefined)
		?.config;

	return buildEtimsFiscalFieldsFromManual(
		{
			sdcId: scuSdcId || cfg?.sdcId,
			sdcDate: scuDate,
			sdcTime: scuTime,
			curRcptNo: scuCurRcptNo,
			totRcptNo: scuTotRcptNo,
			intrlData: scuIntrlData,
			rcptSign: scuRcptSign,
			tin: yourTaxId || cfg?.kraPin,
			bhfId: cfg?.branchId || "00",
			isSandbox: cfg?.isSandbox,
		},
		{
			isCreditNote,
			tisReceiptNumber: invoiceNo || null,
			tisIssuedAt: issueDate || null,
			itemCount: Array.isArray(items) ? items.length : 0,
		},
	);
}
