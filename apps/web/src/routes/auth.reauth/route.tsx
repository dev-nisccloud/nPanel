"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { APP_CONFIG } from "@/config/app-config";
import { redirectToTarget } from "@/lib/auth-redirect";
import { fetchReauthStatus, submitReauthPassword } from "@/lib/reauth-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function ReauthPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const status = await fetchReauthStatus();
        if (cancelled) return;
        if (!status.required) {
          await redirectToTarget(0, navigate);
          return;
        }
        setEmail(status.email ?? null);
      } catch (error: unknown) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Unable to verify session";
        toast.error(message);
        navigate("/auth/login", { replace: true });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      toast.error("Enter your password to continue");
      return;
    }
    try {
      setIsSubmitting(true);
      await submitReauthPassword(password);
      toast.success("Identity confirmed");
      await redirectToTarget(0, navigate);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Re-authentication failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Confirm it&apos;s you</h1>
          <p className="text-sm text-muted-foreground">
            We noticed a change in your network location. Enter your password to continue
            {email ? ` as ${email}` : ""}.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reauth-password">Password</Label>
              <Input
                id="reauth-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Verifying…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        )}
      </div>

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
