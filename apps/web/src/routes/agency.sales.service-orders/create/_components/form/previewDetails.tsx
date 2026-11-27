import { CompanyDetailsPreview } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsPreview";
import { InvoiceDetailsPreview } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsPreview";
import { InvoiceHeaderPreview } from "@/routes/agency.invoices/create/_components/form/header/invoiceHeaderPreview";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { useData } from "../../hooks/useData";

type PreviewData = ReturnType<typeof useData>;

const corners = (
	<>
		<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
		<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
		<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
		<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
	</>
);

function formatDate(date?: string | Date) {
	if (!date) return "";
	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "";
	return format(dateObj, "do MMM yyyy");
}

export const ServiceOrderPreviewDetails = ({
	yourDetails,
	companyDetails,
	orderDetails,
	orderTerms,
	onClick,
}: PreviewData & { onClick?: (step: string) => void }) => (
	<div className="overflow-x-auto overflow-y-visible">
		<div className="w-[595px] min-h-[842px] bg-white rounded-2xl border border-dashed justify-center items-center">
			<InvoiceHeaderPreview
				yourEmail={yourDetails.yourEmail}
				yourName={yourDetails.yourName}
				yourAddress={yourDetails.yourAddress}
				yourCity={yourDetails.yourCity}
				yourState={yourDetails.yourState}
				yourCountry={yourDetails.yourCountry}
				yourLogo={yourDetails.yourLogo}
				yourTaxId={yourDetails.yourTaxId}
				yourZip={yourDetails.yourZip}
				onClick={onClick}
				title="Service Order"
			/>
			{yourDetails.preparedBy ? (
				<p className="px-10 pb-3 text-right text-xs text-neutral-500/80">Prepared by: {yourDetails.preparedBy}</p>
			) : null}
			<div className="border-b grid grid-cols-2 justify-between border-dashed">
				<div
					className="py-4 px-10 border-r border-dashed cursor-pointer relative group"
					onClick={() => onClick?.("2")}
				>
					{!!onClick && corners}
					<CompanyDetailsPreview
						email={companyDetails.email}
						companyName={companyDetails.companyName}
						companyAddress={companyDetails.companyAddress}
						companyCity={companyDetails.companyCity}
						companyState={companyDetails.companyState}
						companyCountry={companyDetails.companyCountry}
						companyTaxId={companyDetails.companyTaxId}
						companyZip={companyDetails.companyZip}
						label="Client"
					/>
					<div className="text-xs text-neutral-500/80">
						{companyDetails.contactPerson ? <p>{companyDetails.contactPerson}</p> : null}
						{companyDetails.phone ? <p>{companyDetails.phone}</p> : null}
						{companyDetails.billingEmail ? <p>{companyDetails.billingEmail}</p> : null}
					</div>
				</div>
				<div
					className="py-4 px-10 border-dashed group cursor-pointer relative"
					onClick={() => onClick?.("4")}
				>
					{!!onClick && corners}
					<div className="flex justify-between items-start">
						<div className="flex-1" />
						<div className="flex flex-1 flex-col items-end space-y-3 text-right">
							<p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
								<span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Order No</span>
								<span className="font-semibold text-gray-700">{orderTerms.orderNumber || "-"}</span>
							</p>
							<p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
								<span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Issued</span>
								<span className="font-semibold text-gray-700">{formatDate(orderTerms.issueDate) || "-"}</span>
							</p>
							<p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
								<span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Valid until</span>
								<span className="font-semibold text-gray-700">{formatDate(orderTerms.validUntil) || "-"}</span>
							</p>
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col justify-between">
				<div className="border-b justify-between border-dashed">
					<InvoiceDetailsPreview
						{...orderDetails}
						onClick={onClick}
						items={orderDetails.items.map((item) => ({
							...item,
							itemDescription: [item.serviceCategory, item.itemDescription, item.primaryDomain]
								.filter(Boolean)
								.join("\n"),
						}))}
					/>
				</div>
			</div>
			{(orderTerms.paymentTerms || orderTerms.clientSignatoryName || orderTerms.niscSignatoryName) && (
				<div
					className="grid grid-cols-2 border-dashed cursor-pointer relative group"
					onClick={() => onClick?.("4")}
				>
					{!!onClick && corners}
					<div className="px-10 py-4 text-xs text-neutral-500/80">
						<p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 pb-2">Payment terms</p>
						<p>{orderTerms.paymentTerms || "-"}</p>
					</div>
					<div className="px-10 py-4 text-xs text-neutral-500/80">
						<p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 pb-2">Authorization</p>
						<p>{orderTerms.clientSignatoryName}</p>
						<p>{orderTerms.clientSignatoryTitle}</p>
						<p>{formatDate(orderTerms.clientSignatoryDate)}</p>
						<p className="mt-2">{orderTerms.niscSignatoryName}</p>
						<p>{orderTerms.niscSignatoryTitle}</p>
						<p>{formatDate(orderTerms.niscSignatoryDate)}</p>
					</div>
				</div>
			)}
		</div>
	</div>
);
