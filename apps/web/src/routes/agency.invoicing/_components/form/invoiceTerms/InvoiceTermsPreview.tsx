import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import type { InvoiceTerms } from "@/routes/agency.invoicing/types";

export const InvoiceTermsPreview: React.FC<
  InvoiceTerms & { onClick?: (step: string) => void }
> = ({ invoiceNumber, issueDate, dueDate, onClick }) => {
  const formatDate = (date?: string | Date) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd-MM-yyyy");
  };

  return (
    <div
      className="border-b py-4 px-10 border-dashed group cursor-pointer relative"
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
      <div className="flex justify-between items-start">
        <div className="flex-1" /> {/* Spacer for left side */}
        <div className="flex flex-1 flex-col items-end space-y-3 text-right">
          <p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Invoice No
            </span>
            <span className="font-semibold text-gray-700">
              {invoiceNumber || "-"}
            </span>
          </p>
          <p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Issued
            </span>
            <span className="font-semibold text-gray-700">
              {formatDate(issueDate) || "-"}
            </span>
          </p>
          <p className="flex items-center justify-end gap-2 text-xs text-neutral-500 whitespace-nowrap">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Due Date
            </span>
            <span className="font-semibold text-gray-700">
              {formatDate(dueDate) || "-"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

