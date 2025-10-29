import { z } from "zod";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { teamSchema } from "./_components/schema";
import { TeamsDataTable } from "./_components/teams-data-table";

// Import mock data
import teamsData from "./_components/teams-data.json";

export default function TeamsPage() {
  // Validate mock data with schema
  const validatedData = teamsData.map((team) => teamSchema.parse(team));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your agency teams, view their status, and handle team operations.
            </p>
          </div>
        </div>
      </div>
      <TeamsDataTable data={validatedData} />
    </div>
  );
}
