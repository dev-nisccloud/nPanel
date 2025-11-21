"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Facebook } from "lucide-react";

interface ConnectFacebookProps {
	onConnected?: () => void;
}

export function ConnectFacebook({ onConnected }: ConnectFacebookProps) {
	const [isConnecting, setIsConnecting] = React.useState(false);

	const {
		data: authUrlData,
		isLoading: isLoadingAuthUrl,
		error: authUrlError,
	} = trpc.socialMediaMarketing.meta.auth.generateAuthUrl.useQuery(
		{
			redirectUri: `${window.location.origin}/agency/social-media-marketing/facebook/callback`,
		},
		{
			enabled: false, // Only fetch when button is clicked
		}
	);

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
				sessionStorage.setItem("facebook_oauth_state", state);
			}

			// Redirect to Facebook OAuth
			window.location.href = authUrl;
		},
		onError: (error) => {
			console.error("Error initiating Facebook connection:", error);
			toast.error(error.message || "Failed to connect to Facebook. Please try again.");
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
			console.error("Error initiating Facebook connection:", error);
			toast.error("Failed to connect to Facebook. Please try again.");
			setIsConnecting(false);
		}
	}, [generateAuthUrlMutation]);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<Facebook className="h-8 w-8 text-primary" />
				</div>
				<CardTitle>Connect with Facebook</CardTitle>
				<CardDescription>
					Connect your Facebook account to manage pages, posts, and content. You'll be redirected to Facebook to authorize access.
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
							Connect with Facebook
						</>
					)}
				</Button>
				<p className="mt-4 text-xs text-muted-foreground text-center">
					By connecting, you agree to grant access to your Facebook pages and content management.
				</p>
			</CardContent>
		</Card>
	);
}

