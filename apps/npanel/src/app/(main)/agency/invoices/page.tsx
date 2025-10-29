import { z } from "zod";

import { invoiceSchema } from "./_components/schema";
import { InvoicesDataTable } from "./_components/invoices-data-table";

// Import mock data
import invoicesData from "./_components/invoices-data.json";

export default function InvoicesPage() {
  // Validate mock data with schema
  const validatedData = invoicesData.map((invoice) => invoiceSchema.parse(invoice));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          Manage your invoices, track payments, and handle billing operations.
        </p>
      </div>
      <InvoicesDataTable data={validatedData} />
    </div>
  );
}
