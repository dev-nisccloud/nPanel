"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy route: /agency/ad-campaigns/google-ads/[customerId]
 * Redirects to the main Google Ads page where account is selected via dropdown (same flow as Meta Ads).
 */
export default function GoogleAdsCustomerIdRedirect() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/agency/ad-campaigns/google-ads");
	}, [router]);

	return null;
}
