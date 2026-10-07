import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { formatCrmMoney } from "../crm-detail";
import { DealViewSheet } from "./deal-view-sheet";

type BoardDeal = {
  id: string;
  name: string;
  column: string;
  amount: string | null;
  currency: string;
  companyName: string | null;
  closeDate: string | Date | null;
};

type StageColumn = {
  id: string;
  name: string;
  color: string | null;
  probability: number | null;
};

function matchesDealSearch(deal: BoardDeal, query: string) {
  if (!query) return true;
  return (
    deal.name.toLowerCase().includes(query) ||
    (deal.companyName ?? "").toLowerCase().includes(query)
  );
}

export function DealsBoard({
  pipelineId,
  search,
}: {
  pipelineId: string;
  search: string;
}) {
  const utils = trpc.useUtils();
  const [items, setItems] = useState<BoardDeal[]>([]);
  const [viewingDealId, setViewingDealId] = useState<string | null>(null);
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const originStage = useRef<string | null>(null);
  const itemsRef = useRef<BoardDeal[]>([]);

  const commitItems = (next: BoardDeal[]) => {
    itemsRef.current = next;
    setItems(next);
  };

  const pipelinesQuery = trpc.crm.pipelines.list.useQuery({ page: 1, limit: 100 });
  const dealsQuery = trpc.crm.deals.list.useQuery({
    page: 1,
    limit: 100,
    pipelineId,
    search: search || undefined,
  });

  const pipeline = pipelinesQuery.data?.data?.find((item) => item.id === pipelineId);
  const columns: StageColumn[] = useMemo(
    () =>
      (pipeline?.stages ?? []).map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        probability: stage.probability,
      })),
    [pipeline],
  );

  useEffect(() => {
    const next = (dealsQuery.data?.data ?? []).map((deal) => ({
      id: deal.id,
      name: deal.name,
      column: deal.stageId,
      amount: deal.amount,
      currency: deal.currency,
      companyName: deal.company?.name ?? null,
      closeDate: deal.expectedCloseDate,
    }));
    commitItems(next);
  }, [dealsQuery.data]);

  const updateStage = trpc.crm.deals.update.useMutation({
    onSuccess: () => {
      utils.crm.deals.list.invalidate();
      utils.crm.deals.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move deal");
      dealsQuery.refetch();
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (event: DragStartEvent) => {
    const card = itemsRef.current.find((item) => item.id === event.active.id);
    originStage.current = card?.column ?? null;
  };

  const onDragEnd = (event: DragEndEvent) => {
    const dealId = String(event.active.id);
    const targetStage = itemsRef.current.find((item) => item.id === dealId)?.column;
    if (!targetStage || !originStage.current || targetStage === originStage.current) return;
    const stage = columns.find((column) => column.id === targetStage);
    updateStage.mutate({
      id: dealId,
      stageId: targetStage,
      probability: stage?.probability ?? undefined,
    });
  };

  if (pipelinesQuery.isLoading || dealsQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-full w-[260px] shrink-0" />
        ))}
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">This pipeline has no stages.</p>
    );
  }

  return (
    <div className="h-full min-h-0">
      <div className="-mx-4 h-full min-h-0 overflow-x-auto overflow-y-hidden px-4 md:mx-0 md:px-0">
        <KanbanProvider
          columns={columns}
          data={items}
          onDataChange={commitItems}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          sensors={sensors}
          className="flex h-full w-max items-stretch gap-3"
        >
          {(column) => {
            const query = (columnSearch[column.id] ?? "").trim().toLowerCase();
            const stageDeals = items.filter((item) => item.column === column.id);
            const visibleDeals = stageDeals.filter((deal) => matchesDealSearch(deal, query));
            const total = visibleDeals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
            return (
              <KanbanBoard
                id={column.id}
                key={column.id}
                className="h-full w-[min(80vw,280px)] shrink-0 bg-muted/40"
              >
                <KanbanHeader className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: column.color || "var(--muted-foreground)" }}
                    />
                    <span className="truncate text-sm font-medium">{column.name}</span>
                    <Badge variant="secondary" className="px-1.5 text-[10px]">
                      {visibleDeals.length}
                    </Badge>
                  </div>
                </KanbanHeader>
                <p className="shrink-0 border-b bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
                  {formatCrmMoney(total, visibleDeals[0]?.currency || stageDeals[0]?.currency || "KES")}
                </p>
                <div className="relative shrink-0 border-b bg-background px-2 py-2">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={columnSearch[column.id] ?? ""}
                    onChange={(event) =>
                      setColumnSearch((current) => ({
                        ...current,
                        [column.id]: event.target.value,
                      }))
                    }
                    placeholder="Search..."
                    className="h-8 bg-background pl-8 text-xs"
                  />
                </div>
                <div className="relative h-0 min-h-0 flex-1">
                  <KanbanCards
                    id={column.id}
                    className="h-full"
                    filter={(deal) => matchesDealSearch(deal as BoardDeal, query)}
                  >
                    {(deal: BoardDeal) => (
                      <KanbanCard key={deal.id} id={deal.id} name={deal.name} column={deal.column}>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => setViewingDealId(deal.id)}
                        >
                          <p className="text-sm font-semibold text-foreground">{deal.name}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {deal.companyName || "No company"}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-foreground">
                            {formatCrmMoney(deal.amount, deal.currency)}
                          </p>
                        </button>
                      </KanbanCard>
                    )}
                  </KanbanCards>
                  {visibleDeals.length === 0 ? (
                    <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-xs text-muted-foreground">
                      {query ? "No matching deals" : "No deals"}
                    </p>
                  ) : null}
                </div>
              </KanbanBoard>
            );
          }}
        </KanbanProvider>
      </div>

      <DealViewSheet
        dealId={viewingDealId}
        open={!!viewingDealId}
        onOpenChange={(open) => {
          if (!open) setViewingDealId(null);
        }}
      />
    </div>
  );
}
