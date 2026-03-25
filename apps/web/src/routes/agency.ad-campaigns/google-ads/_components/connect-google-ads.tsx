"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { ShoppingCart } from "lucide-react";

interface ConnectGoogleAdsProps {
	onConnected?: () => void;
}

export function ConnectGoogleAds({ onConnected }: ConnectGoogleAdsProps) {
	const [isConnecting, setIsConnecting] = React.useState(false);

	const generateAuthUrlMutation = trpc.googleAds.auth.generateAuthUrl.useMutation({
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
				sessionStorage.setItem("google_ads_oauth_state", state);
			}

			// Redirect to Google OAuth
			window.location.href = authUrl;
		},
		onError: (error) => {
			console.error("Error initiating Google Ads connection:", error);
			toast.error(error.message || "Failed to connect to Google Ads. Please try again.");
			setIsConnecting(false);
		},
	});

	const handleConnect = React.useCallback(async () => {
		try {
			setIsConnecting(true);
			generateAuthUrlMutation.mutate({
				redirectUri: `${window.location.origin}/agency/ad-campaigns/google-ads/callback`,
			});
		} catch (error) {
			console.error("Error initiating Google Ads connection:", error);
			toast.error("Failed to connect to Google Ads. Please try again.");
			setIsConnecting(false);
		}
	}, [generateAuthUrlMutation]);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<ShoppingCart className="h-8 w-8 text-primary" />
				</div>
				<CardTitle>Connect with Google Ads</CardTitle>
				<CardDescription>
					Connect your Google Ads account to manage campaigns, keywords, and performance. You'll be redirected to Google to authorize access.
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
							<ShoppingCart className="mr-2 h-4 w-4" />
							Connect with Google Ads
						</>
					)}
				</Button>
				<p className="mt-4 text-xs text-muted-foreground text-center">
					By connecting, you agree to grant access to your Google Ads accounts and campaign data.
				</p>
			</CardContent>
		</Card>
	);
}

