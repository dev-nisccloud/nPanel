"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

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

/** Sentinel for "no agency RBAC role" → stored as null (full/default sidebar access). */
const FULL_RIGHTS_ROLE_ID = "__none__";

const FULL_RIGHTS_ITEM: ComboboxItem = {
  id: FULL_RIGHTS_ROLE_ID,
  label: "Full rights (no role)",
};

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional(),
  agencyRoleId: z.string().optional(),
}).refine(
  (data) => {
    return (
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined ||
      data.agencyRoleId !== undefined
    );
  },
  {
    message: "At least one field must be provided for update",
  },
);

type FormData = z.infer<typeof editFormSchema>;

function toFormAgencyRoleId(agencyRoleId: string | null | undefined): string {
  return agencyRoleId?.trim() ? agencyRoleId : FULL_RIGHTS_ROLE_ID;
}

function toDbAgencyRoleId(agencyRoleId: string | null | undefined): string | null {
  if (!agencyRoleId || agencyRoleId === FULL_RIGHTS_ROLE_ID) return null;
  return agencyRoleId;
}

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
      agencyRoleId: toFormAgencyRoleId(initialData.agencyRoleId),
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
      agencyRoleId: toFormAgencyRoleId(initialData.agencyRoleId),
    });
  }, [open, initialData, form]);

  const { data: roles, isLoading: isLoadingRoles, error: rolesError, refetch: refetchRoles } =
    trpc.agencyRbac.rolesList.useQuery(undefined, {
      enabled: open,
      staleTime: 60_000,
    });

  const utils = trpc.useUtils();

  const assignRoleMutation = trpc.agencyRbac.userAgencyRoleAssign.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update agency role");
    },
  });

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

  const roleOptions: ComboboxItem[] = React.useMemo(() => {
    const fromApi = (roles ?? []).map((role) => ({
      id: role.id,
      label: role.name,
    }));
    return [FULL_RIGHTS_ITEM, ...fromApi];
  }, [roles]);

  const isSaving = updateUserMutation.isPending || assignRoleMutation.isPending;

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

    const selectedAgencyRoleId = toDbAgencyRoleId(data.agencyRoleId);
    const initialAgencyRoleId = toDbAgencyRoleId(initialData.agencyRoleId);

    const hasProfileChanges = Object.keys(submitData).length > 1;
    const agencyRoleChanged = selectedAgencyRoleId !== initialAgencyRoleId;

    if (!hasProfileChanges && !agencyRoleChanged) {
      toast.info("No changes to save");
      return;
    }

    try {
      if (hasProfileChanges) {
        await updateUserMutation.mutateAsync(submitData);
      }

      if (agencyRoleChanged) {
        await assignRoleMutation.mutateAsync({
          userId,
          roleId: selectedAgencyRoleId,
        });
        captureEvent("agency_role_assigned", {
          role_name: selectedAgencyRoleId || "none",
        });
        void utils.agencyRbac.myMenuAccess.invalidate();
      }

      toast.success("User updated successfully");
      form.reset({
        name: data.name ?? initialData.name,
        email: data.email ?? initialData.email,
        role: data.role ?? initialData.role,
        agencyRoleId: toFormAgencyRoleId(selectedAgencyRoleId),
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

            <FormField
              control={form.control}
              name="agencyRoleId"
              render={({ field }) => {
                const selectedRole =
                  roleOptions.find((r) => r.id === field.value) ?? FULL_RIGHTS_ITEM;

                return (
                  <FormItem>
                    <FormLabel>
                      Agency Role
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      {isLoadingRoles ? (
                        <div className="flex h-10 items-center justify-center rounded-md border">
                          <Spinner variant="ellipsis" size="sm" />
                        </div>
                      ) : rolesError ? (
                        <div className="flex items-center justify-between gap-2">
                          <ComboboxDropdown
                            placeholder="Failed to load agency roles"
                            searchPlaceholder="Search roles..."
                            items={[]}
                            selectedItem={undefined}
                            onSelect={() => undefined}
                            emptyResults="Failed to load roles"
                            disabled
                            inDialog
                            className="w-full"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => refetchRoles()}
                            aria-label="Retry"
                          >
                            <Spinner size={14} className="mr-0" />
                          </Button>
                        </div>
                      ) : (
                        <ComboboxDropdown
                          placeholder="Select agency role"
                          searchPlaceholder="Search roles..."
                          items={roleOptions}
                          selectedItem={selectedRole}
                          onSelect={(item) => {
                            field.onChange(item.id);
                          }}
                          emptyResults="No roles found"
                          inDialog
                          className="w-full"
                        />
                      )}
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Full rights (no role) leaves the assignment empty so the user gets default sidebar access.
                    </p>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
