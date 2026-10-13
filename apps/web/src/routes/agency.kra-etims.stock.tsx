"use client";

import * as React from "react";
import { Package, Search, RefreshCw, Plus, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { unwrapKraList, LAST_REQ_DT, STOCK_IO_TYPES } from "./agency.kra-etims/_lib/etims-kra";
import { SendETimsStockIoSheet } from "./agency.kra-etims/stock/_components/send-etims-stock-io-sheet";
import { SaveETimsStockMasterSheet } from "./agency.kra-etims/stock/_components/save-etims-stock-master-sheet";
import { type EtimsItemRecord } from "./agency.kra-etims/products/_components/etims-item-utils";

function movementType(row: Record<string, unknown>) {
  const code = String(row.sarTyCd ?? "");
  return STOCK_IO_TYPES.find((t) => t.code === code)?.label ?? code;
}

function movementDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw || "—";
}

export default function ETimsStockPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"on-hand" | "movements">("on-hand");
  const [isIoOpen, setIsIoOpen] = React.useState(false);
  const [isStockOpen, setIsStockOpen] = React.useState(false);
  const [stockItem, setStockItem] = React.useState<EtimsItemRecord | null>(null);
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

  const filteredOnHand = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return onHand;
    return onHand.filter((row) =>
      String(row.itemNm ?? "").toLowerCase().includes(query) ||
      String(row.itemCd ?? "").toLowerCase().includes(query),
    );
  }, [onHand, searchQuery]);

  const filteredMovements = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return movements;
    return movements.filter((row) =>
      String(row.itemNm ?? "").toLowerCase().includes(query) ||
      String(row.itemCd ?? "").toLowerCase().includes(query) ||
      String(row.sarTyCd ?? "").toLowerCase().includes(query) ||
      movementType(row).toLowerCase().includes(query),
    );
  }, [movements, searchQuery]);

  const openStock = (item?: EtimsItemRecord | Record<string, unknown> | null) => {
    if (item?.itemCd) {
      const fromCatalog = catalog.find((row) => row.itemCd === String(item.itemCd));
      setStockItem(fromCatalog ?? {
        itemCd: String(item.itemCd),
        itemClsCd: String((item as EtimsItemRecord).itemClsCd ?? ""),
        itemNm: String(item.itemNm ?? ""),
        rsdQty: item.rsdQty as string | number | undefined,
      });
    } else {
      setStockItem(null);
    }
    setIsStockOpen(true);
  };

  return (
    <ETimsInitializationGuard>
      <SendETimsStockIoSheet
        open={isIoOpen}
        onOpenChange={setIsIoOpen}
        items={catalog}
        onSuccess={refresh}
      />
      <SaveETimsStockMasterSheet
        open={isStockOpen}
        onOpenChange={(open) => {
          setIsStockOpen(open);
          if (!open) setStockItem(null);
        }}
        items={catalog}
        initialItem={stockItem}
        onSuccess={refresh}
      />
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Stock taking</h1>
            <p className="text-xs text-muted-foreground">On-hand quantity and stock movements.</p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "on-hand" | "movements")}
            className="mt-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="on-hand">
                  On hand
                  {onHand.length > 0 ? (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                      {onHand.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="movements">
                  Movements
                  {movements.length > 0 ? (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                      {movements.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={activeTab === "on-hand" ? "Search item or code..." : "Search movements..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => refresh()} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" onClick={() => openStock(null)}>
                  <Warehouse className="mr-2 h-4 w-4" />
                  Set quantity
                </Button>
                <Button onClick={() => setIsIoOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record movement
                </Button>
              </div>
            </div>

            <TabsContent value="on-hand" className="mt-6">
              <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">KRA code</th>
                      <th className="px-4 py-3 text-right">On hand</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                        </tr>
                      ))
                    ) : filteredOnHand.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No remaining quantity</h3>
                          <Button variant="outline" size="sm" className="mt-4" onClick={() => openStock(null)}>
                            <Warehouse className="mr-2 h-3 w-3" />
                            Set quantity
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filteredOnHand.map((row) => (
                        <tr key={String(row.itemCd)} className="hover:bg-muted/30">
                          <td className="px-4 py-4 font-medium">{String(row.itemNm ?? "—")}</td>
                          <td className="px-4 py-4 font-mono text-xs">{String(row.itemCd ?? "")}</td>
                          <td className="px-4 py-4 text-right tabular-nums">{String(row.rsdQty ?? "0")}</td>
                          <td className="px-4 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => openStock(row)}>
                              Set quantity
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="movements" className="mt-6">
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
                    ) : filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No stock movements</h3>
                          <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsIoOpen(true)}>
                            <Plus className="mr-2 h-3 w-3" />
                            Record movement
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((row, index) => (
                        <tr key={`${row.itemCd ?? "row"}-${index}`} className="hover:bg-muted/30">
                          <td className="px-4 py-4 font-medium">{String(row.itemNm ?? "—")}</td>
                          <td className="px-4 py-4 font-mono text-xs">{String(row.itemCd ?? "")}</td>
                          <td className="px-4 py-4">
                            <Badge variant="outline">{movementType(row)}</Badge>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">{String(row.qty ?? row.rsdQty ?? "—")}</td>
                          <td className="px-4 py-4 text-xs text-muted-foreground">{movementDate(row.ocrnDt ?? row.sarDt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ETimsInitializationGuard>
  );
}
