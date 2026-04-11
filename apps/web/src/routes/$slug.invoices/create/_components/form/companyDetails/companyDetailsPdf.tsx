import React from "react";
import type { CompanyDetails } from "@/routes/agency.invoices/create/types";
import { PdfCompanyDetailsBlock } from "@/lib/pdf/company-details-pdf-block";

export const CompanyDetailsPdf: React.FC<CompanyDetails & { label?: string }> = (props) => (
  <PdfCompanyDetailsBlock {...props} />
);
