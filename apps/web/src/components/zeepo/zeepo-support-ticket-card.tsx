"use client";

import { Mail, Phone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_TEL_HREF,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO_HREF,
} from "@/lib/contact";

function asObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

export function parseSupportTicketResult(payload: unknown): Record<string, unknown> | null {
  const o = asObject(payload);
  if (o?._tool !== "create_support_ticket") return null;
  return o;
}

export function ZeepoSupportTicketCard({
  result,
  onViewTicket,
}: {
  result: unknown;
  onViewTicket?: (ticketId: string) => void;
}) {
  const o = parseSupportTicketResult(result);
  if (!o?.ok) return null;
  const ticketId = String(o.ticketId ?? "");
  const ticketNumber = String(o.ticketNumber ?? "");
  const intent = o.intent === "sales" ? "Sales" : "Support";
  const already = o.alreadyOpen === true;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Ticket className="h-3.5 w-3.5 text-primary" />
        {already ? `${intent} ticket already open` : `${intent} ticket opened`}
      </div>
      <div className="space-y-2 px-3 py-3">
        <p className="text-sm font-medium">{ticketNumber}</p>
        {typeof o.subject === "string" && o.subject ? (
          <p className="text-xs text-muted-foreground">{o.subject}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          Our team will reply in Messages. You can also call or email us.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {onViewTicket && ticketId ? (
            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onViewTicket(ticketId)}>
              View ticket
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" asChild>
            <a href={CONTACT_TEL_HREF}>
              <Phone className="mr-1 h-3 w-3" />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" asChild>
            <a href={SUPPORT_MAILTO_HREF}>
              <Mail className="mr-1 h-3 w-3" />
              {SUPPORT_EMAIL}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
