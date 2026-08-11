"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { authClient } from "@/lib/auth-client";
import { captureEvent } from "@/lib/posthog";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Enter a valid email address"),
});

type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

type ChangeEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
};

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);

  const form = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "" },
  });

  const resetAll = () => {
    form.reset();
    setPendingNewEmail(null);
    setConfirmOpen(false);
  };

  const onSubmit = (data: ChangeEmailValues) => {
    const newEmail = data.newEmail.trim().toLowerCase();
    if (newEmail === currentEmail.trim().toLowerCase()) {
      form.setError("newEmail", { message: "New email must be different from your current email" });
      return;
    }
    setPendingNewEmail(newEmail);
    setConfirmOpen(true);
  };

  const confirmAndSend = async () => {
    if (!pendingNewEmail) return;

    try {
      setIsSubmitting(true);
      const returnPath = typeof window !== "undefined" ? window.location.pathname : "/";

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingEmailChangeReturnTo", returnPath);
      }

      const result = await authClient.changeEmail({
        newEmail: pendingNewEmail,
        callbackURL:
          typeof window !== "undefined" ? `${window.location.origin}${returnPath}` : "/",
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to request email change");
      }

      captureEvent("email_change_requested", {
        new_email_domain: pendingNewEmail.split("@")[1],
      });
      toast.success("Check your current email", {
        description:
          "We sent a confirmation link to your current address. Approve it, then verify the new email.",
      });
      resetAll();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Could not request email change", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isSubmitting && !confirmOpen) {
            if (!next) resetAll();
            onOpenChange(next);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request email change</DialogTitle>
            <DialogDescription>
              Your login email is a security credential. Changing it affects how you sign in and
              where we send account notices.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Before you continue</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>
                You must approve the change from your current inbox (
                <span className="text-foreground">{currentEmail}</span>).
              </li>
              <li>You must then verify the new address before it becomes active.</li>
              <li>Until both steps are done, you will keep signing in with your current email.</li>
              <li>
                After the change completes, use the new email for login, password resets, and
                security alerts.
              </li>
            </ul>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="new@example.com"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!isSubmitting) {
            setConfirmOpen(next);
            if (!next) setPendingNewEmail(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm email change request?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  You are requesting to change your account email from{" "}
                  <span className="font-medium text-foreground">{currentEmail}</span> to{" "}
                  <span className="font-medium text-foreground">{pendingNewEmail}</span>.
                </p>
                <p>
                  We will email your <span className="font-medium text-foreground">current</span>{" "}
                  address first. If you did not start this request, ignore that email and your
                  account email will stay unchanged.
                </p>
                <p>
                  Once fully completed, invoices, security alerts, and password resets will go to
                  the new address, and you will sign in with it.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmAndSend();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                  Sending...
                </span>
              ) : (
                "Yes, send confirmation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
