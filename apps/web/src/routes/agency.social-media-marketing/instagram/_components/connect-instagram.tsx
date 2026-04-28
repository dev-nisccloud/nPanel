"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Instagram } from "lucide-react";

interface ConnectInstagramProps {
	onConnected?: () => void;
}

export function ConnectInstagram({ onConnected: _onConnected }: ConnectInstagramProps) {
	const [isConnecting, setIsConnecting] = React.useState(false);

	const generateAuthUrlMutation = trpc.socialMediaMarketing.instagram.auth.generateAuthUrl.useMutation({
		onSuccess: (data) => {
			const authUrl = data.data?.url;
			const state = data.data?.state;

			if (!authUrl) {
				toast.error("Invalid OAuth URL response");
				setIsConnecting(false);
				return;
			}

			if (state) {
				sessionStorage.setItem("instagram_oauth_state", state);
			}

			window.location.href = authUrl;
		},
		onError: (error) => {
			console.error("Error initiating Instagram connection:", error);
			toast.error(error.message || "Failed to connect to Instagram. Please try again.");
			setIsConnecting(false);
		},
	});

	const handleConnect = React.useCallback(() => {
		try {
			setIsConnecting(true);
			generateAuthUrlMutation.mutate({
				redirectUri: `${window.location.origin}/agency/social-media-marketing/instagram/callback`,
			});
		} catch (error) {
			console.error("Error initiating Instagram connection:", error);
			toast.error("Failed to connect to Instagram. Please try again.");
			setIsConnecting(false);
		}
	}, [generateAuthUrlMutation]);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<Instagram className="h-8 w-8 text-primary" />
				</div>
				<CardTitle>Connect with Instagram</CardTitle>
				<CardDescription>
					Connect your Instagram professional account to manage profile, content, comments, and messages. You'll be redirected to Instagram to authorize access.
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
							<Instagram className="mr-2 h-4 w-4" />
							Connect with Instagram
						</>
					)}
				</Button>
				<p className="mt-4 text-xs text-muted-foreground text-center">
					By connecting, you grant the agency permission to manage your Instagram professional account on your behalf.
				</p>
			</CardContent>
		</Card>
	);
}
