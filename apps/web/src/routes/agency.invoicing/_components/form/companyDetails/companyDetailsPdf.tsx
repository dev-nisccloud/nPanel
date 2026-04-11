"use client";

import * as React from "react";
import type { CompanyDetails } from "@/routes/agency.invoicing/types";
import { PdfCompanyDetailsBlock } from "@/lib/pdf/company-details-pdf-block";

export const CompanyDetailsPdf: React.FC<CompanyDetails> = (props) => (
  <PdfCompanyDetailsBlock {...props} />
);
