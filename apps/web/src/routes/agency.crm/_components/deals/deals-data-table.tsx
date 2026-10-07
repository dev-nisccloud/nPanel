import { useState } from "react";
import { Link } from "react-router";
import {
  Briefcase,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TagChips, tagRefsFromAssignments } from "../record-tags";
import { DealFormSheet } from "./deal-form-sheet";
import { DealViewSheet } from "./deal-view-sheet";
import { DeleteDealDialog } from "./delete-deal-dialog";

interface DealsDataTableProps {
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  search: string;
  onSearch: (search: string) => void;
  pipelineId?: string;
  onPipelineIdChange: (pipelineId?: string) => void;
  stageId?: string;
  onStageIdChange: (stageId?: string) => void;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
  hideSearch?: boolean;
}

export function DealsDataTable({
  data,
  pagination,
  isLoading,
  search,
  onSearch,
  pipelineId,
  onPipelineIdChange,
  stageId,
  onStageIdChange,
  onPageChange,
  onRefetch,
  hideSearch = false,
}: DealsDataTableProps) {
  const [viewingDealId, setViewingDealId] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [deletingDeal, setDeletingDeal] = useState<any>(null);

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hideSearch ? null : (
        <div className="flex gap-2">
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Close Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No deals found. Create your first deal to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <button
                          type="button"
                          className="font-medium hover:underline"
                          onClick={() => setViewingDealId(deal.id)}
                        >
                          {deal.name}
                        </button>
                        <TagChips tags={tagRefsFromAssignments(deal.tags)} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.company ? (
                      <Link
                        to={`/agency/crm/companies/${deal.company.id}`}
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        <Building2 className="h-3 w-3" />
                        {deal.company.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.stage ? (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: deal.stage.color
                            ? `${deal.stage.color}20`
                            : undefined,
                          borderColor: deal.stage.color,
                        }}
                      >
                        {deal.stage.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(deal.amount != null ? Number(deal.amount) : null)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setViewingDealId(deal.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingDeal(deal)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <DealViewSheet
        dealId={viewingDealId}
        open={!!viewingDealId}
        onOpenChange={(open) => {
          if (!open) setViewingDealId(null);
        }}
      />

      {/* Edit Sheet */}
      {editingDeal && (
        <DealFormSheet
          open={!!editingDeal}
          onOpenChange={(open) => !open && setEditingDeal(null)}
          deal={editingDeal}
          onSuccess={() => {
            setEditingDeal(null);
            onRefetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingDeal && (
        <DeleteDealDialog
          open={!!deletingDeal}
          onOpenChange={(open) => !open && setDeletingDeal(null)}
          deal={deletingDeal}
          onSuccess={() => {
            setDeletingDeal(null);
            onRefetch();
          }}
        />
      )}
    </div>
  );
}
