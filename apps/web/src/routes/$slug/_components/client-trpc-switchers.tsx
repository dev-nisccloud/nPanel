"use client";

/**
 * Wrapper that renders TeamSwitcher and NotificationSwitcher.
 * This file is only ever loaded via dynamic(..., { ssr: false }), so tRPC hooks
 * inside these components never run during server render (avoids "Unable to find tRPC Context").
 */
import { CircleHelp } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { restartCustomerGuide } from "@/components/customer-guide/customer-dashboard-guide";
import { authClient } from "@/lib/auth-client";
import { TeamSwitcher } from "./sidebar/team-switcher";
import { NotificationSwitcher } from "./sidebar/notification-switcher";

function WalkthroughButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = authClient.useSession();
  const teamSlug = pathname.split("/")[1] ?? "";
  const onDashboard = pathname === `/${teamSlug}/dashboard`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 px-2.5 text-sm font-medium"
          onClick={() => {
            const userId = session?.user?.id;
            if (userId) restartCustomerGuide(userId);
            if (!onDashboard && teamSlug) {
              navigate(`/${teamSlug}/dashboard`);
            }
          }}
        >
          <CircleHelp className="size-4" aria-hidden />
          Walkthrough
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Replay the product tour of your dashboard.</TooltipContent>
    </Tooltip>
  );
}

export function ClientTrpcSwitchers() {
  return (
    <>
      <WalkthroughButton />
      <TeamSwitcher />
      <NotificationSwitcher />
    </>
  );
}
