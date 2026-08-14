import { Mail, Phone, Ticket } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_TEL_HREF,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO_HREF,
} from "@/lib/contact.ts";

export function SupportContactActions({
  onOpenTicket,
  className,
}: {
  onOpenTicket?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <a
        href={CONTACT_TEL_HREF}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted/60"
      >
        <Phone className="h-3 w-3 text-primary" />
        Call us
        <span className="text-muted-foreground">{CONTACT_PHONE_DISPLAY}</span>
      </a>
      <a
        href={SUPPORT_MAILTO_HREF}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted/60"
      >
        <Mail className="h-3 w-3 text-primary" />
        {SUPPORT_EMAIL}
      </a>
      {onOpenTicket ? (
        <button
          type="button"
          onClick={onOpenTicket}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
        >
          <Ticket className="h-3 w-3" />
          Open a ticket
        </button>
      ) : null}
    </div>
  );
}
