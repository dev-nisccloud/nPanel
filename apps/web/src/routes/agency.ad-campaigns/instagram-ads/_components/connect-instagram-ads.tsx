"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Instagram } from "lucide-react";

interface ConnectInstagramAdsProps {
	onConnected?: () => void;
}

export function ConnectInstagramAds({ onConnected }: ConnectInstagramAdsProps) {
	const [isConnecting, setIsConnecting] = React.useState(false);

	// Reuse social media marketing Instagram auth
	const generateAuthUrlMutation = trpc.socialMediaMarketing.instagram.auth.generateAuthUrl.useMutation({
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
				sessionStorage.setItem("instagram_ads_oauth_state", state);
			}

			// Redirect to Instagram OAuth
			window.location.href = authUrl;
		},
		onError: (error) => {
			console.error("Error initiating Instagram Ads connection:", error);
			toast.error(error.message || "Failed to connect to Instagram. Please try again.");
			setIsConnecting(false);
		},
	});

	const handleConnect = React.useCallback(async () => {
		try {
			setIsConnecting(true);
			generateAuthUrlMutation.mutate({
				redirectUri: `${window.location.origin}/agency/social-media-marketing/instagram/callback`,
			});
		} catch (error) {
			console.error("Error initiating Instagram Ads connection:", error);
			toast.error("Failed to connect to Instagram. Please try again.");
			setIsConnecting(false);
		}
	}, [generateAuthUrlMutation]);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10">
					<Instagram className="h-8 w-8 text-pink-600" />
				</div>
				<CardTitle>Connect with Instagram</CardTitle>
				<CardDescription>
					Connect your Instagram Professional account to manage ad campaigns, ad sets, and ads. You'll be redirected to Instagram to authorize access.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onClick={handleConnect}
					disabled={isConnecting}
					className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 border-none text-white font-bold"
					size="lg"
				>
					{isConnecting ? (
						<>
							<Spinner size={16} className="mr-2" />
							Connecting...
						</>
					) : (
						<>
							<Instagram className="mr-2 h-4 w-4" />
							Connect with Instagram
						</>
					)}
				</Button>
				<p className="mt-4 text-xs text-muted-foreground text-center">
					By connecting, you agree to grant access to your Instagram ad accounts and campaign data.
				</p>
			</CardContent>
		</Card>
	);
}








