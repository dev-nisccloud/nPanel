"use client";

import * as React from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER">("MEMBER");

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("MEMBER");
    }
  }, [open]);

  const inviteMemberMutation = trpc.teams.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setEmail("");
      setRole("MEMBER");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const handleSubmit = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    inviteMemberMutation.mutate({
      teamId,
      email: trimmedEmail,
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Organization Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this organization. They will receive an email with instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Invite Organization Members</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteEmail" className="text-sm font-medium">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteRole" className="text-sm font-medium">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <SelectTrigger id="inviteRole" className="h-11 w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
              disabled={inviteMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-11"
              disabled={inviteMemberMutation.isPending}
            >
              {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
