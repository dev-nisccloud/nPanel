import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import type { JetBackupDashboardData } from "../types";

export function useJetBackupDashboard() {
  const connection = trpc.jetbackup.dashboard.testConnection.useQuery(undefined, jetbackupQueryOptions);
  const details = trpc.jetbackup.dashboard.getDetails.useQuery(undefined, {
    ...jetbackupQueryOptions,
    enabled: connection.data?.success === true,
  });

  return {
    connection,
    details: details.data as JetBackupDashboardData | undefined,
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
