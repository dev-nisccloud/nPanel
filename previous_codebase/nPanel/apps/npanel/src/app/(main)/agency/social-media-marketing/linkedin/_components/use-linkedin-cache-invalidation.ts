"use client";

import { useCallback } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Hook for invalidating LinkedIn API cache
 * Provides utilities to invalidate cache when tokens are invalid or data is updated
 */
export function useLinkedInCacheInvalidation() {
	const utils = trpc.useUtils();

	/**
	 * Invalidate all LinkedIn API queries
	 * Use when token is refreshed or integration is updated
	 */
	const invalidateAll = useCallback(() => {
		utils.socialMediaMarketing.linkedin.pages.getOrganizations.invalidate();
		utils.socialMediaMarketing.linkedin.pages.getOrganization.invalidate();
	}, [utils]);

	/**
	 * Invalidate specific organization queries
	 * Use when organization data is updated
	 */
	const invalidateOrganization = useCallback(
		(orgId: string) => {
			utils.socialMediaMarketing.linkedin.pages.getOrganization.invalidate({ orgId });
		},
		[utils]
	);

	/**
	 * Invalidate organizations list
	 * Use when organizations list changes (new organization added, organization removed, etc.)
	 */
	const invalidateOrganizationsList = useCallback(() => {
		utils.socialMediaMarketing.linkedin.pages.getOrganizations.invalidate();
	}, [utils]);

	/**
	 * Invalidate all queries for a specific organization
	 * Use when organization token is invalid or needs refresh
	 */
	const invalidateOrganizationQueries = useCallback(
		(orgId: string) => {
			utils.socialMediaMarketing.linkedin.pages.getOrganization.invalidate({ orgId });
		},
		[utils]
	);

	return {
		invalidateAll,
		invalidateOrganization,
		invalidateOrganizationsList,
		invalidateOrganizationQueries,
	};
}




