"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FacebookCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [hasProcessed, setHasProcessed] = React.useState(false);

	const generateTokenMutation = trpc.socialMediaMarketing.meta.auth.generateToken.useMutation({
		onSuccess: () => {
			setStatus("success");
			setHasProcessed(true);
			toast.success("Facebook account connected successfully!");
			// Redirect to main Facebook page after a short delay
			setTimeout(() => {
				router.push("/agency/social-media-marketing/facebook");
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

		// Validate state
		const storedState = sessionStorage.getItem("facebook_oauth_state");
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
				redirectUri: `${window.location.origin}/agency/social-media-marketing/facebook/callback`,
			});
		} else {
			setStatus("error");
			setHasProcessed(true);
			setErrorMessage("No authorization code received from Facebook");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

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
										Redirecting to Facebook page...
									</p>
								</>
							)}

							{status === "error" && (
								<>
									<AlertCircle className="h-12 w-12 text-destructive mb-4" />
									<p className="text-sm text-destructive mb-4">{errorMessage}</p>
									<Button
										onClick={() => router.push("/agency/social-media-marketing/facebook")}
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


