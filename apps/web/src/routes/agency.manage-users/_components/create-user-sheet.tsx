"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
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

/** Sentinel for "no agency RBAC role" → stored as null (full/default sidebar access). */
const FULL_RIGHTS_ROLE_ID = "__none__";

const FULL_RIGHTS_ITEM: ComboboxItem = {
  id: FULL_RIGHTS_ROLE_ID,
  label: "Full rights (no role)",
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
  agencyRoleId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUserSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "AGENCY_USER",
      agencyRoleId: FULL_RIGHTS_ROLE_ID,
    },
  });

  const { data: roles, isLoading: isLoadingRoles, error: rolesError, refetch: refetchRoles } =
    trpc.agencyRbac.rolesList.useQuery(undefined, {
      enabled: open,
      staleTime: 60_000,
    });

  const assignRoleMutation = trpc.agencyRbac.userAgencyRoleAssign.useMutation({
    onError: (error) => {
      toast.error(error.message || "User created, but assigning agency role failed");
    },
  });

  const createUserMutation = trpc.manageUsers.create.useMutation({
    onSuccess: async (user) => {
      const selectedAgencyRoleId = form.getValues("agencyRoleId");
      const roleId =
        selectedAgencyRoleId && selectedAgencyRoleId !== FULL_RIGHTS_ROLE_ID
          ? selectedAgencyRoleId
          : null;

      if (roleId) {
        try {
          await assignRoleMutation.mutateAsync({
            userId: user.id,
            roleId,
          });
        } catch {
          // error already handled by mutation onError
        }
      }

      toast.success("User created successfully");
      if (roleId) captureEvent("agency_role_assigned", { role_name: roleId });
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "AGENCY_USER",
        agencyRoleId: FULL_RIGHTS_ROLE_ID,
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const roleOptions: ComboboxItem[] = React.useMemo(() => {
    const fromApi = (roles ?? []).map((role) => ({
      id: role.id,
      label: role.name,
    }));
    return [FULL_RIGHTS_ITEM, ...fromApi];
  }, [roles]);

  // Password generator function
  const generatePassword = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%^&*()-_=+[]{};:,.<>/?';
    const all = uppers + lowers + digits + specials;
    const length = 14;

    let pwd = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];
    for (let i = pwd.length; i < length; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
    }
    form.setValue('password', pwd.join(''));
  };

  const onSubmit = (data: FormData) => {
    createUserMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create User</SheetTitle>
          <SheetDescription>
            Create a new agency user account. Credentials will be sent to the provided email address.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
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
                            <RefreshCw className="h-4 w-4" />
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
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password or generate one"
                        className="w-full"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generatePassword}
                        aria-label="Generate password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({
                    name: "",
                    email: "",
                    password: "",
                    role: "AGENCY_USER",
                  });
                  onOpenChange(false);
                }}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


