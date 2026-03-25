import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import type { QuotationTerms } from "@/routes/agency.quotations/create/types";

export const QuotationTermsPreview: React.FC<
	QuotationTerms & { onClick?: (step: string) => void }
> = ({ quotationNumber, issueDate, onClick }) => {
	const formatDate = (date?: string | Date) => {
		if (!date) return "";
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return format(dateObj, "do MMM yyyy");
	};

	return (
		<div
			className="border-b py-4 px-10 border-dashed group cursor-pointer relative"
			onClick={() => onClick?.("4")}
		>
			{!!onClick && (
				<>
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
					<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
				</>
			)}
			<div className="flex justify-between items-start">
				<div className="flex-1" />
				<div className="flex flex-1 flex-col items-end space-y-3 text-right">
					<p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
							Quotation No
						</span>
						<span className="font-semibold text-gray-700">{quotationNumber || "-"}</span>
					</p>
					<p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
							Issued
						</span>
						<span className="font-semibold text-gray-700">{formatDate(issueDate) || "-"}</span>
					</p>
				</div>
			</div>
		</div>
	);
};

