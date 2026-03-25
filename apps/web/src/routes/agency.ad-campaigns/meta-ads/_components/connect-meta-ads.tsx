"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Facebook } from "lucide-react";

interface ConnectMetaAdsProps {
	onConnected?: () => void;
}

export function ConnectMetaAds({ onConnected }: ConnectMetaAdsProps) {
	const [isConnecting, setIsConnecting] = React.useState(false);

	// Reuse social media marketing Meta auth
	const generateAuthUrlMutation = trpc.socialMediaMarketing.meta.auth.generateAuthUrl.useMutation({
		onSuccess: (data) => {
			const authUrl = data.data?.url;
			const state = data.data?.state;

			if (!authUrl) {
				toast.error("Invalid OAuth URL response");
				setIsConnecting(false);
				return;
			}

			// Store state for validation in callback
			if (state) {
				sessionStorage.setItem("meta_ads_oauth_state", state);
			}

			// Redirect to Meta OAuth
			window.location.href = authUrl;
		},
		onError: (error) => {
			console.error("Error initiating Meta Ads connection:", error);
			toast.error(error.message || "Failed to connect to Meta. Please try again.");
			setIsConnecting(false);
		},
	});

	const handleConnect = React.useCallback(async () => {
		try {
			setIsConnecting(true);
			generateAuthUrlMutation.mutate({
				redirectUri: `${window.location.origin}/agency/social-media-marketing/facebook/callback`,
			});
		} catch (error) {
			console.error("Error initiating Meta Ads connection:", error);
			toast.error("Failed to connect to Meta. Please try again.");
			setIsConnecting(false);
		}
	}, [generateAuthUrlMutation]);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<Facebook className="h-8 w-8 text-primary" />
				</div>
				<CardTitle>Connect with Meta</CardTitle>
				<CardDescription>
					Connect your Meta (Facebook) account to manage ad campaigns, ad sets, and ads. You'll be redirected to Meta to authorize access.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onClick={handleConnect}
					disabled={isConnecting}
					className="w-full"
					size="lg"
				>
					{isConnecting ? (
						<>
							<Spinner size={16} className="mr-2" />
							Connecting...
						</>
					) : (
						<>
							<Facebook className="mr-2 h-4 w-4" />
							Connect with Meta
						</>
					)}
				</Button>
				<p className="mt-4 text-xs text-muted-foreground text-center">
					By connecting, you agree to grant access to your Meta ad accounts and campaign data.
				</p>
			</CardContent>
		</Card>
	);
}







