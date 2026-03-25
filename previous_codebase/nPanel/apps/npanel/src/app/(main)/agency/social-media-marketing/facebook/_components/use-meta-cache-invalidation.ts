"use client";

import { useCallback } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Hook for invalidating Meta API cache
 * Provides utilities to invalidate cache when tokens are invalid or data is updated
 */
export function useMetaCacheInvalidation() {
	const utils = trpc.useUtils();

	/**
	 * Invalidate all Meta API queries
	 * Use when token is refreshed or integration is updated
	 */
	const invalidateAll = useCallback(() => {
		utils.socialMediaMarketing.meta.pages.getPages.invalidate();
		utils.socialMediaMarketing.meta.pages.getPage.invalidate();
		utils.socialMediaMarketing.meta.pages.getPageInsights.invalidate();
		utils.socialMediaMarketing.meta.content.getContent.invalidate();
	}, [utils]);

	/**
	 * Invalidate specific page queries
	 * Use when page data is updated
	 */
	const invalidatePage = useCallback(
		(pageId: string) => {
			utils.socialMediaMarketing.meta.pages.getPage.invalidate({ pageId });
			utils.socialMediaMarketing.meta.pages.getPageInsights.invalidate({ pageId });
			utils.socialMediaMarketing.meta.content.getContent.invalidate({ pageId });
		},
		[utils]
	);

	/**
	 * Invalidate pages list
	 * Use when pages list changes (new page added, page removed, etc.)
	 */
	const invalidatePagesList = useCallback(() => {
		utils.socialMediaMarketing.meta.pages.getPages.invalidate();
	}, [utils]);

	/**
	 * Invalidate all queries for a specific page
	 * Use when page token is invalid or needs refresh
	 */
	const invalidatePageQueries = useCallback(
		(pageId: string) => {
			utils.socialMediaMarketing.meta.pages.getPage.invalidate({ pageId });
			utils.socialMediaMarketing.meta.pages.getPageInsights.invalidate({ pageId });
			utils.socialMediaMarketing.meta.content.getContent.invalidate({ pageId });
		},
		[utils]
	);

	return {
		invalidateAll,
		invalidatePage,
		invalidatePagesList,
		invalidatePageQueries,
	};
}

