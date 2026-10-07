import { Activity } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { CrmEmptyLine, CrmInfoCard, formatCrmDate } from "../crm-detail";

export function CompanyActivityTab({ companyId }: { companyId: string }) {
  const { data: timeline, isLoading } = trpc.crm.companies.getActivityTimeline.useQuery({
    id: companyId,
  });

  if (isLoading) {
    return (
      <CrmInfoCard icon={Activity} title="Activity" description="Recent changes">
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </CrmInfoCard>
    );
  }

  const logs = timeline?.data ?? [];

  return (
    <CrmInfoCard
      icon={Activity}
      title="Activity"
      description={`${logs.length} ${logs.length === 1 ? "event" : "events"}`}
    >
      {logs.length === 0 ? (
        <CrmEmptyLine>No activity for this company.</CrmEmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {logs.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-foreground">{entry.action}</p>
                {entry.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.description}</p>
                ) : null}
                {entry.createdBy?.name ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.createdBy.name}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatCrmDate(entry.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </CrmInfoCard>
  );
}
