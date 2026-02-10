"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateReportSheet } from "./_components/create-report-sheet";
import { EditReportSheet } from "./_components/edit-report-sheet";
import { SeoReportViewDialog } from "./_components/seo-report-view-dialog";
import { SeoReportsTable } from "./_components/seo-reports-table";

export default function SeoReportsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingReportId, setEditingReportId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMonth, setFilterMonth] = React.useState("");
  const [filterYear, setFilterYear] = React.useState("");
  const [filterTeamId, setFilterTeamId] = React.useState("");
  const utils = trpc.useUtils();

  const handleRefresh = React.useCallback(() => {
    utils.seoReports.list.invalidate();
  }, [utils]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">SEO Reports</h1>
          <p className="text-xs text-muted-foreground">
            Create and view monthly SEO reports. Enter metrics manually to build dashboards.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by report name, website, or period…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create report
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SeoReportsTable
            searchQuery={searchQuery}
            filterMonth={filterMonth}
            filterYear={filterYear}
            filterTeamId={filterTeamId}
            onFilterMonth={setFilterMonth}
            onFilterYear={setFilterYear}
            onFilterTeamId={setFilterTeamId}
            onRowClick={setSelectedId}
            onEditClick={setEditingReportId}
          />
        </div>
      </div>

      <CreateReportSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => { }}
      />

      <EditReportSheet
        open={!!editingReportId}
        onOpenChange={(open) => !open && setEditingReportId(null)}
        reportId={editingReportId}
        onSuccess={() => setEditingReportId(null)}
      />

      <SeoReportViewDialog
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        reportId={selectedId}
      />
    </div>
  );
}
