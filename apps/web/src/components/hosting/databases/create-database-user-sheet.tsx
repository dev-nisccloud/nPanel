"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Eye, EyeOff, RefreshCw, UserPlus } from "lucide-react";

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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import { databaseSchema } from "./databases-schema";
import { generateDatabasePassword } from "./connection-string";
import {
  DatabaseCredentialsRevealDialog,
  type RevealedDatabaseCredentials,
} from "./database-credentials-reveal-dialog";

const FormSchema = z.object({
  login: z.string()
    .min(1, { message: "Username is required." })
    .max(32, { message: "Username must be at most 32 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(64, { message: "Password must be at most 64 characters." }),
});

interface CreateDatabaseUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  database: z.infer<typeof databaseSchema>;
  onSuccess?: () => void;
}

export function CreateDatabaseUserSheet({
  open,
  onOpenChange,
  siteId,
  database,
  onSuccess,
}: CreateDatabaseUserSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [revealed, setRevealed] = React.useState<RevealedDatabaseCredentials | null>(null);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      login: database.name?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32) || "",
      password: generateDatabasePassword(),
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      login: database.name?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32) || "",
      password: generateDatabasePassword(),
    });
  }, [open, database.name, form]);

  const createUser = trpc.plesk.databasesCreateUser.create.useMutation({
    onSuccess: (data) => {
      captureEvent("database_user_created");
      toast.success("Database user created");
      setRevealed({
        name: data.name,
        username: data.login,
        password: data.password,
        type: data.type,
        localHost: data.localHost,
        remoteHost: data.remoteHost,
        port: data.port,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to create database user", {
        description: error.message || "Please try again.",
      });
    },
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>Create Database User</SheetTitle>
            <SheetDescription>
              Create a MySQL user for &quot;{database.name || "this database"}&quot;. The password is shown once after creation.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createUser.mutateAsync({
                  siteId,
                  databaseId: database.id ?? 0,
                  login: data.login,
                  password: data.password,
                }),
              )}
              className="space-y-6 mt-6"
            >
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="database_user" {...field} autoComplete="off" />
                    </FormControl>
                    <FormDescription>
                      Plesk may prefix this with the hosting system username.
                    </FormDescription>
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
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                            autoComplete="new-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.setValue("password", generateDatabasePassword(), { shouldValidate: true })}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">Generate password</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={createUser.isPending}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={createUser.isPending || !database.id}>
                  {createUser.isPending ? (
                    <>
                      <Spinner size={16} className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <DatabaseCredentialsRevealDialog
        open={!!revealed}
        onOpenChange={(next) => {
          if (!next) setRevealed(null);
        }}
        credentials={revealed}
      />
    </>
  );
}
