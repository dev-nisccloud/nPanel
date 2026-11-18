"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { toast } from "@/components/ui/sonner";
import { persistPendingAuthRedirect } from "@/lib/auth-redirect";

import { LoginForm } from "@/routes/auth/_components/login-form";
import { GoogleButton } from "@/routes/auth/_components/social-auth/google-button";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [showCredentialsChrome, setShowCredentialsChrome] = useState(true);
  const authSearch = searchParams.toString();
  const registerHref = authSearch ? `/auth/register?${authSearch}` : "/auth/register";

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error && message) {
      toast.error(decodeURIComponent(message));
    }
  }, [searchParams]);

  useEffect(() => {
    const redirectPath = searchParams.get("redirect");
    const inviteCode = searchParams.get("code");

    // Survive refresh / OAuth / MFA navigations that drop `?redirect=` from the URL.
    if (redirectPath) {
      persistPendingAuthRedirect(redirectPath);
    }

    if (redirectPath && inviteCode) {
      sessionStorage.setItem("pendingInviteRedirect", redirectPath);
      sessionStorage.setItem("pendingInviteCode", inviteCode);
    }
  }, [searchParams]);

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        {showCredentialsChrome ? (
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              New to Nisc Cloud?{" "}
              <Link className="font-medium text-foreground underline underline-offset-4" to={registerHref}>
                Register
              </Link>
            </p>
          </div>
        ) : null}
        <LoginForm onChromeVisibilityChange={setShowCredentialsChrome} />
        {showCredentialsChrome ? (
          <div className="space-y-4">
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">or sign in with</span>
            </div>
            <GoogleButton variant="outline" className="h-12 w-full" />
          </div>
        ) : null}
      </div>
    </>
  );
}
