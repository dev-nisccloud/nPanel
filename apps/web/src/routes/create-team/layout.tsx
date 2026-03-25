"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function CreateTeamLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [customerGateReady, setCustomerGateReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) return;

    const role = (session.user as { role?: string }).role;
    if (role !== "CUSTOMER") {
      setCustomerGateReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/redirect-target", { credentials: "include" });
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok || !contentType.includes("application/json")) {
          const text = await res.text().catch(() => "");
          console.error("[create-team-layout] redirect-target failed", {
            status: res.status,
            contentType,
            bodyPreview: text.slice(0, 200),
          });
          return;
        }
        const data = (await res.json()) as { redirect?: string };
        if (cancelled) return;
        const target = data.redirect ?? "/";
        if (target !== "/create-team") {
          navigate(target, { replace: true });
          return;
        }
      } finally {
        if (!cancelled) setCustomerGateReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPending, session, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  const role = (session.user as { role?: string }).role;
  if (role === "CUSTOMER" && !customerGateReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
