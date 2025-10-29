"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Wrap the auth call in its own try-catch to ensure errors are caught
      let result;
      try {
        result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          rememberMe: data.remember, // Pass remember preference to backend
        });
      } catch (authError: unknown) {
        // Handle auth client errors
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
        return;
      }
      
      if (result?.data) {
        toast.success("Login successful!");
        
        // Redirect to root - server-side auth layout will handle role-based redirect
        window.location.href = "/";
      } else if (result?.error) {
        // Handle error response from auth
        const errorMessage = result.error.message || "Invalid credentials. Please try again.";
        toast.error("Login failed", {
          description: errorMessage,
        });
      } else {
        toast.error("Login failed", {
          description: "Invalid credentials. Please try again.",
        });
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
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="text-muted-foreground ml-1 text-sm font-medium">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
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
        
        <div className="text-center">
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </form>
    </Form>
  );
}
