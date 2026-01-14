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
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );
};
