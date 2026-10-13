import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type EtimsFiscalFooterPreviewProps = {
	etimsFiscal: EtimsFiscalFields;
	onClick?: (step: string) => void;
	onRegenerateQr?: () => void;
	regeneratingQr?: boolean;
};

function display(value: string | null | undefined): string {
	const v = value?.trim();
	return v ? v : "—";
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<p className="break-words">
			<span className="font-semibold text-gray-700">{label}: </span>
			<span>{display(value)}</span>
		</p>
	);
}

export function EtimsFiscalFooterPreview({
	etimsFiscal,
	onClick,
	onRegenerateQr,
	regeneratingQr,
}: EtimsFiscalFooterPreviewProps) {
	const internal = etimsFiscal.intrlDataDashed ?? etimsFiscal.intrlData;
	const signature = etimsFiscal.rcptSignDashed ?? etimsFiscal.rcptSign;
	const qrValue = etimsFiscal.verificationUrl?.trim();
	const scuDateTime =
		etimsFiscal.sdcDateTimeDisplay?.trim() ||
		[etimsFiscal.scuDate, etimsFiscal.scuTime].filter(Boolean).join(" ");

	return (
		<div
			className="border-t border-gray-900 px-10 py-3 text-[10px] leading-relaxed text-gray-600 cursor-pointer relative group"
			onClick={() => onClick && onClick("5")}
		>
			{!!onClick && (
				<>
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
				</>
			)}
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-900">
						SCU Information
					</p>
					<Row label="Date" value={scuDateTime} />
					<Row label="Control Unit Number" value={etimsFiscal.sdcId} />
					<Row label="Invoice Number" value={etimsFiscal.cuInvoiceNo} />
					<Row label="Internal Data" value={internal} />
					<Row label="Receipt Signature" value={signature} />
				</div>
				{qrValue ? (
					<div className="flex shrink-0 flex-col items-center gap-1">
						<QRCodeSVG value={qrValue} size={64} />
						{onRegenerateQr ? (
							<button
								type="button"
								disabled={regeneratingQr}
								className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-50 disabled:opacity-60"
								onClick={(event) => {
									event.stopPropagation();
									event.preventDefault();
									onRegenerateQr();
								}}
							>
								{regeneratingQr ? "Regenerating…" : "Regenerate QR"}
							</button>
						) : null}
					</div>
				) : null}
			</div>
			<div className="mt-2 border-t border-dashed border-gray-300 pt-2">
				<p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-900">
					TIS Information
				</p>
				<Row label="Receipt Number" value={etimsFiscal.tisReceiptNumber} />
				<p>
					<span className="font-semibold text-gray-700">Date: </span>
					{display(etimsFiscal.tisDate)}
					{"    "}
					<span className="font-semibold text-gray-700">Time: </span>
					{display(etimsFiscal.tisTime)}
				</p>
			</div>
		</div>
	);
}
