import { trpc } from "@/utils/trpc";

interface UseGetGenerationsProps {
  page?: number;
  limit?: number;
  teamId?: string;
}

export const useGetGenerations = ({ page = 1, limit = 20, teamId }: UseGetGenerationsProps = {}) => {
  return trpc.imageGenerator.getGenerations.useQuery(
    { page, limit, teamId },
    {
      staleTime: 5000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: (query) => {
        const data = query.state.data as { data?: Array<{ status?: string }> } | undefined;
        const list = data?.data ?? [];
        const inProgress = list.some(
          (g) => g.status === "QUEUED" || g.status === "PROCESSING",
        );
        return inProgress ? 2000 : false;
      },
    },
  );
};
