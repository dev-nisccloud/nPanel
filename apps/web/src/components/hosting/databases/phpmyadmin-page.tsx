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
  const url = apiUrl(`/api/hosting/phpmyadmin?${params.toString()}`);
  
  // CRITICAL: Ensure URL is always relative, never absolute
  if (url.startsWith("http://") || url.startsWith("https://")) {
    console.error("[phpMyAdmin] CRITICAL: apiUrl returned absolute URL:", url);
    // Force relative path
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return `/api/hosting/phpmyadmin?${params.toString()}`;
    }
  }
  
  console.log("[phpMyAdmin] iframe URL:", url, "origin:", window.location.origin);
  return url;
}

export function PhpMyAdminPage({
  siteId,
  databaseId,
  databaseName,
  backTo,
}: PhpMyAdminPageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [finalSrc, setFinalSrc] = React.useState<string | null>(null);
  const initialUrl = phpMyAdminUrl(siteId, databaseId);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchProxyUrl() {
      try {
        console.log("[phpMyAdmin] Fetching redirect chain for:", initialUrl);
        
        // Follow redirects to get the final proxy URL
        const response = await fetch(initialUrl, {
          method: "GET",
          credentials: "include",
          redirect: "manual", // Don't follow redirects automatically
        });

        if (cancelled) return;

        console.log("[phpMyAdmin] Initial response:", response.status, response.headers.get("location"));

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (location) {
            console.log("[phpMyAdmin] Using redirect location:", location);
            setFinalSrc(location);
            return;
          }
        }

        // If no redirect, use the original URL
        console.log("[phpMyAdmin] No redirect, using original URL");
        setFinalSrc(initialUrl);
      } catch (err) {
        console.error("[phpMyAdmin] Failed to fetch redirect:", err);
        if (!cancelled) {
          setError("Failed to load phpMyAdmin. Please try again.");
        }
      }
    }

    fetchProxyUrl();

    return () => {
      cancelled = true;
    };
  }, [initialUrl]);

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
        {finalSrc ? (
          <iframe
            key={finalSrc}
            title={databaseName ? `phpMyAdmin — ${databaseName}` : "phpMyAdmin"}
            src={finalSrc}
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
        ) : null}
      </div>
    </div>
  );
}
