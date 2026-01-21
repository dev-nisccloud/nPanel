"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";

const FormSchema = z.object({
  password: z.string()
    .min(5, { message: "Password must be at least 5 characters." })
    .max(64, { message: "Password must be at most 64 characters." }),
  confirmPassword: z.string(),
  passwordType: z.enum(['plain', 'crypt']).default('plain'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ChangeDatabasePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: z.infer<typeof databaseSchema>;
  userId: number; // Database user ID
  onSuccess?: () => void;
}

export function ChangeDatabasePasswordSheet({ 
  open, 
  onOpenChange, 
  database,
  userId,
  onSuccess 
}: ChangeDatabasePasswordSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      passwordType: 'plain',
    },
  });

  const changePassword = trpc.plesk.databasesSetUser.update.useMutation({
    onSuccess: () => {
      toast.success("Database password changed successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[ChangeDatabasePasswordSheet] Change password error:", error);
      toast.error("Failed to change password", { 
        description: error.message || "Please try again." 
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      await changePassword.mutateAsync({
        userId,
        password: data.password,
        passwordType: data.passwordType,
      });
    } catch (e) {
      console.error("[ChangeDatabasePasswordSheet] Error in onSubmit:", e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Change Database Password</SheetTitle>
          <SheetDescription>
            Change the password for database user of "{database.name || "Unknown Database"}".
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="plain">Plain Text</option>
                      <option value="crypt">Encrypted</option>
                    </select>
                  </FormControl>
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
              <Button type="submit" disabled={changePassword.isPending}>
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
