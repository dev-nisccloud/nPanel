"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CircleAlert, UserCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	getMissingRegistrantProfileFields,
	isRegistrantProfileComplete,
} from "@/lib/profile-completion";
import { trpc } from "@/utils/trpc";

export function ProfileCompletionBanner() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [welcomeFromSignup] = useState(() => searchParams.get("completeProfile") === "1");

	const { data: userInfo, isLoading } = trpc.userProfile.getUserInfo.useQuery();

	useEffect(() => {
		if (!welcomeFromSignup) return;
		const next = new URLSearchParams(searchParams);
		next.delete("completeProfile");
		setSearchParams(next, { replace: true });
	}, [welcomeFromSignup, searchParams, setSearchParams]);

	const profile = userInfo?.profile;
	const missingFields = useMemo(() => getMissingRegistrantProfileFields(profile), [profile]);
	const profileComplete = isRegistrantProfileComplete(profile);

	if (isLoading || !userInfo || userInfo.role !== "CUSTOMER") {
		return null;
	}

	if (profileComplete) {
		if (!welcomeFromSignup) return null;
		return (
			<Alert className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30">
				<UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
				<AlertTitle className="text-green-900 dark:text-green-100">
					Your profile is complete
				</AlertTitle>
				<AlertDescription className="text-green-800/90 dark:text-green-200/90">
					You&apos;re all set to purchase domains, hosting, and other services on nPanel.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert className="border-primary/25 bg-primary/5">
			<CircleAlert className="h-4 w-4 text-primary" />
			<AlertTitle>
				{welcomeFromSignup ? "Complete your profile to get started" : "Complete your profile"}
			</AlertTitle>
			<AlertDescription className="space-y-2">
				<p>
					{welcomeFromSignup
						? "Your organization is ready. Before you purchase services on nPanel - domains, hosting, email, and more - we need your contact details for registration, billing, and order fulfillment."
						: "Your contact details are required before you can purchase services on nPanel. They are used for domain registration, invoices, and provisioning."}
				</p>
				{missingFields.length > 0 ? (
					<p className="text-xs">
						<span className="font-medium">Still needed: </span>
						{missingFields.join(", ")}
					</p>
				) : null}
			</AlertDescription>
		</Alert>
	);
}
