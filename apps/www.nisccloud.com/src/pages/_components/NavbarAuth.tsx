import * as React from "react";
import { ExternalLink, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { FlowButton } from "@/components/ui/flow-button.tsx";
import {
  buildStorefrontSignInUrl,
  fetchStorefrontCheckoutIdentity,
} from "@/lib/storefront-checkout-api.ts";
import { cn } from "@/lib/utils.ts";

function resolvePublicUrl(configured: unknown, fallback: string) {
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().replace(/\/$/, "");
  }
  return fallback;
}

const NPANEL_URL = resolvePublicUrl(
  import.meta.env.VITE_NPANEL_APP_URL,
  "https://npanel.nisccloud.com",
);

export type NavbarAuthState =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "signed-in";
      name: string;
      email: string;
      teamSlug?: string;
    };

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function openNpanelUrl(teamSlug?: string): string {
  if (teamSlug) return `${NPANEL_URL}/${teamSlug}/dashboard`;
  return NPANEL_URL;
}

export function useNavbarAuth(): NavbarAuthState {
  const [state, setState] = React.useState<NavbarAuthState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    void fetchStorefrontCheckoutIdentity()
      .then((identity) => {
        if (cancelled) return;
        if (!identity.authenticated) {
          setState({ status: "guest" });
          return;
        }
        setState({
          status: "signed-in",
          name: identity.user.name,
          email: identity.user.email,
          teamSlug: identity.teams[0]?.slug,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "guest" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function AccountMenu({
  name,
  email,
  teamSlug,
  className,
}: {
  name: string;
  email: string;
  teamSlug?: string;
  className?: string;
}) {
  const initials = initialsFromName(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
          aria-label="Account menu"
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials || <User className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {email || "Signed in"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg cursor-pointer"
          onSelect={() => {
            window.location.assign(openNpanelUrl(teamSlug));
          }}
        >
          <ExternalLink className="size-4" />
          Open nPanel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop: login or avatar, placed just before Get Started. */
export function NavbarAuthDesktop({ auth }: { auth: NavbarAuthState }) {
  if (auth.status === "loading") {
    return (
      <div
        className="size-9 rounded-full bg-muted animate-pulse"
        aria-hidden
      />
    );
  }

  if (auth.status === "guest") {
    return (
      <FlowButton
        text="Login"
        size="sm"
        icon={null}
        onClick={() => {
          window.location.assign(buildStorefrontSignInUrl(window.location.href));
        }}
      />
    );
  }

  return (
    <AccountMenu name={auth.name} email={auth.email} teamSlug={auth.teamSlug} />
  );
}

/** Mobile menu: login or signed-in account card. */
export function NavbarAuthMobile({
  auth,
  onNavigate,
}: {
  auth: NavbarAuthState;
  onNavigate?: () => void;
}) {
  if (auth.status === "loading") {
    return <div className="h-11 w-full rounded-xl bg-muted animate-pulse" aria-hidden />;
  }

  if (auth.status === "guest") {
    return (
      <FlowButton
        text="Login"
        size="sm"
        icon={null}
        onClick={() => {
          window.location.assign(buildStorefrontSignInUrl(window.location.href));
          onNavigate?.();
        }}
        className="w-full justify-center"
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-10 border border-border shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initialsFromName(auth.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{auth.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {auth.email || "Signed in"}
          </p>
        </div>
      </div>
      <Button
        type="button"
        className="w-full rounded-xl"
        onClick={() => {
          window.location.assign(openNpanelUrl(auth.teamSlug));
          onNavigate?.();
        }}
      >
        <ExternalLink className="size-4" />
        Open nPanel
      </Button>
    </div>
  );
}
