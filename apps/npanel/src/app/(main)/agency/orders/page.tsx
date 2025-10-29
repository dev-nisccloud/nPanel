import { z } from "zod";

import { orderSchema } from "./_components/schema";
import { OrdersDataTable } from "./_components/orders-data-table";

// Import mock data
import ordersData from "./_components/orders-data.json";

export default function OrdersPage() {
  // Validate mock data with schema
  const validatedData = ordersData.map((order) => orderSchema.parse(order));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage your orders, track their status, and handle payments.
        </p>
      </div>
      <OrdersDataTable data={validatedData} />
    </div>
  );
}
