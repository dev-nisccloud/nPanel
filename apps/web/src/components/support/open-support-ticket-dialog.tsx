"use client";

import { useState } from "react";
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

export function OpenSupportTicketDialog({
  open,
  onOpenChange,
  showPhone,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPhone: boolean;
  submitting: boolean;
  onSubmit: (payload: { phone?: string; intent: "support" | "sales" }) => void | Promise<void>;
}) {
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<"support" | "sales">("support");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open a ticket</DialogTitle>
          <DialogDescription>
            We&apos;ll send our team a summary of this chat so they can follow up.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="flex gap-2">
            {(
              [
                ["support", "Support"],
                ["sales", "Sales"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setIntent(id)}
                className={
                  intent === id
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>
          {showPhone ? (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-phone">Phone (optional)</Label>
              <Input
                id="ticket-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254…"
                autoComplete="tel"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void onSubmit({ phone: phone.trim() || undefined, intent })}
          >
            {submitting ? "Opening…" : "Submit ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
