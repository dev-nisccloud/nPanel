"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Globe } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { toast } from "@/components/ui/sonner";

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

    if (redirectPath && inviteCode) {
      sessionStorage.setItem("pendingInviteRedirect", redirectPath);
      sessionStorage.setItem("pendingInviteCode", inviteCode);
    }
  }, [searchParams]);

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Create your account</h1>
          <p className="text-muted-foreground text-sm">Please enter your details to register.</p>
        </div>
        <div className="space-y-4">
          <RegisterForm
            termsAccepted={termsAccepted}
            onTermsAcceptedChange={setTermsAccepted}
          />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">or continue with</span>
          </div>
          <GoogleButton
            className="w-full"
            mode="signup"
            termsAccepted={termsAccepted}
            disabled={!termsAccepted}
          />
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link className="text-primary hover:underline" to={loginHref}>
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </>
  );
}
