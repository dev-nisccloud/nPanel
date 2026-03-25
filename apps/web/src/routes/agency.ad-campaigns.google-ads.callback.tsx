"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { ShoppingCart, CheckCircle2, XCircle } from "lucide-react";

export default function GoogleAdsCallbackPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);

	const generateTokenMutation = trpc.googleAds.auth.generateToken.useMutation({
		onSuccess: () => {
			setStatus("success");
			setHasProcessed(true);
			toast.success("Google Ads account connected successfully!");
			// Redirect to main Google Ads page after a short delay
			setTimeout(() => {
				navigate("/agency/ad-campaigns/google-ads");
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
		const errorReason = searchParams.get("error_reason");
		const errorDescription = searchParams.get("error_description");

		// Check for OAuth errors
		if (error) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(
				errorDescription || errorReason || "Google authorization was cancelled or failed"
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
				redirectUri: `${window.location.origin}/agency/ad-campaigns/google-ads/callback`,
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
			<div className="flex items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							{status === "loading" && <Spinner size={32} />}
							{status === "success" && (
								<CheckCircle2 className="h-8 w-8 text-green-600" />
							)}
							{status === "error" && <XCircle className="h-8 w-8 text-red-600" />}
						</div>
						<CardTitle>
							{status === "loading" && "Connecting Google Ads..."}
							{status === "success" && "Connected Successfully!"}
							{status === "error" && "Connection Failed"}
						</CardTitle>
						<CardDescription>
							{status === "loading" &&
								"Please wait while we connect your Google Ads account..."}
							{status === "success" &&
								"Your Google Ads account has been connected successfully. Redirecting..."}
							{status === "error" && errorMessage}
						</CardDescription>
					</CardHeader>
					{status === "error" && (
						<CardContent className="space-y-4">
							<Button
								onClick={() => navigate("/agency/ad-campaigns/google-ads")}
								className="w-full"
								variant="outline"
							>
								Go Back
							</Button>
						</CardContent>
					)}
				</Card>
			</div>
		</div>
	);
}

