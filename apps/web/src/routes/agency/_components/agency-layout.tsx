"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { AgencyContentArea, AgencyContentInner } from "@/routes/agency/_components/agency-content-area";
import { AppSidebar } from "@/routes/agency/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/types/preferences/layout";
import { SearchDialog } from "@/routes/agency/_components/sidebar/search-dialog";
import { ThemeSwitcher } from "@/routes/agency/_components/sidebar/theme-switcher";
import { CartSwitcher } from "@/routes/agency/_components/sidebar/cart-switcher";
import { NotificationSwitcher } from "@/routes/agency/_components/sidebar/notification-switcher";
import { NavigationLoader } from "@/components/navigation-loader";
import { NavigationLoadingProvider } from "@/contexts/navigation-loading-context";
import { apiUrl, authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

function readSidebarDefaultOpen(): boolean {
  if (typeof document === "undefined") return true;
  const m = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]*)/);
  return m?.[1] !== "false";
}

function readPreference<T extends string>(key: string, allowed: readonly string[], fallback: T): T {
  if (typeof document === "undefined") return fallback;
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;)\\s*${key}=([^;]*)`));
    const v = m?.[1]?.trim();
    return allowed.includes(v ?? "") ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function AgencyLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [prefsReady, setPrefsReady] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [sidebarVariant, setSidebarVariant] = useState<SidebarVariant>("floating");
  const [sidebarCollapsible, setSidebarCollapsible] = useState<SidebarCollapsible>("icon");
  const [contentLayout, setContentLayout] = useState<ContentLayout>("full-width");
  const [customerRedirecting, setCustomerRedirecting] = useState(false);

  useEffect(() => {
    setDefaultOpen(readSidebarDefaultOpen());
    setSidebarVariant(
      readPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "floating"),
    );
    setSidebarCollapsible(
      readPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    );
    setContentLayout(
      readPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "full-width"),
    );
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      navigate("/auth/login", { replace: true });
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "CUSTOMER") return;

    setCustomerRedirecting(true);
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/redirect-target"), {
          credentials: "include",
        });
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok || !contentType.includes("application/json")) {
          const text = await res.text().catch(() => "");
          console.error("[agency-layout] redirect-target failed", {
            status: res.status,
            contentType,
            bodyPreview: text.slice(0, 200),
          });
          return;
        }
        const data = (await res.json()) as { redirect?: string };
        const target = data.redirect ?? "/";
        if (!target.startsWith("/agency")) {
          navigate(target, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      } finally {
        setCustomerRedirecting(false);
      }
    })();
  }, [session, isPending, navigate]);

  if (!prefsReady || isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const role = (session.user as { role?: string }).role;
  if (role === "CUSTOMER") {
    if (customerRedirecting) {
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner variant="ellipsis" className="text-primary" />
        </div>
      );
    }
    return null;
  }

  return (
    <NavigationLoadingProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
        <AgencyContentArea contentLayout={contentLayout}>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <NotificationSwitcher />
                <CartSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <AgencyContentInner>{children}</AgencyContentInner>
          <NavigationLoader />
        </AgencyContentArea>
      </SidebarProvider>
    </NavigationLoadingProvider>
  );
}
