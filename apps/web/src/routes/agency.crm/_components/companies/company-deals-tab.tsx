import { useState } from "react";
import { Briefcase } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CrmEmptyLine, CrmInfoCard, formatCrmDate, formatCrmMoney } from "../crm-detail";
import { DealViewSheet } from "../deals/deal-view-sheet";

interface CompanyDealRow {
  id: string;
  name: string;
  amount: string | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | Date | null;
  isClosed: boolean;
  isWon: boolean;
  stage: { name: string; color: string | null } | null;
}

export function CompanyDealsTab({ deals }: { deals: CompanyDealRow[] }) {
  const [dealId, setDealId] = useState<string | null>(null);

  return (
    <>
    <CrmInfoCard
      icon={Briefcase}
      title="Deals"
      description={`${deals.length} ${deals.length === 1 ? "deal" : "deals"}`}
    >
      {deals.length === 0 ? (
        <CrmEmptyLine>No deals for this company.</CrmEmptyLine>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 text-xs">Name</TableHead>
              <TableHead className="text-xs">Stage</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Probability</TableHead>
              <TableHead className="text-xs">Close date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell className="px-4">
                  <button
                    type="button"
                    className="text-sm font-semibold text-foreground hover:underline"
                    onClick={() => setDealId(deal.id)}
                  >
                    {deal.name}
                  </button>
                </TableCell>
                <TableCell>
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
                  ) : deal.isClosed ? (
                    <Badge variant="outline" className="text-xs">
                      {deal.isWon ? "Won" : "Lost"}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCrmMoney(deal.amount, deal.currency)}
                </TableCell>
                <TableCell className="text-sm">
                  {deal.probability != null ? `${deal.probability}%` : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCrmDate(deal.expectedCloseDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrmInfoCard>
    <DealViewSheet
      dealId={dealId}
      open={!!dealId}
      onOpenChange={(open) => {
        if (!open) setDealId(null);
      }}
    />
    </>
  );
}
