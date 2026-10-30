"use client";

import * as React from "react";
import { Facebook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function ConnectFacebookButton({
  label = "Connect Facebook",
  size = "sm",
  className,
  returnUrl = "/agency/social-media-ads/facebook",
  platform = "meta_facebook",
  beforeConnect,
}: {
  label?: string;
  size?: "sm" | "lg";
  className?: string;
  returnUrl?: string;
  platform?: "meta_facebook" | "meta_facebook_pages";
  beforeConnect?: () => void;
}) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const initiateOAuth = trpc.customerOAuth.auth.initiateOAuth.useMutation({
    onSuccess: (data) => {
      beforeConnect?.();
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to connect Facebook");
      setIsConnecting(false);
    },
  });

  return (
    <Button
      onClick={() => {
        setIsConnecting(true);
        initiateOAuth.mutate({
          platform,
          flowType: "connect",
          returnUrl: `${window.location.origin}${returnUrl}`,
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
          <Facebook className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

export function ConnectFacebookCard() {

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Facebook className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Connect with Meta</CardTitle>
        <CardDescription>
          Authorize access, then choose the ad accounts to import.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectFacebookButton label="Connect with Meta" size="lg" className="w-full" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting, you agree to grant access to your Facebook ad accounts.
        </p>
      </CardContent>
    </Card>
  );
}
