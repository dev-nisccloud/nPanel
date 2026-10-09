"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RefreshCw, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "@/components/ui/sonner";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import {
  grantsFromEditor,
  RoleAccessEditor,
  type AgencyAccessLevel,
} from "@/routes/agency.agency-roles/_components/role-access-editor";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
});

type FormData = z.infer<typeof formSchema>;

const steps = ["Account", "Permissions"] as const;

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
  const [step, setStep] = React.useState<0 | 1>(0);
  const [createdUserId, setCreatedUserId] = React.useState<string | null>(null);
  const [accessDraft, setAccessDraft] = React.useState<Record<string, AgencyAccessLevel>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "AGENCY_USER",
    },
  });

  const utils = trpc.useUtils();

  const saveAccessMutation = trpc.agencyRbac.userAccessSet.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to save permissions");
    },
  });

  const createUserMutation = trpc.manageUsers.create.useMutation({
    onSuccess: async (user, variables) => {
      if (variables.role === "AGENCY_SUPER_ADMIN") {
        toast.success("User created");
        captureEvent("agency_user_created");
        resetSheet();
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      setCreatedUserId(user.id);
      try {
        await saveAccessMutation.mutateAsync({ userId: user.id, grants: [] });
      } catch {
        // The permissions step can save again.
      }
      toast.success("User created");
      captureEvent("agency_user_created");
      setStep(1);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const generatePassword = () => {
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{};:,.<>/?";
    const all = uppers + lowers + digits + specials;
    const length = 14;

    const pwd = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];
    for (let i = pwd.length; i < length; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]!);
    }
    for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j]!, pwd[i]!];
    }
    form.setValue("password", pwd.join(""));
  };

  const resetSheet = () => {
    form.reset({
      name: "",
      email: "",
      password: "",
      role: "AGENCY_USER",
    });
    setShowPassword(false);
    setStep(0);
    setCreatedUserId(null);
    setAccessDraft({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetSheet();
    onOpenChange(nextOpen);
  };

  const onSubmit = (data: FormData) => {
    if (step !== 0 || createdUserId) return;
    createUserMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  };

  const savePermissions = async () => {
    if (!createdUserId) return;
    try {
      await saveAccessMutation.mutateAsync({
        userId: createdUserId,
        grants: grantsFromEditor(accessDraft),
      });
      await utils.agencyRbac.myPermissions.invalidate();
      toast.success("Permissions saved");
      resetSheet();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // mutation onError already toasted
    }
  };

  const isCreating = createUserMutation.isPending || (step === 0 && saveAccessMutation.isPending);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0 border-b px-6 pt-6 pb-4">
            <SheetTitle>Create User</SheetTitle>
            <SheetDescription>
              {step === 0
                ? "Create a new agency user account. Credentials will be sent to the provided email address."
                : "Choose what this user can open, then save."}
            </SheetDescription>
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              {steps.map((label, index) => (
                <div key={label} className="flex items-center gap-1">
                  <span
                    className={
                      index === step ? "font-medium text-foreground" : index < step ? "text-foreground" : undefined
                    }
                  >
                    {index < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
                    {label}
                  </span>
                  {index < steps.length - 1 ? <span>/</span> : null}
                </div>
              ))}
            </div>
          </SheetHeader>

          {step === 0 ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-6 px-6 py-6">
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
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  </div>
                </ScrollArea>
                <SheetFooter className="flex-shrink-0 gap-2 border-t px-6 py-4 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Spinner size={16} className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create user"
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <ScrollArea className="min-h-0 flex-1">
                <div className="px-6 py-6">
                  <RoleAccessEditor value={accessDraft} onChange={setAccessDraft} />
                </div>
              </ScrollArea>
              <SheetFooter className="flex-shrink-0 gap-2 border-t px-6 py-4 sm:gap-0">
                <Button
                  type="button"
                  disabled={saveAccessMutation.isPending || !createdUserId}
                  onClick={() => void savePermissions()}
                >
                  {saveAccessMutation.isPending ? (
                    <>
                      <Spinner size={16} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save permissions"
                  )}
                </Button>
              </SheetFooter>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
