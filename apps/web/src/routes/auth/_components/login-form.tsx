"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { fetchRedirectTarget, goToRedirectTarget, getRequestedRedirectFromSearch, isMfaRedirectTarget, persistPendingAuthRedirect } from "@/lib/auth-redirect";
import type { MfaIntent } from "@/lib/mfa-auth";
import { captureEvent } from "@/lib/posthog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { MfaVerifyStep } from "@/routes/auth/_components/mfa-verify-step";
import { Turnstile } from "@/components/turnstile";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginAuthStep = "credentials" | "mfa";

type LoginFormProps = {
  onChromeVisibilityChange?: (visible: boolean) => void;
};

export function LoginForm({ onChromeVisibilityChange }: LoginFormProps) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState<LoginAuthStep>("credentials");
  const [mfaIntent, setMfaIntent] = useState<MfaIntent>("LOGIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const setAuthStep = useCallback((next: LoginAuthStep) => {
    setStep(next);
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    setIsSubmitting(false);
    setRedirectFailed(false);
  }, []);

  const completeSignIn = useCallback(async () => {
    const target = await fetchRedirectTarget(50);
    const didRedirect = goToRedirectTarget(target, navigate);
    if (!didRedirect) {
      setRedirectFailed(true);
    }
  }, [navigate]);

  const beginMfaStep = useCallback(
    async (intent: MfaIntent) => {
      persistPendingAuthRedirect(getRequestedRedirectFromSearch(window.location.search));
      setMfaIntent(intent);
      setAuthStep("mfa");
    },
    [setAuthStep],
  );

  const resolvePostCredentials = useCallback(async () => {
    try {
      const target = await fetchRedirectTarget(50);
      if (isMfaRedirectTarget(target)) {
        await beginMfaStep("LOGIN");
        return;
      }
      const didRedirect = goToRedirectTarget(target, navigate);
      if (!didRedirect) {
        setRedirectFailed(true);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not continue sign-in.";
      toast.error("Sign-in error", { description: message });
    } finally {
      setIsSubmitting(false);
      setIsCheckingSession(false);
    }
  }, [beginMfaStep, navigate]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!isPending && session && step === "credentials") {
      setIsCheckingSession(true);
      void resolvePostCredentials().finally(() => {
        setIsCheckingSession(false);
      });
    }
  }, [session, isPending, step, resolvePostCredentials]);

  const isRedirecting = session && !isPending && !redirectFailed && step === "credentials";
  const showCredentialsChrome =
    step === "credentials" && !isSubmitting && !isCheckingSession && !isRedirecting;

  useEffect(() => {
    onChromeVisibilityChange?.(showCredentialsChrome);
  }, [onChromeVisibilityChange, showCredentialsChrome]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setIsSubmitting(true);
      setUnverifiedEmail(null);

      let result;
      try {
        result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          fetchOptions: captchaToken ? { headers: { "x-captcha-response": captchaToken } } : undefined,
        });
      } catch (authError: unknown) {
        console.error("Auth client error:", authError);

        let errorMessage = "Please check your credentials and try again.";

        if (authError && typeof authError === "object") {
          const err = authError as Record<string, unknown>;
          if (err.message && typeof err.message === "string") {
            errorMessage = err.message;
          } else if (err.error && typeof err.error === "object") {
            const errObj = err.error as Record<string, unknown>;
            if (errObj.message && typeof errObj.message === "string") {
              errorMessage = errObj.message;
            }
          }
        }

        toast.error("Login failed", {
          description: errorMessage,
        });
        setIsSubmitting(false);
        return;
      }

      setCaptchaResetKey((value) => value + 1);

      if (result?.data) {
        captureEvent("user_logged_in", { method: "email" });
        await resolvePostCredentials();
        return;
      }

      if (result?.error?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email);
        setIsSubmitting(false);
        return;
      }

      if (result?.error) {
        const errorMessage = result.error.message || "Invalid credentials. Please try again.";
        toast.error("Login failed", {
          description: errorMessage,
        });
        setIsSubmitting(false);
      } else {
        toast.error("Login failed", {
          description: "Invalid credentials. Please try again.",
        });
        setIsSubmitting(false);
      }
    } catch (error: unknown) {
      console.error("Unexpected login error:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      }

      toast.error("Login failed", {
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  if (isSubmitting || isCheckingSession || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Spinner variant="ellipsis" className="text-primary" />
        <p className="text-sm text-muted-foreground">
          {isSubmitting ? "Signing you in…" : "Redirecting…"}
        </p>
      </div>
    );
  }

  if (step === "mfa") {
    return (
      <MfaVerifyStep
        initialIntent={mfaIntent}
        onBack={() => {
          void authClient.signOut().finally(() => {
            setAuthStep("credentials");
          });
        }}
        onVerified={completeSignIn}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(
            onSubmit,
            (errors) => {
              console.log("Form validation errors:", errors);
              const errorMessages = Object.values(errors)
                .map((error) => error?.message)
                .filter(Boolean);

              if (errorMessages.length > 0) {
                toast.error("Validation Error", {
                  description: errorMessages[0] as string,
                });
              }
            }
          )(e).catch((error) => {
            console.error("Form submission error:", error);
            toast.error("Submission Error", {
              description: error?.message || "An unexpected error occurred",
            });
          });
        }}
        className="space-y-3"
      >
        {unverifiedEmail ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[#38b6ff]/40 bg-[#38b6ff]/10 px-4 py-3 text-sm text-foreground"
          >
            <p className="font-semibold">Confirm your email to sign in</p>
            <p className="mt-1 text-muted-foreground">
              We&apos;ve sent a new link to <span className="font-medium text-foreground">{unverifiedEmail}</span>.
              Open it, then sign in here. The link expires in 1 hour. Check spam if you can&apos;t see it.
            </p>
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Email address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="Email address" autoComplete="email" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="h-12 pr-16"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-3 h-full text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-foreground underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>
        <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <Button className="h-12 w-full bg-foreground text-background hover:bg-foreground/90" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner variant="ellipsis" className="text-background" size="sm" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
