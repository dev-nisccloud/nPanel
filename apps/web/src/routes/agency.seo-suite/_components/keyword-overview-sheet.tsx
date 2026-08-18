"use client";

import * as React from "react";
import { BarChart3, XIcon } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import {
  asArray,
  asRecord,
  formatNumber,
  getNested,
} from "./seo-suite-utils";

interface KeywordOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  keyword: string;
}

export function KeywordOverviewSheet({
  open,
  onOpenChange,
  projectId,
  keyword,
}: KeywordOverviewSheetProps) {
  const [data, setData] = React.useState<unknown>(null);

  const overview = trpc.seoSuite.keywordOverview.useMutation({
    onSuccess: (res) => setData(res),
    onError: (e) => toast.error(e.message || "Failed to load keyword overview"),
  });

  React.useEffect(() => {
    if (open && keyword) {
      setData(null);
      overview.mutate({ projectId, keyword });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, keyword, projectId]);

  const items = asArray(getNested(data, "items") ?? data);
  const first = asRecord(items[0] ?? data);
  const info = asRecord(
    getNested(first, "keyword_info") ??
      getNested(first, "keyword_data.keyword_info") ??
      first,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>Keyword overview</SheetTitle>
              <SheetDescription>{keyword}</SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {overview.isPending ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="space-y-4 px-1 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Search volume" value={formatNumber(info.search_volume)} />
                <Metric label="CPC" value={formatNumber(info.cpc)} />
                <Metric label="Competition" value={formatNumber(info.competition)} />
                <Metric
                  label="Competition level"
                  value={String(info.competition_level ?? "")}
                />
              </div>
              {info.monthly_searches != null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Monthly searches (raw)</p>
                  <pre className="text-xs rounded-lg border bg-muted/40 p-3 overflow-auto max-h-48">
                    {JSON.stringify(info.monthly_searches, null, 2)}
                  </pre>
                </div>
              )}
              {!overview.isPending && !info.search_volume && (
                <p className="text-sm text-muted-foreground">No overview metrics returned.</p>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
