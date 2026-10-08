"use client";

import * as React from "react";
import { BookOpen, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { LAST_REQ_DT, flattenKraCodeList } from "./agency.kra-etims/_lib/etims-kra";

export default function ETimsCodesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const { data, isLoading, refetch } = trpc.etims.data.getCodeList.useQuery({ lastReqDt: LAST_REQ_DT });

  const rows = React.useMemo(() => flattenKraCodeList(data), [data]);
  const classes = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (!row.cdCls) continue;
      map.set(row.cdCls, row.cdClsNm || row.cdCls);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      if (classFilter !== "all" && row.cdCls !== classFilter) return false;
      if (!query) return true;
      return (
        row.cd.toLowerCase().includes(query) ||
        row.cdNm.toLowerCase().includes(query) ||
        row.cdCls.toLowerCase().includes(query) ||
        row.cdClsNm.toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery, classFilter]);

  return (
    <ETimsInitializationGuard>
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-base font-semibold tracking-tight">Code lists</h1>
              <p className="text-xs text-muted-foreground">
                Live KRA /selectCodeList catalog: tax types, units, countries, stock I/O types, and other OSCU codes.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">All classes</option>
                {classes.map(([cd, name]) => (
                  <option key={cd} value={cd}>{cd} — {name}</option>
                ))}
              </select>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
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
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No codes</h3>
                        <p className="text-sm text-muted-foreground mt-1">KRA returned no code rows for this request.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => (
                      <tr key={`${row.cdCls}-${row.cd}-${index}`} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{row.cdCls} {row.cdClsNm}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.cd}</td>
                        <td className="px-4 py-3">{row.cdNm}</td>
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
