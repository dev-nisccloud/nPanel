"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function InstagramCallbackPage() {
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);

	const generateTokenMutation = trpc.socialMediaMarketing.instagram.auth.generateToken.useMutation({
		onSuccess: () => {
			setStatus("success");
			setHasProcessed(true);
			toast.success("Instagram account connected successfully!");
			// Hard redirect so refreshing the callback does not re-run the exchange.
			setTimeout(() => {
				window.location.replace("/agency/social-media-marketing/instagram");
			}, 2000);
		},
		onError: (error) => {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(error.message || "Failed to connect Instagram account");
			toast.error(error.message || "Failed to connect Instagram account");
		},
	});

	React.useEffect(() => {
		// Prevent multiple executions
		if (hasProcessed) {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		const error = searchParams.get("error");
		const errorReason = searchParams.get("error_reason");
		const errorDescription = searchParams.get("error_description");

		// Check for OAuth errors first
		if (error) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage(
				errorDescription || errorReason || "Instagram authorization was cancelled or failed"
			);
			return;
		}

		// Instagram appends `#_` to the redirect URI fragment. The code value
		// from searchParams may therefore include a trailing `#_` - strip it.
		let code = searchParams.get("code");
		if (code) {
			// Remove any trailing fragment characters (e.g. "#_" Instagram appends)
			code = code.replace(/#.*$/, "");
		}

		const state = searchParams.get("state");

		// Validate state to prevent CSRF
		const storedState = sessionStorage.getItem("instagram_oauth_state");
		if (state && storedState && state !== storedState) {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("Invalid state parameter. Please try connecting again.");
			return;
		}
		sessionStorage.removeItem("instagram_oauth_state");

		// Guard against re-processing the same code (e.g. page refresh)
		const lastProcessedCode = sessionStorage.getItem("instagram_oauth_last_code");
		if (code && lastProcessedCode === code) {
			setStatus("success");
			setHasProcessed(true);
			setTimeout(() => {
				window.location.replace("/agency/social-media-marketing/instagram");
			}, 1000);
			return;
		}

		// Exchange code for token
		if (code) {
			setHasProcessed(true);
			sessionStorage.setItem("instagram_oauth_last_code", code);
			generateTokenMutation.mutate({
				code,
				redirectUri: `${window.location.origin}/agency/social-media-marketing/instagram/callback`,
			});
		} else {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("No authorization code received from Instagram");
		}
	}, [generateTokenMutation, hasProcessed]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Connecting Instagram</CardTitle>
						<CardDescription>
							{status === "loading" && "Please wait while we connect your Instagram account..."}
							{status === "success" && "Your Instagram account has been connected successfully!"}
							{status === "error" && "Failed to connect your Instagram account"}
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
										onClick={() =>
											window.location.replace("/agency/social-media-marketing/instagram")
										}
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
