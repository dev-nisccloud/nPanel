"use client";

import { Palette } from "lucide-react";

function asObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

export function parseCreativeBriefResult(payload: unknown): Record<string, unknown> | null {
  const o = asObject(payload);
  if (o?._tool !== "submit_creative_brief") return null;
  return o;
}

export function ZeepoCreativeBriefCard({ result }: { result: unknown }) {
  const o = parseCreativeBriefResult(result);
  if (!o?.ok) return null;
  const name = typeof o.name === "string" ? o.name : "Creative brief";
  const status = typeof o.status === "string" ? o.status : "DRAFT";
  const message =
    typeof o.message === "string"
      ? o.message
      : "Creative brief submitted to the design team.";

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Palette className="h-3.5 w-3.5 text-primary" />
        Creative brief submitted
      </div>
      <div className="space-y-1.5 px-3 py-3">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{status}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
