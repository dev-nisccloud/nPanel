"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { useTicketMutations } from "@/routes/agency/_components/tickets/use-ticket-mutations";
import type { TicketPriority, TicketType } from "@/routes/agency/_components/tickets/schema";

const TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BILLING", label: "Billing" },
  { value: "HOSTING", label: "Hosting" },
  { value: "DOMAIN", label: "Domain" },
  { value: "EMAIL", label: "Email" },
  { value: "WORDPRESS", label: "WordPress" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "ACCOUNT", label: "Account" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function CreateAgencyTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticketId: string) => void;
}) {
  const [customerId, setCustomerId] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<TicketType>("GENERAL");
  const [priority, setPriority] = React.useState<TicketPriority>("NORMAL");

  const clientsQuery = trpc.clients.getAll.useQuery(
    {},
    { enabled: open },
  );
  const { createTicket } = useTicketMutations();

  React.useEffect(() => {
    if (!open) return;
    setCustomerId("");
    setSubject("");
    setDescription("");
    setType("GENERAL");
    setPriority("NORMAL");
  }, [open]);

  const customerItems: ComboboxItem[] = React.useMemo(() => {
    return (clientsQuery.data ?? []).map((client) => ({
      id: client.id,
      label: client.name?.trim() || client.email,
      keywords: [client.email, client.name].filter(Boolean) as string[],
    }));
  }, [clientsQuery.data]);

  const selectedCustomer = customerItems.find((item) => item.id === customerId);

  const handleSubmit = async () => {
    if (createTicket.isPending) return;
    if (!customerId) {
      toast.error("Select the customer this ticket is about");
      return;
    }
    if (!subject.trim()) {
      toast.error("Add a subject");
      return;
    }
    if (!description.trim()) {
      toast.error("Add a message for the agency team");
      return;
    }

    try {
      const ticket = await createTicket.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        type,
        priority,
        source: "WEB",
        visibility: "AGENCY",
        customerUserId: customerId,
      });
      toast.success("Internal ticket opened");
      onOpenChange(false);
      onCreated(ticket.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open ticket");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open a ticket for a customer</DialogTitle>
          <DialogDescription>
            This stays with the agency team. The customer is not notified and cannot see the conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            {clientsQuery.isLoading ? (
              <div className="flex h-9 items-center">
                <Spinner size={16} />
              </div>
            ) : clientsQuery.isError ? (
              <p className="text-xs text-destructive">
                {clientsQuery.error.message || "Could not load customers."}
              </p>
            ) : (
              <ComboboxDropdown
                inDialog
                items={customerItems}
                selectedItem={selectedCustomer}
                onSelect={(item) => setCustomerId(item.id)}
                placeholder="Select a customer"
                searchPlaceholder="Search by name or email"
                emptyResults="No customers found"
                disabled={createTicket.isPending}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-ticket-subject">Subject</Label>
            <Input
              id="agency-ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What does the team need to handle?"
              disabled={createTicket.isPending}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TicketType)}
                disabled={createTicket.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TicketPriority)}
                disabled={createTicket.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-ticket-message">Message</Label>
            <Textarea
              id="agency-ticket-message"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context for the agency team. The customer will not see this."
              className="min-h-28"
              disabled={createTicket.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createTicket.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={createTicket.isPending}
          >
            {createTicket.isPending ? "Opening…" : "Open ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
