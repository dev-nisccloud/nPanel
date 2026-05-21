"use client";

import * as React from "react";
import type { CompanyDetails } from "../types";
import { PdfCompanyDetailsBlock } from "../company-details-pdf-block";

export const CompanyDetailsPdf: React.FC<CompanyDetails> = (props) => (
  <PdfCompanyDetailsBlock {...props} />
);
