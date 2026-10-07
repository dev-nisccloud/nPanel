import { useEffect, useState } from "react";
import { Columns3, LayoutList, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { DealsDataTable } from "./agency.crm/_components/deals/deals-data-table";
import { DealsBoard } from "./agency.crm/_components/deals/deals-board";
import { DealFormSheet } from "./agency.crm/_components/deals/deal-form-sheet";

type DealsView = "list" | "board";

export default function DealsListRoute() {
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<DealsView>("list");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pipelineId, setPipelineId] = useState<string>();
  const [stageId, setStageId] = useState<string>();

  const pipelinesQuery = trpc.crm.pipelines.list.useQuery({ page: 1, limit: 100 });
  const pipelines = pipelinesQuery.data?.data ?? [];
  const pipelineItems = pipelines.map((pipeline) => ({
    id: pipeline.id,
    label: pipeline.name,
  }));
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === pipelineId);

  useEffect(() => {
    if (pipelineId || pipelines.length === 0) return;
    const next = pipelines.find((pipeline) => pipeline.isDefault) ?? pipelines[0];
    if (next) setPipelineId(next.id);
  }, [pipelineId, pipelines]);

  const { data, isLoading, refetch } = trpc.crm.deals.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    pipelineId,
    stageId,
  });

  const isBoard = view === "board";

  return (
    <div
      className={
        isBoard
          ? "@container/main flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col overflow-hidden px-4 py-4 md:h-[calc(100dvh-6rem)] md:px-6 md:py-6 lg:px-8"
          : "@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8"
      }
    >
      <div className={isBoard ? "mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col" : "mx-auto w-full max-w-7xl"}>
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Deals</h1>
            <p className="text-xs text-muted-foreground">
              {selectedPipeline
                ? `${selectedPipeline.name} · switch between the list and the board`
                : "Manage sales opportunities and track deals through your pipeline"}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </div>

        <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full sm:max-w-xs"
            />
            <div className="w-full sm:w-64">
              <ComboboxDropdown
                placeholder="Select pipeline"
                searchPlaceholder="Search pipelines..."
                items={pipelineItems}
                selectedItem={pipelineItems.find((item) => item.id === pipelineId)}
                onSelect={(item) => {
                  setPipelineId(item.id);
                  setStageId(undefined);
                  setPage(1);
                }}
                emptyResults="No pipelines found"
                disabled={pipelinesQuery.isLoading}
                className="w-full"
              />
            </div>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(value) => {
              if (value === "list" || value === "board") setView(value);
            }}
          >
            <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5 px-3">
              <LayoutList className="h-4 w-4" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board view" className="gap-1.5 px-3">
              <Columns3 className="h-4 w-4" />
              Board
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className={isBoard ? "mt-4 min-h-0 flex-1" : "mt-4"}>
          {view === "board" && pipelineId ? (
            <DealsBoard pipelineId={pipelineId} search={search} />
          ) : (
            <DealsDataTable
              data={data?.data ?? []}
              pagination={data?.pagination}
              isLoading={isLoading || pipelinesQuery.isLoading}
              search={search}
              onSearch={setSearch}
              pipelineId={pipelineId}
              onPipelineIdChange={setPipelineId}
              stageId={stageId}
              onStageIdChange={setStageId}
              onPageChange={setPage}
              onRefetch={refetch}
              hideSearch
            />
          )}
        </div>

        <DealFormSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => {
            setCreateOpen(false);
            refetch();
          }}
        />
      </div>
    </div>
  );
}
