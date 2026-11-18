"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";

import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TermsAcceptanceField } from "@/routes/auth/_components/terms-acceptance-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { redirectToTarget } from "@/lib/auth-redirect";
import { captureEvent } from "@/lib/posthog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Turnstile } from "@/components/turnstile";

const FormSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms === true, {
    message: "You must accept the Terms and Conditions to create an account.",
    path: ["acceptTerms"],
  });

type RegisterFormProps = {
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
};

export function RegisterForm({ termsAccepted, onTermsAcceptedChange }: RegisterFormProps) {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const redirectPath = searchParams.get("redirect");
  const inviteCode = searchParams.get("code");
  
  const { data: session, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const acceptTermsValue = form.watch("acceptTerms");
  useEffect(() => {
    onTermsAcceptedChange(acceptTermsValue === true);
  }, [acceptTermsValue, onTermsAcceptedChange]);

  // Reset state on mount to ensure clean state when component remounts
  useEffect(() => {
    setIsSubmitting(false);
    setIsEmailSent(false);
    setRedirectFailed(false);
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!isPending && session) {
      redirectToTarget(0).then((didRedirect) => {
        if (!didRedirect) setRedirectFailed(true);
      }).catch(() => {
        setRedirectFailed(true);
      });
    }
  }, [session, isPending]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Wrap the auth call in its own try-catch to ensure errors are caught
      let result;
      try {
        result = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
          acceptedTermsAndConditions: true,
          fetchOptions: captchaToken ? { headers: { "x-captcha-response": captchaToken } } : undefined,
        } as Parameters<typeof authClient.signUp.email>[0]);
        setCaptchaResetKey((value) => value + 1);
      } catch (authError: unknown) {
        // Handle auth client errors
        console.error("Auth client error:", authError);
        
        let errorMessage = "Please check your information and try again.";
        
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
        
        toast.error("Registration failed", {
          description: errorMessage,
        });
        setIsSubmitting(false);
        return;
      }
      
      if (result?.data) {
        captureEvent("user_signed_up", {
          method: "email",
          has_referred: Boolean(inviteCode),
        });
        captureEvent("email_verification_sent");
        setIsEmailSent(true);
        toast.success("Please check your email to verify your account");
        // Don't reset isSubmitting on success - keep state consistent
        return;
      } else if (result?.error) {
        // Handle error response from auth
        const errorMessage = result.error.message || "Unable to create account. Please try again.";
        toast.error("Registration failed", {
          description: errorMessage,
        });
        setIsSubmitting(false);
      } else {
        toast.error("Registration failed", {
          description: "Unable to create account. Please try again.",
        });
        setIsSubmitting(false);
      }
    } catch (error: unknown) {
      console.error("Unexpected registration error:", error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      }
      
      toast.error("Registration failed", {
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  // Redirecting already-logged-in user (don't flash the form).
  // If the redirect failed, fall through and show the form.
  if (!isPending && session && !redirectFailed) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Spinner variant="ellipsis" className="text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  if (isEmailSent) {
    const successMessage = redirectPath && inviteCode
      ? "We've sent a verification link to your email address. After verifying, you'll be redirected back to accept the organization invitation."
      : "We've sent a verification link to your email address. Please click the link to verify your account and get started.";
    
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="mb-4 text-xl font-medium">Check Your Email</h1>
        <p className="mb-6 text-muted-foreground">
          {successMessage}
        </p>
      </div>
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
              // Handle validation errors
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Full name</FormLabel>
              <FormControl>
                <Input id="name" type="text" placeholder="Full name" autoComplete="name" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                    placeholder="Password (8+ characters)"
                    autoComplete="new-password"
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Confirm password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="h-12 pr-16"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-3 h-full text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <TermsAcceptanceField field={field} id="register-accept-terms" />
          )}
        />
        <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <Button
          className="h-12 w-full bg-foreground text-background hover:bg-foreground/90"
          type="submit"
          disabled={isSubmitting || !termsAccepted}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner variant="ellipsis" className="text-background" size="sm" />
              <span>Creating account...</span>
            </div>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
}
