"use client";

import { Mail, Phone, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_TEL_HREF,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO_HREF,
} from "@/lib/contact";

export function SupportContactActions({
  onOpenTicket,
  className,
  compact = false,
}: {
  onOpenTicket?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <a
        href={CONTACT_TEL_HREF}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/60",
          compact && "px-2 py-0.5",
        )}
      >
        <Phone className="h-3 w-3 text-primary" />
        Call us
        <span className="text-muted-foreground">{CONTACT_PHONE_DISPLAY}</span>
      </a>
      <a
        href={SUPPORT_MAILTO_HREF}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/60",
          compact && "px-2 py-0.5",
        )}
      >
        <Mail className="h-3 w-3 text-primary" />
        {SUPPORT_EMAIL}
      </a>
      {onOpenTicket ? (
        <button
          type="button"
          onClick={onOpenTicket}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10",
            compact && "px-2 py-0.5",
          )}
        >
          <Ticket className="h-3 w-3" />
          Open a ticket
        </button>
      ) : null}
    </div>
  );
}
