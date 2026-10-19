"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Key, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";
import { captureEvent } from "@/lib/posthog";

const FormSchema = z.object({
  password: z.string()
    .min(5, { message: "Password must be at least 5 characters." })
    .max(64, { message: "Password must be at most 64 characters." }),
  confirmPassword: z.string(),
  passwordType: z.enum(["plain", "crypt"]).default("plain"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ChangeDatabasePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  database: z.infer<typeof databaseSchema>;
  userId: number;
  users?: { id: number; login: string }[];
  onSuccess?: () => void;
}

export function ChangeDatabasePasswordSheet({
  open,
  onOpenChange,
  siteId,
  database,
  userId,
  users,
  onSuccess,
}: ChangeDatabasePasswordSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [activeUserId, setActiveUserId] = React.useState(userId);
  const assignedUsers = users ?? [];

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      passwordType: "plain",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      password: "",
      confirmPassword: "",
      passwordType: "plain",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setActiveUserId(userId);
  }, [open, form, userId]);

  const changePassword = trpc.plesk.databasesSetUser.update.useMutation({
    onSuccess: () => {
      captureEvent("database_password_changed");
      toast.success("Database password changed successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[ChangeDatabasePasswordSheet] Change password error:", error);
      toast.error("Failed to change password", {
        description: error.message || "Please try again.",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!database.id || activeUserId <= 0) {
      toast.error("Database user is missing", {
        description: "Open the database details and try Change password again.",
      });
      return;
    }
    await changePassword.mutateAsync({
      siteId,
      databaseId: database.id,
      userId: activeUserId,
      password: data.password,
      passwordType: data.passwordType,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Change Database Password</SheetTitle>
          <SheetDescription>
            Change the password for the database user of &quot;{database.name || "Unknown Database"}&quot;.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {assignedUsers.length > 1 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Database user</p>
                <Select
                  value={String(activeUserId || "")}
                  onValueChange={(value) => setActiveUserId(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.login}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : assignedUsers[0] ? (
              <p className="text-sm text-muted-foreground">
                User: <span className="font-medium text-foreground">{assignedUsers[0].login}</span>
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select password type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="plain">
                        <div className="flex flex-col">
                          <span className="font-medium">Plain text</span>
                          <span className="text-xs text-muted-foreground">Use the password you typed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="crypt">
                        <div className="flex flex-col">
                          <span className="font-medium">Encrypted</span>
                          <span className="text-xs text-muted-foreground">Already hashed; Plesk stores it as-is</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Keep Plain text unless you are pasting a password that is already hashed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={changePassword.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={changePassword.isPending || activeUserId <= 0 || !database.id}>
                {changePassword.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
