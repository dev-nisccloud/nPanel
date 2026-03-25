"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Globe, CheckCircle, XCircle } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setVerificationStatus("error");
      setErrorMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      setIsVerifying(true);
      try {
        const result = await authClient.verifyEmail({
          query: { token: token },
        });

        if (result.error) {
          setVerificationStatus("error");
          setErrorMessage(result.error.message || "Failed to verify email");
          toast.error("Verification failed", {
            description: result.error.message || "Failed to verify email",
          });
          return;
        }

        setVerificationStatus("success");
        toast.success("Email verified successfully!");

        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectPath = params.get("redirect");
          const inviteCode = params.get("code");
          if (redirectPath === "/accept-invite" && inviteCode) {
            window.location.href = `/accept-invite?code=${encodeURIComponent(inviteCode)}`;
          } else {
            window.location.href = "/";
          }
        }, 2000);
      } catch (error: unknown) {
        setVerificationStatus("error");

        let msg = "Email verification failed. Please try again.";
        if (error && typeof error === "object") {
          const e = error as Record<string, unknown>;
          if (typeof e.message === "string") msg = e.message;
        }

        setErrorMessage(msg);
        toast.error("Verification failed", {
          description: msg,
        });
      } finally {
        setIsVerifying(false);
      }
    };

    void verifyEmail();
  }, [token]);

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Spinner variant="ellipsis" className="text-primary" />
          </div>
          <h1 className="text-3xl font-medium">Verifying your email</h1>
          <p className="text-muted-foreground text-sm">Please wait while we verify your email address...</p>
        </div>
      );
    }

    if (verificationStatus === "success") {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-medium">Email verified!</h1>
          <p className="text-muted-foreground text-sm">
            {searchParams.get("redirect") === "/accept-invite"
              ? "Your email has been successfully verified. You will be redirected back to accept the team invitation."
              : "Your email has been successfully verified. You will be redirected shortly."}
          </p>
          <div className="pt-4">
            <Link
              to={
                searchParams.get("redirect") === "/accept-invite" && searchParams.get("code")
                  ? `/accept-invite?code=${encodeURIComponent(searchParams.get("code")!)}`
                  : "/"
              }
              className="text-primary hover:underline"
            >
              {searchParams.get("redirect") === "/accept-invite"
                ? "Continue to Team Invitation"
                : "Continue to Dashboard"}
            </Link>
          </div>
        </div>
      );
    }

    if (verificationStatus === "error") {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-medium">Verification failed</h1>
          <p className="text-muted-foreground text-sm">{errorMessage}</p>
          <div className="space-y-2 pt-4">
            <Link to="/auth/register" className="block text-primary hover:underline">
              Try registering again
            </Link>
            <Link to="/auth/login" className="block text-primary hover:underline">
              Go to Login
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">{renderContent()}</div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          <Link className="text-foreground" to="/auth/login">
            Back to Login
          </Link>
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
