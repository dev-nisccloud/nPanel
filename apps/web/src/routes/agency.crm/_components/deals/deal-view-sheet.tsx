import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { trpc } from "@/utils/trpc";
import {
  CrmActiveBadge,
  displayText,
  formatCrmDate,
  formatCrmMoney,
} from "../crm-detail";
import { RecordActivities, RecordNotes, RecordTasks } from "../record-activity";
import { RecordCustomFields } from "../record-custom-fields";
import { RecordTags, tagRefsFromAssignments } from "../record-tags";
import { DealFormSheet } from "./deal-form-sheet";
import { DeleteDealDialog } from "./delete-deal-dialog";

function SheetField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="truncate text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

export function DealViewSheet({
  dealId,
  open,
  onOpenChange,
}: {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: deal, isLoading } = trpc.crm.deals.get.useQuery(
    { id: dealId ?? "" },
    { enabled: open && !!dealId },
  );

  const contactName =
    deal?.primaryContact?.fullName ||
    [deal?.primaryContact?.firstName, deal?.primaryContact?.lastName].filter(Boolean).join(" ");
  const outcome = deal?.isClosed ? (deal.isWon ? "Won" : "Lost") : "Open";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{deal?.name ?? "Deal"}</SheetTitle>
            <SheetDescription>
              {[deal?.stage?.name, deal?.company?.name].filter(Boolean).join(" · ") || "Deal details"}
            </SheetDescription>
          </SheetHeader>

          {isLoading || !deal ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-lg border">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Amount">{formatCrmMoney(deal.amount, deal.currency)}</SheetField>
                  <SheetField label="Expected revenue">
                    {formatCrmMoney(deal.expectedRevenue, deal.currency)}
                  </SheetField>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Stage">
                    {deal.stage ? (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={
                          deal.stage.color
                            ? {
                                backgroundColor: `${deal.stage.color}20`,
                                borderColor: deal.stage.color,
                                color: deal.stage.color,
                              }
                            : undefined
                        }
                      >
                        {deal.stage.name}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </SheetField>
                  <SheetField label="Pipeline">{displayText(deal.pipeline?.name)}</SheetField>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Probability">
                    {deal.probability != null ? `${deal.probability}%` : "—"}
                  </SheetField>
                  <SheetField label="Outcome">{outcome}</SheetField>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Expected close">{formatCrmDate(deal.expectedCloseDate)}</SheetField>
                  <SheetField label="Actual close">{formatCrmDate(deal.actualCloseDate)}</SheetField>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Company">
                    {deal.company ? (
                      <Link to={`/agency/crm/companies/${deal.company.id}`} className="hover:underline">
                        {deal.company.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </SheetField>
                  <SheetField label="Primary contact">
                    {deal.primaryContact ? (
                      <Link
                        to={`/agency/crm/contacts/${deal.primaryContact.id}`}
                        className="hover:underline"
                      >
                        {contactName || "Contact"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </SheetField>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <SheetField label="Owner">{displayText(deal.owner?.name)}</SheetField>
                  <SheetField label="Status">
                    <CrmActiveBadge active={deal.isActive} />
                  </SheetField>
                </div>
                {deal.lostReason ? (
                  <SheetField label="Lost reason">{deal.lostReason}</SheetField>
                ) : null}
                {deal.description ? (
                  <div className="space-y-1 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">{deal.description}</p>
                  </div>
                ) : null}
              </div>

              <RecordTags kind="deal" recordId={deal.id} tags={tagRefsFromAssignments(deal.tags)} />
              <RecordCustomFields entityType="deal" recordId={deal.id} values={deal.customFields} />
              <RecordNotes scope={{ dealId: deal.id }} />
              <RecordTasks scope={{ dealId: deal.id }} />
              <RecordActivities scope={{ dealId: deal.id }} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {deal ? (
        <DealFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          deal={deal}
          onSuccess={() => setEditOpen(false)}
        />
      ) : null}

      {deal ? (
        <DeleteDealDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          deal={deal}
          onSuccess={() => {
            setDeleteOpen(false);
            utils.crm.companies.get.invalidate();
            utils.crm.contacts.get.invalidate();
            onOpenChange(false);
          }}
        />
      ) : null}
    </>
  );
}
