"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Globe } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { toast } from "@/components/ui/sonner";

import { LoginForm } from "@/routes/auth/_components/login-form";
import { GoogleButton } from "@/routes/auth/_components/social-auth/google-button";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [showCredentialsChrome, setShowCredentialsChrome] = useState(true);

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error && message) {
      toast.error(decodeURIComponent(message));
    }
  }, [searchParams]);

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        {showCredentialsChrome ? (
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-medium">Login to your account</h1>
            <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
          </div>
        ) : null}
        <div className="space-y-4">
          {showCredentialsChrome ? (
            <>
              <GoogleButton className="w-full" />
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
            </>
          ) : null}
          <LoginForm onChromeVisibilityChange={setShowCredentialsChrome} />
          {showCredentialsChrome ? (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link className="text-primary hover:underline" to="/auth/register">
                Register
              </Link>
            </div>
          ) : null}
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
