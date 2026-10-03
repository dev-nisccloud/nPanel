"use client";

import * as React from "react";
import { Facebook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";

import { FACEBOOK_WORKSPACE_CONNECTED_KEY } from "./mock-data";

export function ConnectFacebookCard({ onConnected }: { onConnected: () => void }) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    window.setTimeout(() => {
      sessionStorage.setItem(FACEBOOK_WORKSPACE_CONNECTED_KEY, "1");
      toast.success("Facebook connected");
      setIsConnecting(false);
      onConnected();
    }, 700);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Facebook className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Connect with Meta</CardTitle>
        <CardDescription>
          Connect your Facebook account to manage pages and ad campaigns. You'll be redirected to Meta to authorize
          access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={isConnecting} className="w-full" size="lg">
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
          By connecting, you agree to grant access to your Facebook pages and ad accounts.
        </p>
      </CardContent>
    </Card>
  );
}
