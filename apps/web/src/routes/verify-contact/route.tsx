import { useState } from "react";
import { useSearchParams } from "react-router";
import { TRPCClientError } from "@trpc/client";
import {
  AlertCircle,
  CheckCircle,
  Globe,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

type PageState = "prompt" | "submitting" | "verified" | "rejected" | "error";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}*@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 4))}@${domain}`;
}

export default function VerifyContactPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const authCode = searchParams.get("authCode")?.trim() ?? "";

  const [pageState, setPageState] = useState<PageState>("prompt");
  const [resultMessage, setResultMessage] = useState("");

  const verifyMutation = trpc.openProvider.customers.completeContactEmailVerification.useMutation({
    onSuccess: (data) => {
      if (data.status === "Ok") {
        setPageState("verified");
        setResultMessage(data.message);
        toast.success("Email verified successfully");
        return;
      }

      if (data.status === "Rejected") {
        setPageState("rejected");
        setResultMessage(data.message);
        return;
      }

      setPageState("error");
      setResultMessage(data.message);
      toast.error("Verification failed", { description: data.message });
    },
    onError: (error: unknown) => {
      setPageState("error");
      const message =
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
      setResultMessage(message);
      toast.error("Verification failed", { description: message });
    },
  });

  const handleDecision = async (approve: "yes" | "no") => {
    if (!email || !authCode) return;

    setPageState("submitting");
    await verifyMutation.mutateAsync({ email, authCode, approve });
  };

  const renderStatusIcon = () => {
    if (pageState === "submitting") {
      return (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Spinner variant="ellipsis" className="text-primary" />
        </div>
      );
    }

    if (pageState === "verified") {
      return (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
        </div>
      );
    }

    if (pageState === "rejected") {
      return (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <XCircle className="size-8 text-muted-foreground" />
        </div>
      );
    }

    if (pageState === "error") {
      return (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
        </div>
      );
    }

    return (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="size-8 text-primary" />
      </div>
    );
  };

  const renderTitle = () => {
    switch (pageState) {
      case "submitting":
        return "Processing your response";
      case "verified":
        return "Email verified";
      case "rejected":
        return "Verification declined";
      case "error":
        return "Verification failed";
      default:
        return "Confirm your contact email";
    }
  };

  const renderDescription = () => {
    switch (pageState) {
      case "submitting":
        return "Please wait while we confirm your choice with the domain registry.";
      case "verified":
        return resultMessage || "Your contact email has been verified successfully.";
      case "rejected":
        return resultMessage || "This email address will not be verified for domain registration.";
      case "error":
        return resultMessage || "We could not complete this verification request.";
      default:
        return "ICANN requires registrant contact details to be verified for gTLD domains. Please confirm whether you want to verify this email address.";
    }
  };

  if (!email || !authCode) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/nisc-bg.png')] bg-cover bg-center opacity-[0.07] dark:opacity-[0.04]"
        />
        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <img
              src="/nisclogooriginal.png"
              alt={`${APP_CONFIG.name} logo`}
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Invalid verification link</CardTitle>
              <CardDescription>
                This link is missing required verification details. Please open the link directly
                from your verification email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Need help?</p>
                <p className="mt-1">Contact support@nisccloud.com or call +254 748 777 666.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/nisc-bg.png')] bg-cover bg-center opacity-[0.07] dark:opacity-[0.04]"
      />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <img
            src="/nisclogooriginal.png"
            alt={`${APP_CONFIG.name} logo`}
            width={160}
            height={48}
            className="h-12 w-auto"
          />
        </div>

        <Card className="overflow-hidden border-border/60 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

          <CardHeader className="pb-4 text-center">
            {renderStatusIcon()}
            <CardTitle className="text-2xl">{renderTitle()}</CardTitle>
            <CardDescription className="text-base">{renderDescription()}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {pageState === "prompt" && (
              <>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                      <Globe className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">Email to verify</p>
                      <p className="truncate text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Why am I seeing this?</p>
                      <p>
                        Domain registries require accurate registrant contact information. Verifying
                        your email helps keep your domain active and ensures you receive important
                        notices about your registration.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-11 flex-1"
                    onClick={() => void handleDecision("yes")}
                    disabled={verifyMutation.isPending}
                  >
                    Verify email
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={() => void handleDecision("no")}
                    disabled={verifyMutation.isPending}
                  >
                    Do not verify
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  If you did not request this verification, choose &ldquo;Do not verify&rdquo; or
                  ignore this page.
                </p>
              </>
            )}

            {pageState === "submitting" && (
              <div className="rounded-xl bg-muted/40 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Verifying <span className="font-medium text-foreground">{maskEmail(email)}</span>
                </p>
              </div>
            )}

            {(pageState === "verified" || pageState === "rejected" || pageState === "error") && (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4 text-center text-sm">
                  <p className="text-muted-foreground">Contact email</p>
                  <p className="mt-1 font-medium">{email}</p>
                </div>

                {pageState === "verified" && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-100">
                    Your domain registration contact details are now verified. You can safely close
                    this page.
                  </div>
                )}

                {pageState === "rejected" && (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    No changes were made. If this was a mistake, check your inbox for another
                    verification email or contact our support team.
                  </div>
                )}

                {pageState === "error" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPageState("prompt");
                      setResultMessage("");
                    }}
                  >
                    Try again
                  </Button>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-1 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Nisc Cloud Support</p>
              <p>support@nisccloud.com · +254 748 777 666</p>
              <p>Monday – Friday, 8 AM – 6 PM EAT</p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">{APP_CONFIG.copyright}</p>
      </div>
    </div>
  );
}
