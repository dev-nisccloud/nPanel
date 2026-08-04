import { trpc } from "@/utils/trpc";

/**
 * Hook to monitor background operations for an email builder design.
 * Polls while operations are in progress (like Zeepo generations).
 * 
 * Use this to show progress for:
 * - AI generation jobs
 * - Image processing
 */
export function useGetEmailBuilderOperations(designId: string, enabled = true) {
    return trpc.emailBuilder.getOperations.useQuery(
        { designId, limit: 10 },
        {
            enabled: Boolean(designId) && enabled,
            retry: 1,
            // Poll every 2 seconds while there are pending/processing operations
            refetchInterval: (query) => {
                const operations = query.state.data?.data ?? [];
                const hasPending = operations.some(
                    (op) => op.status === "QUEUED" || op.status === "PROCESSING"
                );
                return hasPending ? 2000 : false;
            },
            staleTime: 3000,
        }
    );
}
