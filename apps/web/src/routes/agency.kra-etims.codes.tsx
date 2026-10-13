"use client";

import * as React from "react";
import { BookOpen, Check, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { KRA_CODE_CLASS, KRA_CODE_CLASS_LABEL } from "./agency.kra-etims/_lib/etims-kra";

type CodeRow = {
  cdCls: string;
  cdClsNm: string;
  cd: string;
  cdNm: string;
  useYn: string;
};

type CodeClass = {
  cdCls: string;
  cdClsNm: string;
  count: number;
};

type ClassFilterItem = ComboboxItem & {
  count: number;
};

const CLASS_ORDER: string[] = Object.values(KRA_CODE_CLASS);
const ALL_CLASSES: ClassFilterItem = {
  id: "all",
  label: "All classes",
  keywords: ["all"],
  count: 0,
};

function display(value: string | null | undefined): string {
  const v = value?.trim();
  return v ? v : "—";
}

function classLabel(cdCls: string, cdClsNm?: string): string {
  return KRA_CODE_CLASS_LABEL[cdCls] ?? (cdClsNm?.trim() || cdCls);
}

function sortClasses(a: CodeClass, b: CodeClass): number {
  const ai = CLASS_ORDER.indexOf(a.cdCls);
  const bi = CLASS_ORDER.indexOf(b.cdCls);
  const aKnown = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
  const bKnown = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
  if (aKnown !== bKnown) return aKnown - bKnown;
  return a.cdCls.localeCompare(b.cdCls);
}

export default function ETimsCodesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showUnused, setShowUnused] = React.useState(false);
  const [classFilter, setClassFilter] = React.useState("all");
  const utils = trpc.useUtils();

  const listQuery = trpc.etims.data.listCodes.useQuery(
    { includeUnused: true },
    { retry: 1 },
  );
  const syncMutation = trpc.etims.data.syncCodeList.useMutation({
    onSuccess: (res) => {
      const total = Number(res.totalSynced ?? 0);
      toast.success(total > 0 ? `Synced ${total} codes` : "Sync finished");
      void utils.etims.data.listCodes.invalidate();
      void utils.etims.data.getCodeList.invalidate();
      void utils.etims.data.getCodeMeta.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Could not sync codes");
    },
  });

  const rows = (listQuery.data?.items ?? []) as CodeRow[];
  const classes = React.useMemo(
    () => ([...(listQuery.data?.classes ?? [])] as CodeClass[]).sort(sortClasses),
    [listQuery.data?.classes],
  );

  const needsSync = Boolean(
    listQuery.data?.needsSync
    ?? listQuery.data?.empty
    ?? (!listQuery.isLoading && rows.length === 0 && !listQuery.isError),
  );
  const errorMessage =
    (listQuery.data && "errorMessage" in listQuery.data ? listQuery.data.errorMessage : undefined)
    ?? listQuery.error?.message
    ?? null;
  const queryFailed = Boolean(listQuery.isError || listQuery.data?.success === false);

  const classItems = React.useMemo((): ClassFilterItem[] => {
    const visible = showUnused ? rows : rows.filter((row) => row.useYn !== "N");
    const counts = new Map<string, number>();
    for (const row of visible) {
      counts.set(row.cdCls, (counts.get(row.cdCls) ?? 0) + 1);
    }
    return [
      { ...ALL_CLASSES, count: visible.length },
      ...classes.map((cls) => ({
        id: cls.cdCls,
        label: classLabel(cls.cdCls, cls.cdClsNm),
        keywords: [cls.cdCls, cls.cdClsNm],
        count: counts.get(cls.cdCls) ?? 0,
      })),
    ];
  }, [classes, rows, showUnused]);

  const selectedClass = classItems.find((item) => item.id === classFilter) ?? classItems[0];

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      if (classFilter !== "all" && row.cdCls !== classFilter) return false;
      if (!showUnused && row.useYn === "N") return false;
      if (!query) return true;
      return (
        row.cd.toLowerCase().includes(query) ||
        row.cdNm.toLowerCase().includes(query) ||
        row.cdCls.toLowerCase().includes(query) ||
        row.cdClsNm.toLowerCase().includes(query) ||
        classLabel(row.cdCls, row.cdClsNm).toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery, classFilter, showUnused]);

  const handleSync = () => {
    syncMutation.mutate({ reset: true });
  };

  const isLoading = listQuery.isLoading;
  const isSyncing = syncMutation.isPending;

  return (
    <ETimsInitializationGuard>
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-base font-semibold tracking-tight">Code lists</h1>
              <p className="text-xs text-muted-foreground">KRA standard codes.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search code or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <ComboboxDropdown
                    placeholder="All classes"
                    searchPlaceholder="Search class..."
                    items={classItems}
                    selectedItem={selectedClass}
                    onSelect={(item) => setClassFilter(item.id)}
                    emptyResults="No classes"
                    disabled={isLoading || needsSync}
                    renderSelectedItem={(item) => item.label}
                    renderListItem={({ isChecked, item }) => (
                      <>
                        <Check className={`mr-2 h-4 w-4 ${isChecked ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.count > 0 ? (
                          <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
                            {item.count}
                          </span>
                        ) : null}
                      </>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant={showUnused ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowUnused((v) => !v)}
                >
                  {showUnused ? "Hiding unused" : "Show unused"}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing || isLoading}
                className="w-full md:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing…" : "Sync now"}
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                      </tr>
                    ))
                  ) : queryFailed ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <BookOpen className="h-12 w-12 text-destructive/40 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Could not load codes</h3>
                        {errorMessage?.trim() ? (
                          <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => void listQuery.refetch()}
                        >
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ) : needsSync ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No codes stored</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={handleSync}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Syncing…" : "Sync now"}
                        </Button>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No matching codes</h3>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={`${row.cdCls}-${row.cd}`} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {row.cdCls?.trim()
                            ? `${row.cdCls} ${classLabel(row.cdCls, row.cdClsNm)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{display(row.cd)}</td>
                        <td className="px-4 py-3">{display(row.cdNm)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.useYn === "N" ? "secondary" : "outline"}>
                            {row.useYn === "N" ? "Unused" : "Active"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ETimsInitializationGuard>
  );
}
