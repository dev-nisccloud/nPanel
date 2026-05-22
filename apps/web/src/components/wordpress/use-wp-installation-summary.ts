"use client";

import { trpc } from "@/utils/trpc";

export function useWpInstallationSummary(installationId: string) {
  const id = parseInt(installationId, 10);
  const query = trpc.plesk.wordpress.getById.useQuery(
    { id },
    { enabled: !Number.isNaN(id) && id > 0, staleTime: 60_000 },
  );
  const features = query.data?.data?.features;
  return { id, features, query };
}
