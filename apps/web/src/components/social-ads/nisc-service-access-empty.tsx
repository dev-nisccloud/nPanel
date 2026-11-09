"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export function NiscServiceAccessEmpty({ service }: { service: string }) {
  const utils = trpc.useUtils();
  const [opened, setOpened] = React.useState(false);
  const createTicket = trpc.tickets.create.useMutation();
  const createMessage = trpc.tickets.createMessage.useMutation();
  const pending = createTicket.isPending || createMessage.isPending;

  const openTicket = async () => {
    if (pending || opened) return;
    const description = `Please grant this organization access to ${service}. This service is provided by Nisc.`;
    try {
      const ticket = await createTicket.mutateAsync({
        subject: `Access to ${service}`,
        description,
        type: "GENERAL",
        priority: "NORMAL",
        source: "WEB",
      });
      await createMessage.mutateAsync({
        ticketId: ticket.id,
        content: description,
        isInternal: false,
      });
      await utils.tickets.getList.invalidate();
      setOpened(true);
      toast.success(`Ticket ${ticket.ticketNumber} is open`);
      window.dispatchEvent(new CustomEvent("nisc-support-open", { detail: { ticketId: ticket.id } }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open a ticket");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>You do not have access to this service provided by Nisc</CardTitle>
          <CardDescription>
            {service} is not available for this organization yet. Open a ticket and the Nisc team will follow up.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row gap-2">
          <Button className="flex-1" disabled={pending || opened} onClick={() => void openTicket()}>
            {opened ? "Ticket opened" : pending ? "Opening ticket..." : "Open a ticket"}
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a href="tel:+254748777666">Contact us now</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
