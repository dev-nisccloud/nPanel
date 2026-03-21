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
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Teams</h1>
          <p className="text-xs text-muted-foreground">
            Manage your agency teams, view their status, and handle team operations.
          </p>
        </div>
      </div>
      <TeamsDataTable data={validatedData} />
    </div>
  );
}
