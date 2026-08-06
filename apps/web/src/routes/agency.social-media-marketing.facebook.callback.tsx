"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

export default function FacebookCallbackPage() {
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);
	const connectionSourceRef = React.useRef<"facebook" | "meta_ads">("facebook");

	const generateTokenMutation = trpc.socialMediaMarketing.meta.auth.generateToken.useMutation({
		onSuccess: (data) => {
			setStatus("success");
			setHasProcessed(true);
			const pageId =
				(data as { data?: { pageId?: string } })?.data?.pageId ??
				(data as { pageId?: string })?.pageId;
			const accountId =
				(data as { data?: { accountId?: string } })?.data?.accountId ??
				(data as { accountId?: string })?.accountId;
			if (connectionSourceRef.current === "meta_ads") {
				captureEvent("meta_ads_connected", { account_id: accountId });
			} else {
				captureEvent("facebook_account_connected", { page_id: pageId });
			}
			toast.success(
				connectionSourceRef.current === "meta_ads"
					? "Meta Ads account connected successfully!"
					: "Facebook account connected successfully!",
			);
			// Use a hard redirect so refreshing the callback does not re-run the exchange.
			setTimeout(() => {
				window.location.replace(
					connectionSourceRef.current === "meta_ads"
						? "/agency/ad-campaigns/meta-ads"
						: "/agency/social-media-marketing/facebook",
				);
			}, 2000);
		},
		onError: (error) => {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(error.message || "Failed to connect Facebook account");
			toast.error(error.message || "Failed to connect Facebook account");
		},
	});

	React.useEffect(() => {
		// Prevent multiple executions
		if (hasProcessed) {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
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
				errorDescription || errorReason || "Facebook authorization was cancelled or failed"
			);
			return;
		}

		// Detect Meta Ads vs Facebook SMM connection source
		const metaAdsState = sessionStorage.getItem("meta_ads_oauth_state");
		const facebookState = sessionStorage.getItem("facebook_oauth_state");
		if (metaAdsState && (!facebookState || state === metaAdsState)) {
			connectionSourceRef.current = "meta_ads";
		} else {
			connectionSourceRef.current = "facebook";
		}

		// Validate state
		const storedState = metaAdsState || facebookState;
		if (state && storedState && state !== storedState) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("Invalid state parameter. Please try connecting again.");
			return;
		}
		sessionStorage.removeItem("facebook_oauth_state");
		sessionStorage.removeItem("meta_ads_oauth_state");

		const lastProcessedCode = sessionStorage.getItem("facebook_oauth_last_code");
		if (code && lastProcessedCode === code) {
			setStatus("success");
			setHasProcessed(true);
			setTimeout(() => {
				window.location.replace(
					connectionSourceRef.current === "meta_ads"
						? "/agency/ad-campaigns/meta-ads"
						: "/agency/social-media-marketing/facebook",
				);
			}, 1000);
			return;
		}

		// Exchange code for token
		if (code) {
			setHasProcessed(true);
			sessionStorage.setItem("facebook_oauth_last_code", code);
			generateTokenMutation.mutate({
				code: code,
				redirectUri: `${window.location.origin}/agency/social-media-marketing/facebook/callback`,
			});
		} else {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("No authorization code received from Facebook");
		}
	}, [generateTokenMutation, hasProcessed]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Connecting Facebook</CardTitle>
						<CardDescription>
							{status === "loading" && "Please wait while we connect your Facebook account..."}
							{status === "success" && "Your Facebook account has been connected successfully!"}
							{status === "error" && "Failed to connect your Facebook account"}
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
										Redirecting...
									</p>
								</>
							)}

							{status === "error" && (
								<>
									<AlertCircle className="h-12 w-12 text-destructive mb-4" />
									<p className="text-sm text-destructive mb-4">{errorMessage}</p>
									<Button
										onClick={() => window.location.replace("/agency/social-media-marketing/facebook")}
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


