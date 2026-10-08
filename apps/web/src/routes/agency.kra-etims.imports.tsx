"use client";

import * as React from "react";
import { Package, Search, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { IMPORT_ITEM_STATUSES, LAST_REQ_DT, unwrapKraList } from "./agency.kra-etims/_lib/etims-kra";
import { ConfirmETimsImportSheet } from "./agency.kra-etims/imports/_components/confirm-etims-import-sheet";
import type { EtimsItemRecord } from "./agency.kra-etims/products/_components/etims-item-utils";

function statusLabel(code: string) {
  return IMPORT_ITEM_STATUSES.find((s) => s.code === code)?.label ?? code;
}

export default function ETimsImportsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [active, setActive] = React.useState<Record<string, unknown> | null>(null);

  const { data, isLoading, refetch } = trpc.etims.imports.getImportedItems.useQuery({ lastReqDt: LAST_REQ_DT });
  const { data: itemsData } = trpc.etims.items.getItemList.useQuery({ lastReqDt: "20230101000000" });

  const rows = React.useMemo(
    () => unwrapKraList(data, "itemList", "importItemList", "imptItemList"),
    [data],
  );
  const catalog = React.useMemo(
    () => unwrapKraList(itemsData, "itemList", "items") as EtimsItemRecord[],
    [itemsData],
  );

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return rows;
    return rows.filter((row) =>
      String(row.itemNm ?? "").toLowerCase().includes(query) ||
      String(row.taskCd ?? "").toLowerCase().includes(query) ||
      String(row.hsCd ?? "").toLowerCase().includes(query) ||
      String(row.dclNo ?? "").toLowerCase().includes(query),
    );
  }, [rows, searchQuery]);

  return (
    <ETimsInitializationGuard>
      <ConfirmETimsImportSheet
        open={!!active}
        onOpenChange={(open) => { if (!open) setActive(null); }}
        row={active}
        items={catalog}
        onSuccess={() => refetch()}
      />
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-base font-semibold tracking-tight">Imported items</h1>
              <p className="text-xs text-muted-foreground">
                Customs declarations from KRA. Approve or cancel each row and map it to a registered goods item.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search task, HS, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">HS</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No imported items</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Customs rows for this PIN appear here after KRA has a declaration.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => (
                      <tr key={`${row.taskCd}-${row.itemSeq}-${index}`} className="hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div className="font-medium">{String(row.itemNm ?? "—")}</div>
                          <div className="text-xs text-muted-foreground">{String(row.spplrNm ?? "")}</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs">{String(row.taskCd ?? "")}</td>
                        <td className="px-4 py-4 font-mono text-xs">{String(row.hsCd ?? "")}</td>
                        <td className="px-4 py-4 tabular-nums">{String(row.qty ?? "")} {String(row.qtyUnitCd ?? "")}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">{statusLabel(String(row.imptItemSttsCd ?? "1"))}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setActive(row)}>
                            <Pencil className="mr-2 h-3 w-3" />
                            Update
                          </Button>
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
