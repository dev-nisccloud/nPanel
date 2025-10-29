import { z } from "zod";

import { userSchema } from "./_components/schema";
import { UsersDataTable } from "./_components/users-data-table";

// Import mock data
import usersData from "./_components/users-data.json";

export default function ManageUsersPage() {
  // Validate mock data with schema
  const validatedData = usersData.map((user) => userSchema.parse(user));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions across your agency.
        </p>
      </div>
      <UsersDataTable data={validatedData} />
    </div>
  );
}
