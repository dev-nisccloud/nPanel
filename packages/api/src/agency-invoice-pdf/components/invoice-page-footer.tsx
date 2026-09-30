import React from "react";
import { View } from "@react-pdf/renderer";
import type { EtimsFiscalFields, PaymentDetails } from "../types";
import { EtimsFiscalFooterPdf } from "./etims-fiscal-footer-pdf";
import { FixedPaymentDetailsPdf } from "./fixed-payment-details-pdf";

type InvoicePageFooterProps = {
	fields: EtimsFiscalFields;
	qrCodeDataUrl?: string;
	paymentDetails?: PaymentDetails;
};

/** Payment details and SCU/TIS information, repeated at the bottom of every page. */
export function InvoicePageFooter({ fields, qrCodeDataUrl, paymentDetails }: InvoicePageFooterProps) {
	return (
		<View
			fixed
			style={{
				position: "absolute",
				bottom: 16,
				left: 40,
				right: 40,
			}}
		>
			<FixedPaymentDetailsPdf paymentDetails={paymentDetails} />
			<EtimsFiscalFooterPdf fields={fields} qrCodeDataUrl={qrCodeDataUrl} positioned={false} />
		</View>
	);
}
