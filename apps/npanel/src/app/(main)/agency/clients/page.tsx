import { z } from "zod";

import { clientSchema } from "./_components/schema";
import { ClientsDataTable } from "./_components/clients-data-table";

// Import mock data
import clientsData from "./_components/clients-data.json";

export default function ClientsPage() {
  // Validate mock data with schema
  const validatedData = clientsData.map((client) => clientSchema.parse(client));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client accounts, view their activity, and handle their services.
        </p>
      </div>
      <ClientsDataTable data={validatedData} />
    </div>
  );
}
