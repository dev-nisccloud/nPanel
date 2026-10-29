"use client";

import * as React from "react";
import { Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function ConnectLinkedInButton({
  label = "Connect LinkedIn",
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
      toast.error(error.message || "Failed to connect LinkedIn");
      setIsConnecting(false);
    },
  });

  return (
    <Button
      onClick={() => {
        setIsConnecting(true);
        initiateOAuth.mutate({
          platform: "linkedin_ads",
          flowType: "connect",
          returnUrl: `${window.location.origin}/agency/social-media-ads/linkedin`,
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
        <>
          <Linkedin className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

export function ConnectLinkedInCard() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Linkedin className="h-8 w-8" />
        </div>
        <CardTitle>Connect with LinkedIn</CardTitle>
        <CardDescription>
          Authorize access, then choose the ad accounts to import.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectLinkedInButton label="Connect with LinkedIn" size="lg" className="w-full" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting, you agree to grant access to your LinkedIn ad accounts.
        </p>
      </CardContent>
    </Card>
  );
}
