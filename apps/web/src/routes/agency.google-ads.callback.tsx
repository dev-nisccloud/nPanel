"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

export default function GoogleAdsCallbackPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);

	const generateTokenMutation = trpc.googleAds.auth.generateToken.useMutation({
		onSuccess: (data) => {
			setStatus("success");
			setHasProcessed(true);
			const customerId =
				(data as { data?: { customerId?: string } })?.data?.customerId ??
				(data as { customerId?: string })?.customerId;
			captureEvent("google_ads_connected", {
				customer_id: customerId,
			});
			toast.success("Google Ads account connected successfully!");
			// Redirect to main Google Ads page after a short delay
			setTimeout(() => {
				navigate("/agency/google-ads");
			}, 2000);
		},
		onError: (error) => {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(error.message || "Failed to connect Google Ads account");
			toast.error(error.message || "Failed to connect Google Ads account");
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
		const errorDescription = searchParams.get("error_description");

		// Check for OAuth errors
		if (error) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(
				errorDescription || "Google authorization was cancelled or failed"
			);
			return;
		}

		// Validate state
		const storedState = sessionStorage.getItem("google_ads_oauth_state");
		if (state && storedState && state !== storedState) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("Invalid state parameter. Please try connecting again.");
			return;
		}

		// Exchange code for token
		if (code) {
			setHasProcessed(true);
			generateTokenMutation.mutate({
				code: code,
				redirectUri: `${window.location.origin}/agency/google-ads/callback`,
			});
		} else {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("No authorization code received from Google");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Connecting Google Ads</CardTitle>
						<CardDescription>
							{status === "loading" && "Please wait while we connect your Google Ads account..."}
							{status === "success" && "Your Google Ads account has been connected successfully!"}
							{status === "error" && "Failed to connect your Google Ads account"}
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
										Redirecting to Google Ads page...
									</p>
								</>
							)}

							{status === "error" && (
								<>
									<AlertCircle className="h-12 w-12 text-destructive mb-4" />
									<p className="text-sm text-destructive mb-4">{errorMessage}</p>
									<Button
										onClick={() => navigate("/agency/google-ads")}
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


