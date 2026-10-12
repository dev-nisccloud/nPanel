"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export type AgencyAccessLevel = "none" | "read" | "write";

const ACCESS_OPTIONS: { value: AgencyAccessLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
];

export function RoleAccessEditor({
  value,
  onChange,
}: {
  value: Record<string, AgencyAccessLevel>;
  onChange: (next: Record<string, AgencyAccessLevel>) => void;
}) {
  const catalogQuery = trpc.agencyRbac.catalog.useQuery();
  const entries = catalogQuery.data?.entries ?? [];
  const modules = catalogQuery.data?.modules ?? [];

  React.useEffect(() => {
    if (!catalogQuery.data) return;
    const next = { ...value };
    let changed = false;
    for (const entry of catalogQuery.data.entries) {
      if (!next[entry.key]) {
        next[entry.key] = "none";
        changed = true;
      }
    }
    if (changed) onChange(next);
    // Seed missing keys once the catalog arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogQuery.data]);

  if (catalogQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading permissions…</p>;
  }

  const setModule = (moduleId: string, access: AgencyAccessLevel) => {
    const next = { ...value };
    for (const entry of entries) {
      if (entry.module === moduleId) next[entry.key] = access;
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {modules.map((mod) => {
        const rows = entries.filter((entry) => entry.module === mod.id);
        if (rows.length === 0) return null;
        return (
          <div key={mod.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{mod.label}</h3>
              <div className="flex gap-1">
                {ACCESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setModule(mod.id, opt.value)}
                  >
                    All {opt.label.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {rows.map((entry) => (
                <div
                  key={entry.key}
                  className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <div className="inline-flex shrink-0 rounded-md border p-0.5">
                    {ACCESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "rounded-sm px-2.5 py-1 text-xs font-medium",
                          (value[entry.key] ?? "none") === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => onChange({ ...value, [entry.key]: opt.value })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function grantsFromEditor(value: Record<string, AgencyAccessLevel>) {
  return Object.entries(value)
    .filter((entry): entry is [string, "read" | "write"] => entry[1] === "read" || entry[1] === "write")
    .map(([key, access]) => ({ key, access }));
}
