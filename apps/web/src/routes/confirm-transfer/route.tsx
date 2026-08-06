import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { TRPCClientError } from "@trpc/client";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle,
  Globe,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { Button } from "@/components/ui/button";
import { captureEvent } from "@/lib/posthog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

type PageState = "prompt" | "submitting" | "done" | "error";

function statusIcon(state: PageState, opStatus?: string) {
  if (state === "submitting") {
    return (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (state === "done" && opStatus === "Ok") {
    return (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
        <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  if (state === "done" && opStatus === "Rejected") {
    return (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <XCircle className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (state === "error" || (state === "done" && opStatus === "Error")) {
    return (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
      <ArrowRightLeft className="size-8 text-primary" />
    </div>
  );
}

export default function ConfirmTransferPage() {
  const [searchParams] = useSearchParams();
  const domainId = searchParams.get("domainId")?.trim() ?? "";
  const authCode = searchParams.get("authCode")?.trim() ?? "";
  const domain = searchParams.get("domain")?.trim() ?? "";

  const [pageState, setPageState] = useState<PageState>("prompt");
  const [resultStatus, setResultStatus] = useState<string>("");
  const [resultMessage, setResultMessage] = useState("");

  const confirmMutation = trpc.openProvider.domains.completeTransferFoaConfirmation.useMutation({
    onSuccess: (data) => {
      setResultStatus(data.status);
      setResultMessage(data.message);
      setPageState(data.status === "Error" ? "error" : "done");
      if (data.status !== "Error") {
        const tld = domain.includes(".")
          ? `.${domain.split(".").slice(1).join(".")}`
          : undefined;
        captureEvent("domain_transfer_completed", {
          ...(tld ? { tld } : {}),
        });
      }
    },
    onError: (error: unknown) => {
      setPageState("error");
      setResultStatus("Error");
      setResultMessage(
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      );
    },
  });

  const handleDecision = async (approve: "yes" | "no") => {
    if (!domainId || !authCode) return;
    setPageState("submitting");
    await confirmMutation.mutateAsync({ domainId, authCode, approve });
  };

  const pageShell = (children: ReactNode) => (
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
        {children}
        <p className="mt-6 text-center text-xs text-muted-foreground">{APP_CONFIG.copyright}</p>
      </div>
    </div>
  );

  if (!domainId || !authCode) {
    return pageShell(
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Invalid transfer link</CardTitle>
          <CardDescription>
            This link is missing required transfer details. Please open the link directly from your
            transfer confirmation email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Need help?</p>
            <p className="mt-1">Contact support@nisccloud.com or call +254 748 777 666.</p>
          </div>
        </CardContent>
      </Card>,
    );
  }

  const displayDomain = domain || "your domain";
  const isResult = pageState === "done" || pageState === "error";

  return pageShell(
    <Card className="overflow-hidden border-border/60 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

      <CardHeader className="pb-4 text-center">
        {statusIcon(pageState, resultStatus)}
        <CardTitle className="text-2xl">
          {pageState === "submitting"
            ? "Processing your response"
            : isResult
              ? resultMessage
              : "Confirm domain transfer"}
        </CardTitle>
        {!isResult && pageState !== "submitting" && (
          <CardDescription className="text-base">
            ICANN requires explicit approval before a gTLD domain transfer can proceed. Please
            confirm whether you authorize this transfer.
          </CardDescription>
        )}
        {pageState === "submitting" && (
          <CardDescription className="text-base">
            Please wait while your response is sent to the domain registry.
          </CardDescription>
        )}
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
                  <p className="text-sm font-medium">Domain</p>
                  <p className="truncate text-sm text-muted-foreground">{displayDomain}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">What happens next?</p>
                  <p>
                    If you approve, the transfer request will proceed according to registry rules.
                    If you decline, the transfer will not be authorized. If you did not initiate
                    this transfer, choose decline.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-11 flex-1"
                onClick={() => void handleDecision("yes")}
                disabled={confirmMutation.isPending}
              >
                Approve transfer
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1"
                onClick={() => void handleDecision("no")}
                disabled={confirmMutation.isPending}
              >
                Decline transfer
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              If you are unsure about this request, contact support before approving.
            </p>
          </>
        )}

        {pageState === "submitting" && (
          <div className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Submitting your decision for{" "}
            <span className="font-medium text-foreground">{displayDomain}</span>
          </div>
        )}

        {isResult && (
          <div className="space-y-4">
            {domain && (
              <div className="rounded-xl bg-muted/40 p-4 text-center text-sm">
                <p className="text-muted-foreground">Domain</p>
                <p className="mt-1 font-medium">{domain}</p>
              </div>
            )}

            {pageState === "error" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPageState("prompt");
                  setResultMessage("");
                  setResultStatus("");
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
    </Card>,
  );
}
