"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const FormSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const redirectPath = searchParams.get("redirect");
  const inviteCode = searchParams.get("code");
  
  const { isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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
        });
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
        return;
      }
      
      if (result?.data) {
        setIsEmailSent(true);
        toast.success("Please check your email to verify your account");
      } else if (result?.error) {
        // Handle error response from auth
        const errorMessage = result.error.message || "Unable to create account. Please try again.";
        toast.error("Registration failed", {
          description: errorMessage,
        });
      } else {
        toast.error("Registration failed", {
          description: "Unable to create account. Please try again.",
        });
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (isEmailSent) {
    const successMessage = redirectPath && inviteCode
      ? "We've sent a verification link to your email address. After verifying, you'll be redirected back to accept the team invitation."
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
        <h1 className="mb-4 text-2xl font-bold">Check Your Email</h1>
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
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input id="name" type="text" placeholder="John Doe" autoComplete="name" {...field} />
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
                    autoComplete="new-password"
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
              <span>Creating account...</span>
            </div>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </Form>
  );
}
