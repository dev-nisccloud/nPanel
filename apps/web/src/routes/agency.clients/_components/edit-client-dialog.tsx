"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional(),
}).refine(
  (data) => {
    // At least one field must be provided for update
    return data.name !== undefined || data.email !== undefined || data.role !== undefined;
  },
  {
    message: "At least one field must be provided for update",
  },
);

type FormData = z.infer<typeof editFormSchema>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialData: {
    name: string;
    email: string;
    role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
  };
  onSuccess?: () => void;
}

export function EditClientDialog({
  open,
  onOpenChange,
  clientId,
  initialData,
  onSuccess,
}: EditClientDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
    },
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    form.reset({
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
    });
  }, [initialData, form]);

  const utils = trpc.useUtils();

  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: async () => {
      toast.success("Client updated successfully");
      // Invalidate queries efficiently
      await Promise.all([
        utils.clients.getAll.invalidate(),
        utils.userProfile.getUserById.invalidate({ userId: clientId }),
      ]);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  const onSubmit = (data: FormData) => {
    // Only send changed fields
    const submitData: any = { userId: clientId };

    if (data.name !== undefined && data.name !== initialData.name) {
      submitData.name = data.name;
    }

    if (data.email !== undefined && data.email !== initialData.email) {
      submitData.email = data.email;
    }

    if (data.role !== undefined && data.role !== initialData.role) {
      submitData.role = data.role;
    }

    // Only mutate if there are changes
    if (Object.keys(submitData).length > 1) {
      updateClientMutation.mutate(submitData);
    } else {
      toast.info("No changes to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information. Only changed fields will be updated.
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
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="AGENCY_SUPER_ADMIN">Agency Super Admin</SelectItem>
                      <SelectItem value="AGENCY_USER">Agency User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={updateClientMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
              >
                {updateClientMutation.isPending ? (
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


