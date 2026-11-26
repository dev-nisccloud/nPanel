"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { toast } from "@/components/ui/sonner";
import { persistPendingAuthRedirect } from "@/lib/auth-redirect";

import { RegisterForm } from "@/routes/auth/_components/register-form";
import { GoogleButton } from "@/routes/auth/_components/social-auth/google-button";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const authSearch = searchParams.toString();
  const loginHref = authSearch ? `/auth/login?${authSearch}` : "/auth/login";

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error && message) {
      toast.error(decodeURIComponent(message));
    } else if (error === "oauth_failed") {
      toast.error("Google sign-up failed", {
        description: "Please try again or use email registration.",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const redirectPath = searchParams.get("redirect");
    const inviteCode = searchParams.get("code");

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
        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-foreground underline underline-offset-4" to={loginHref}>
              Sign in
            </Link>
          </p>
        </div>
        <RegisterForm termsAccepted={termsAccepted} onTermsAcceptedChange={setTermsAccepted} />
        <div className="space-y-4">
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">or sign up with</span>
          </div>
          <GoogleButton
            variant="outline"
            className="h-12 w-full"
            mode="signup"
            termsAccepted={termsAccepted}
            disabled={!termsAccepted}
          />
          {!termsAccepted ? (
            <p className="text-xs text-muted-foreground">Accept the Terms and Conditions to continue with Google.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
