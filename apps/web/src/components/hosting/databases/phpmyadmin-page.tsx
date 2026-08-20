"use client";

import * as React from "react";
import { ArrowLeft, Database as DatabaseIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { apiUrl } from "@/lib/auth-client";

type PhpMyAdminPageProps = {
  siteId: number;
  databaseId: number;
  databaseName?: string;
  backTo: string;
};

function phpMyAdminUrl(siteId: number, databaseId: number): string {
  const params = new URLSearchParams({
    siteId: String(siteId),
    databaseId: String(databaseId),
    embed: "1",
  });
  return apiUrl(`/api/hosting/db-webadmin?${params.toString()}`);
}

export function PhpMyAdminPage({
  siteId,
  databaseId,
  databaseName,
  backTo,
}: PhpMyAdminPageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const src = phpMyAdminUrl(siteId, databaseId);

  React.useEffect(() => {
    console.log("[phpMyAdmin] Loading iframe with src:", src);
  }, [src]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b bg-background px-4 py-3">
        <Link to={backTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <DatabaseIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">phpMyAdmin</span>
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {databaseName || "MySQL / MariaDB"}
          </p>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-background">
        {!loaded && !error ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80">
            <Spinner size={28} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading phpMyAdmin…</p>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : null}
        <iframe
          key={src}
          title={databaseName ? `phpMyAdmin — ${databaseName}` : "phpMyAdmin"}
          src={src}
          className="block h-full w-full border-0 bg-background"
          onLoad={() => {
            setLoaded(true);
            console.log("[phpMyAdmin] iframe loaded");
          }}
          onError={(e) => {
            console.error("[phpMyAdmin] iframe error:", e);
            setError("Failed to load phpMyAdmin");
          }}
        />
      </div>
    </div>
  );
}
