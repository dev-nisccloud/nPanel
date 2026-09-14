import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { QRCodeSVG } from "qrcode.react";

type EtimsFiscalFooterPreviewProps = {
	etimsFiscal: EtimsFiscalFields;
};

function Row({ label, value }: { label: string; value: string }) {
	return (
		<p className="break-words">
			<span className="font-semibold text-gray-700">{label}: </span>
			<span>{value}</span>
		</p>
	);
}

export function EtimsFiscalFooterPreview({ etimsFiscal }: EtimsFiscalFooterPreviewProps) {
	const internal = etimsFiscal.intrlDataDashed ?? etimsFiscal.intrlData;
	const signature = etimsFiscal.rcptSignDashed ?? etimsFiscal.rcptSign;
	const qrValue = etimsFiscal.verificationUrl?.trim();

	return (
		<div className="border-t border-gray-900 px-10 py-3 text-[10px] leading-relaxed text-gray-600">
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-900">
						SCU Information
					</p>
					{etimsFiscal.scuDate || etimsFiscal.scuTime ? (
						<p>
							{etimsFiscal.scuDate ? (
								<>
									<span className="font-semibold text-gray-700">Date: </span>
									{etimsFiscal.scuDate}
									{"    "}
								</>
							) : null}
							{etimsFiscal.scuTime ? (
								<>
									<span className="font-semibold text-gray-700">Time: </span>
									{etimsFiscal.scuTime}
								</>
							) : null}
						</p>
					) : etimsFiscal.sdcDateTimeDisplay ? (
						<Row label="Date" value={etimsFiscal.sdcDateTimeDisplay} />
					) : null}
					{etimsFiscal.sdcId ? <Row label="CU ID" value={etimsFiscal.sdcId} /> : null}
					{etimsFiscal.cuInvoiceNo ? (
						<Row label="Invoice No." value={etimsFiscal.cuInvoiceNo} />
					) : null}
					{internal ? (
						<div className="mt-1">
							<p className="font-semibold text-gray-700">Internal Data:</p>
							<p className="break-all">{internal}</p>
						</div>
					) : null}
					{signature ? (
						<div className="mt-1">
							<p className="font-semibold text-gray-700">Receipt Signature:</p>
							<p className="break-all">{signature}</p>
						</div>
					) : null}
				</div>
				{qrValue ? (
					<div className="shrink-0">
						<QRCodeSVG value={qrValue} size={64} />
					</div>
				) : null}
			</div>
			<div className="mt-2 border-t border-dashed border-gray-300 pt-2">
				<p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-900">
					TIS Information
				</p>
				{etimsFiscal.tisReceiptNumber ? (
					<Row label="Receipt Number" value={etimsFiscal.tisReceiptNumber} />
				) : null}
				{etimsFiscal.tisDate || etimsFiscal.tisTime ? (
					<p>
						{etimsFiscal.tisDate ? (
							<>
								<span className="font-semibold text-gray-700">Date: </span>
								{etimsFiscal.tisDate}
								{"    "}
							</>
						) : null}
						{etimsFiscal.tisTime ? (
							<>
								<span className="font-semibold text-gray-700">Time: </span>
								{etimsFiscal.tisTime}
							</>
						) : null}
					</p>
				) : null}
			</div>
		</div>
	);
}
