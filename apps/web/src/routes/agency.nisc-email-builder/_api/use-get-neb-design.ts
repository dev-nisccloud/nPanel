"use client";

import { trpc } from "@/utils/trpc";

interface UseGetNebDesignProps {
	designId: string;
}

/**
 * Hook for fetching a NISC email design with polling for pending saves.
 * Polls every 2 seconds if saveStatus indicates work in progress.
 */
export function useGetNebDesign({ designId }: UseGetNebDesignProps) {
	return trpc.niscEmailBuilder.design.get.useQuery(
		{ designId },
		{
			enabled: !!designId,
			refetchInterval: (query) => {
				const design = query.state.data;
				const hasPendingWork = design?.saveStatus === "SAVING" || design?.saveStatus === "SAVE_FAILED";
				return hasPendingWork ? 2000 : false; // Poll every 2s if pending
			},
			refetchOnWindowFocus: true,
			staleTime: 5000,
		},
	);
}
