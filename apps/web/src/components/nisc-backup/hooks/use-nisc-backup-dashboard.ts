import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import type { NiscBackupDashboardData } from "../types";

export function useNiscBackupDashboard() {
  const connection = trpc.niscBackup.dashboard.testConnection.useQuery(undefined, niscBackupQueryOptions);
  const details = trpc.niscBackup.dashboard.getDetails.useQuery(undefined, {
    ...niscBackupQueryOptions,
    enabled: connection.data?.success === true,
  });

  return {
    connection,
    details: details.data as NiscBackupDashboardData | undefined,
    isLoading: connection.isLoading || (connection.data?.success && details.isLoading),
    isError: connection.isError || details.isError,
    error: connection.error ?? details.error,
    refetch: async () => {
      await connection.refetch();
      await details.refetch();
    },
    system: connection.data?.system,
  };
}
