"use client";

import { trpc } from "@/utils/trpc";
import type { ServicePlanType } from "./schema";

export function useHostingPlans(planType?: ServicePlanType, isActive?: boolean) {
	return trpc.hostingPlans.getAll.useQuery(
		planType || isActive !== undefined
			? {
					planType: planType,
					isActive: isActive,
				}
			: undefined,
		{
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
		},
	);
}

