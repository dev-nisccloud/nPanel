"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function ConnectGoogleButton({
  label = "Connect Google Ads",
  size = "sm",
  className,
}: {
  label?: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const initiateOAuth = trpc.customerOAuth.auth.initiateOAuth.useMutation({
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to connect Google Ads");
      setIsConnecting(false);
    },
  });

  return (
    <Button
      onClick={() => {
        setIsConnecting(true);
        initiateOAuth.mutate({
          platform: "google_ads",
          flowType: "connect",
          returnUrl: `${window.location.origin}/agency/social-media-ads/google`,
        });
      }}
      disabled={isConnecting}
      className={cn("shrink-0", className)}
      size={size}
    >
      {isConnecting ? (
        <>
          <Spinner size={16} className="mr-2" />
          Connecting...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function ConnectGoogleCard() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
          G
        </div>
        <CardTitle>Connect with Google Ads</CardTitle>
        <CardDescription>Authorize access, then choose the ad accounts to import.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectGoogleButton label="Connect with Google Ads" size="lg" className="w-full" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting, you agree to grant access to your Google Ads accounts.
        </p>
      </CardContent>
    </Card>
  );
}
