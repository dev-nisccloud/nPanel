"use client";

import { ExternalLink, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Normalize a domain or URL and open it in a new browser tab. */
export function openSiteInNewTab(hostOrUrl: string) {
  const raw = String(hostOrUrl ?? "").trim();
  if (!raw) return;
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

const ACTION_BTN =
  "h-7 px-2.5 text-xs";

export function VisitSiteButton({
  url,
  label = "Visit site",
}: {
  url?: string | null;
  label?: string;
}) {
  const value = String(url ?? "").trim();
  if (!value) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={ACTION_BTN}
      onClick={() => openSiteInNewTab(value)}
    >
      <ExternalLink className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

export function ViewDetailsButton({
  onClick,
  label = "View",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={ACTION_BTN}
      onClick={onClick}
    >
      <Eye className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
