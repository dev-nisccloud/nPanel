"use client";

import * as React from "react";
import { 
  Copy, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Globe,
  Lock,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useWordPressCredentials } from "./use-wordpress-credentials";

interface WordPressSiteCredentialsProps {
  installationId: string;
}

// Loading skeleton component
function CredentialsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            WordPress Admin Credentials
          </CardTitle>
          <CardDescription>Login credentials for WordPress admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Login</p>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Password</p>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Login URL</p>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error component
function CredentialsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load credentials</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching WordPress credentials."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function WordPressSiteCredentials({ installationId }: WordPressSiteCredentialsProps) {
  const { data: credentials, isLoading, isError, error, refetch } = useWordPressCredentials(installationId);
  const [showPassword, setShowPassword] = React.useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return <CredentialsSkeleton />;
  }

  if (isError || !credentials) {
    return <CredentialsError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* WordPress Admin Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            WordPress Admin Credentials
          </CardTitle>
          <CardDescription>Login credentials for WordPress admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Login */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Login</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                  {credentials.login}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.login, "Login")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Password */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                  {showPassword ? credentials.password : "••••••••••••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.password, "Password")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Login URL */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Login URL</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                  {credentials.loginUrl}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.loginUrl, "Login URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(credentials.loginUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Security Notice</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                These credentials provide access to your WordPress installation. Keep them secure and never share them with unauthorized parties. 
                Consider changing default passwords and using strong, unique passwords for better security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
