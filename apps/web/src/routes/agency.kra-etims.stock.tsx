"use client";

import * as React from "react";
import {
  Package,
  Search,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { unwrapKraList, LAST_REQ_DT, STOCK_IO_TYPES } from "./agency.kra-etims/_lib/etims-kra";
import { SendETimsStockIoSheet } from "./agency.kra-etims/stock/_components/send-etims-stock-io-sheet";
import { SaveETimsStockMasterSheet } from "./agency.kra-etims/stock/_components/save-etims-stock-master-sheet";
import { type EtimsItemRecord } from "./agency.kra-etims/products/_components/etims-item-utils";

function movementType(row: Record<string, unknown>) {
  const code = String(row.sarTyCd ?? "");
  return STOCK_IO_TYPES.find((t) => t.code === code)?.label ?? code;
}

export default function ETimsStockPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isIoOpen, setIsIoOpen] = React.useState(false);
  const utils = trpc.useUtils();

  const { data: stockData, isLoading, refetch } = trpc.etims.stock.getStockMovements.useQuery({
    lastReqDt: LAST_REQ_DT,
  });
  const { data: itemsData } = trpc.etims.items.getItemList.useQuery({ lastReqDt: "20230101000000" });

  const refresh = React.useCallback(() => {
    void refetch();
    void utils.etims.items.getItemList.invalidate();
  }, [refetch, utils]);

  const movements = React.useMemo(() => unwrapKraList(stockData, "itemList"), [stockData]);
  const onHand = React.useMemo(() => unwrapKraList(stockData, "stockList"), [stockData]);

  const catalog = React.useMemo(() => {
    return unwrapKraList(itemsData, "itemList", "items") as EtimsItemRecord[];
  }, [itemsData]);

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return movements;
    return movements.filter((row) =>
      String(row.itemNm ?? "").toLowerCase().includes(query) ||
      String(row.itemCd ?? "").toLowerCase().includes(query) ||
      String(row.sarTyCd ?? "").toLowerCase().includes(query),
    );
  }, [movements, searchQuery]);

  const onHandTotal = onHand.reduce((sum, row) => sum + (Number(row.rsdQty) || 0), 0);
  const inCount = movements.filter((row) => String(row.sarTyCd ?? "").startsWith("0")).length;
  const outCount = movements.filter((row) => String(row.sarTyCd ?? "").startsWith("1")).length;

  return (
    <ETimsInitializationGuard>
      <SendETimsStockIoSheet
        open={isIoOpen}
        onOpenChange={setIsIoOpen}
        items={catalog}
        onSuccess={refresh}
      />
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-base font-semibold tracking-tight">Stock taking</h1>
              <p className="text-xs text-muted-foreground">
                Goods quantity is managed here. Register items on Products, then set remaining quantity or record a movement.
              </p>
            </div>

            <SaveETimsStockMasterSheet
              embedded
              items={catalog}
              onSuccess={refresh}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">On hand</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{onHandTotal}</CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stock in</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold flex items-center gap-2">
                  {inCount}
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                </CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stock out</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold flex items-center gap-2">
                  {outCount}
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                </CardContent>
              </Card>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">KRA code</th>
                    <th className="px-4 py-3 text-right">On hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      </tr>
                    ))
                  ) : onHand.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No remaining quantity saved yet. Set it in Stock taking above.
                      </td>
                    </tr>
                  ) : (
                    onHand.map((row) => (
                      <tr key={String(row.itemCd)} className="hover:bg-muted/30">
                        <td className="px-4 py-4 font-medium">{String(row.itemNm ?? "—")}</td>
                        <td className="px-4 py-4 font-mono text-xs">{String(row.itemCd ?? "")}</td>
                        <td className="px-4 py-4 text-right tabular-nums">{String(row.rsdQty ?? "0")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" size="icon" onClick={() => refresh()} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button onClick={() => setIsIoOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record movement
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">KRA code</th>
                    <th className="px-4 py-3">Movement</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No stock movements</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                          Set remaining quantity above, or record a stock in/out movement.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setIsIoOpen(true)}>
                          <Plus className="mr-2 h-3 w-3" />
                          Record movement
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => (
                      <tr key={`${row.itemCd ?? "row"}-${index}`} className="hover:bg-muted/30">
                        <td className="px-4 py-4 font-medium">{String(row.itemNm ?? "—")}</td>
                        <td className="px-4 py-4 font-mono text-xs">{String(row.itemCd ?? "")}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">{movementType(row)}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">{String(row.qty ?? row.rsdQty ?? "—")}</td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{String(row.ocrnDt ?? row.sarDt ?? "")}</td>
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
