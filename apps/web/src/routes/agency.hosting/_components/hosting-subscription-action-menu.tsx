"use client";

import * as React from "react";
import { FilePlus2, Lock, MoreVertical, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isHostingSubscriptionSuspended } from "./hosting-utils";

interface HostingSubscriptionActionMenuProps {
  subscriptionId: number;
  subscriptionName: string;
  status: number | undefined | null;
  hasLinkedSubscription?: boolean;
  createSubscriptionTooltipLinked?: string;
  onCreateSubscription?: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  /** Icon-only trigger for table rows; default for detail header */
  triggerVariant?: "icon" | "ghost";
  align?: "start" | "center" | "end";
}

export function HostingSubscriptionActionMenu({
  subscriptionId,
  subscriptionName,
  status,
  hasLinkedSubscription = false,
  createSubscriptionTooltipLinked,
  onCreateSubscription,
  onSuspend,
  onUnsuspend,
  triggerVariant = "icon",
  align = "end",
}: HostingSubscriptionActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const isSuspended = isHostingSubscriptionSuspended(status);

  const handleCreateSubscription = () => {
    if (hasLinkedSubscription) return;
    setOpen(false);
    onCreateSubscription?.();
  };

  const handleSuspend = () => {
    setOpen(false);
    onSuspend();
  };

  const handleUnsuspend = () => {
    setOpen(false);
    onUnsuspend();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {triggerVariant === "icon" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open actions for {subscriptionName || subscriptionId}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {onCreateSubscription && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleCreateSubscription();
                      }}
                      disabled={hasLinkedSubscription}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Create subscription
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  {hasLinkedSubscription
                    ? createSubscriptionTooltipLinked
                    : "Create a Nisc subscription and link it to a team or user."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuSeparator />
          </>
        )}
        {isSuspended ? (
          <DropdownMenuItem onSelect={handleUnsuspend}>
            <Unlock className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={handleSuspend}
            className="text-destructive focus:text-destructive"
          >
            <Lock className="mr-2 h-4 w-4" />
            Suspend
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
