"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CronJobsTable } from "./agency.cronjobs/_components/cronjobs-table";
import { cronJobs } from "./agency.cronjobs/_components/jobs";

export default function AgencyCronJobsIndexPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cronJobs;
    return cronJobs.filter((job) => {
      return (
        job.name.toLowerCase().includes(q) ||
        job.status.toLowerCase().includes(q) ||
        (job.description ? job.description.toLowerCase().includes(q) : false)
      );
    });
  }, [searchQuery]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Cron Jobs</h1>
          <p className="text-xs text-muted-foreground">
            Monitor scheduled tasks, view recent runs, and quickly spot failures.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, status, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <CronJobsTable
            data={filtered}
            searchQuery={searchQuery}
            onView={(key) => navigate(`/agency/cronjobs/${key}`)}
          />
        </div>
      </div>
    </div>
  );
}

