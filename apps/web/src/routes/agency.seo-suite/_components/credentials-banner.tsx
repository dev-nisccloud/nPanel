"use client";

import { AlertTriangle } from "lucide-react";
import { trpc } from "@/utils/trpc";

export function CredentialsBanner() {
  const { data, isLoading } = trpc.seoSuite.credentialsStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || data?.configured) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">DataForSEO not configured</p>
        <p className="text-xs mt-0.5">
          Set <code className="text-xs">DATAFORSEO_LOGIN</code> and{" "}
          <code className="text-xs">DATAFORSEO_PASSWORD</code> on the server to enable research,
          audits, rank checks, and other live SEO actions.
        </p>
      </div>
    </div>
  );
}

export function useCredentialsConfigured() {
  const { data, isLoading } = trpc.seoSuite.credentialsStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return {
    configured: data?.configured ?? false,
    isLoading,
  };
}
