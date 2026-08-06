"use client";

import * as React from "react";
import { useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

export default function LinkedInAdsCallbackPage() {
	const [searchParams] = useSearchParams();
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);

	// Use LinkedIn social media marketing auth for token generation
	// (it handles the OAuth token exchange, and we've ensured Marketing API scopes are included)
	const generateTokenMutation = trpc.socialMediaMarketing.linkedin.auth.generateToken.useMutation({
		onSuccess: (data) => {
			setStatus("success");
			setHasProcessed(true);
			const accountId =
				(data as { data?: { accountId?: string } })?.data?.accountId ??
				(data as { accountId?: string })?.accountId;
			captureEvent("linkedin_ads_connected", { account_id: accountId });
			toast.success("LinkedIn Ads account connected successfully!");
			// Use a hard redirect so LinkedIn Ads credentials are reloaded from server state.
			setTimeout(() => {
				window.location.replace("/agency/ad-campaigns/linkedin-ads");
			}, 2000);
		},
		onError: (error) => {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(error.message || "Failed to connect LinkedIn Ads account");
			toast.error(error.message || "Failed to connect LinkedIn Ads account");
		},
	});

	React.useEffect(() => {
		// Prevent multiple executions
		if (hasProcessed) {
			return;
		}

		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const errorReason = searchParams.get("error_reason");
		const errorDescription = searchParams.get("error_description");

		// Check for OAuth errors
		if (error) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(
				errorDescription || errorReason || "LinkedIn authorization was cancelled or failed"
			);
			return;
		}

		// Validate state
		const storedState = sessionStorage.getItem("linkedin_ads_oauth_state");
		if (state && storedState && state !== storedState) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("Invalid state parameter. Please try connecting again.");
			return;
		}
		sessionStorage.removeItem("linkedin_ads_oauth_state");

		const lastProcessedCode = sessionStorage.getItem("linkedin_ads_oauth_last_code");
		if (code && lastProcessedCode === code) {
			setStatus("success");
			setHasProcessed(true);
			setTimeout(() => {
				window.location.replace("/agency/ad-campaigns/linkedin-ads");
			}, 1000);
			return;
		}

		// Exchange code for token
		if (code) {
			setHasProcessed(true);
			sessionStorage.setItem("linkedin_ads_oauth_last_code", code);
			generateTokenMutation.mutate({
				code: code,
				redirectUri: `${window.location.origin}/agency/ad-campaigns/linkedin-ads/callback`,
			});
		} else {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("No authorization code received from LinkedIn");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Connecting LinkedIn Ads</CardTitle>
						<CardDescription>
							{status === "loading" && "Please wait while we connect your LinkedIn Ads account..."}
							{status === "success" && "Your LinkedIn Ads account has been connected successfully!"}
							{status === "error" && "Failed to connect your LinkedIn Ads account"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center py-8">
							{status === "loading" && (
								<>
									<Spinner size={48} className="mb-4" />
									<p className="text-sm text-muted-foreground">Processing authorization...</p>
								</>
							)}

							{status === "success" && (
								<>
									<CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
									<p className="text-sm text-muted-foreground mb-4">
										Redirecting to LinkedIn Ads page...
									</p>
								</>
							)}

							{status === "error" && (
								<>
									<AlertCircle className="h-12 w-12 text-destructive mb-4" />
									<p className="text-sm text-destructive mb-4">{errorMessage}</p>
									<Button
										onClick={() => window.location.replace("/agency/ad-campaigns/linkedin-ads")}
										variant="outline"
									>
										Go Back
									</Button>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

