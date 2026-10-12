"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyRound } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional(),
}).refine(
  (data) => data.name !== undefined || data.email !== undefined || data.role !== undefined,
  { message: "At least one field must be provided for update" },
);

type FormData = z.infer<typeof editFormSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialData: {
    name: string;
    email: string;
    role: "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
    agencyRoleId?: string | null;
  };
  onSuccess?: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  userId,
  initialData,
  onSuccess,
}: EditUserDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
    });
  }, [open, initialData, form]);

  const updateUserMutation = trpc.manageUsers.update.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const requestPasswordResetMutation = trpc.manageUsers.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Password reset email sent successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send password reset email");
    },
  });

  const isSaving = updateUserMutation.isPending;

  const onSubmit = async (data: FormData) => {
    const submitData: {
      userId: string;
      name?: string;
      email?: string;
      role?: FormData["role"];
    } = { userId };

    if (data.name !== undefined && data.name !== initialData.name) {
      submitData.name = data.name;
    }

    if (data.email !== undefined && data.email !== initialData.email) {
      submitData.email = data.email;
    }

    if (data.role !== undefined && data.role !== initialData.role) {
      submitData.role = data.role;
    }

    const hasProfileChanges = Object.keys(submitData).length > 1;

    if (!hasProfileChanges) {
      toast.info("No changes to save");
      return;
    }

    try {
      await updateUserMutation.mutateAsync(submitData);

      toast.success("User updated successfully");
      form.reset({
        name: data.name ?? initialData.name,
        email: data.email ?? initialData.email,
        role: data.role ?? initialData.role,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // errors are handled in individual mutations
    }
  };

  const handlePasswordReset = () => {
    requestPasswordResetMutation.mutate({ userId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update agency user information. Only changed fields will be updated.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENCY_USER">Agency User</SelectItem>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="AGENCY_SUPER_ADMIN">Agency Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Password Management</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={requestPasswordResetMutation.isPending}
                  className="w-full"
                >
                  {requestPasswordResetMutation.isPending ? (
                    <>
                      <Spinner size={16} className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Request Password Reset
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Send a password reset email to the user
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
