"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { fetchRedirectTarget, goToRedirectTarget, isMfaRedirectTarget } from "@/lib/auth-redirect";
import type { MfaIntent } from "@/lib/mfa-auth";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { MfaVerifyStep } from "@/routes/auth/_components/mfa-verify-step";

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

      let result;
      try {
        result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
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

      if (result?.data) {
        await resolvePostCredentials();
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
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}
