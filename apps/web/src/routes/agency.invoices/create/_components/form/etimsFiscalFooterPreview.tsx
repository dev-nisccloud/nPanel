import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { getEtimsFiscalFooterFields } from "@npanel/api/lib/etims-fiscal-fields";

type EtimsFiscalFooterPreviewProps = {
	etimsFiscal: EtimsFiscalFields;
};

export function EtimsFiscalFooterPreview({ etimsFiscal }: EtimsFiscalFooterPreviewProps) {
	const rows = getEtimsFiscalFooterFields(etimsFiscal);

	return (
		<div className="border-t border-dashed px-10 py-3 text-[10px] leading-relaxed text-gray-600">
			{rows.length > 0 ? (
				<p className="break-words">
					{rows.map((row, index) => (
						<span key={row.label}>
							{index > 0 ? " | " : null}
							<span className="font-semibold text-gray-700">{row.label}: </span>
							<span>{row.value}</span>
						</span>
					))}
				</p>
			) : null}
			{etimsFiscal.verificationUrl ? (
				<p className="mt-1 break-all text-gray-500">{etimsFiscal.verificationUrl}</p>
			) : null}
		</div>
	);
}
