"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Check, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ApprovalFormSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

const RejectionFormSchema = z.object({
  reason: z.string().min(1, { message: "Rejection reason is required." }),
});

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  versionNumber: number;
  type: "internal" | "public";
  onApprove?: (versionId: string) => void;
  onReject?: (versionId: string, reason: string) => void;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  versionId,
  versionNumber,
  type,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  const [action, setAction] = React.useState<"approve" | "reject">("approve");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof RejectionFormSchema>>({
    resolver: zodResolver(RejectionFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof RejectionFormSchema>) => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (action === "approve" && onApprove) {
        onApprove(versionId);
        toast.success(`${type === "internal" ? "Internal" : "Public"} approval successful!`);
      } else if (action === "reject" && onReject) {
        onReject(versionId, data.reason);
        toast.success(`${type === "internal" ? "Internal" : "Public"} rejection recorded`);
      }

      form.reset();
      setAction("approve");
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error("Failed to process approval", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve" ? "Approve" : "Reject"} Version {versionNumber}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? `Approve this ${type === "internal" ? "internal" : "public"} version?`
              : `Please provide a reason for rejecting this ${type === "internal" ? "internal" : "public"} version.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <RadioGroup value={action} onValueChange={(value) => setAction(value as "approve" | "reject")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approve" id="approve" />
                <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer">
                  <Check className="h-4 w-4" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id="reject" />
                <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer">
                  <X className="h-4 w-4" />
                  Reject
                </Label>
              </div>
            </RadioGroup>

            {action === "reject" && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this version is being rejected..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant={action === "reject" ? "destructive" : "default"}>
                {isSubmitting
                  ? "Processing..."
                  : action === "approve"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

