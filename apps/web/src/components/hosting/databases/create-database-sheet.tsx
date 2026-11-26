"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Database as DatabaseIcon, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import { databaseEngineSchema, type DatabaseEngine } from "./databases-schema";
import { generateDatabasePassword } from "./connection-string";
import {
  DatabaseCredentialsRevealDialog,
  type RevealedDatabaseCredentials,
} from "./database-credentials-reveal-dialog";

const FormSchema = z.object({
  engine: z.string().min(1, { message: "Choose a database type." }),
  name: z.string()
    .min(1, { message: "Database name is required." })
    .max(64, { message: "Database name must be at most 64 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Database name can only contain letters, numbers, and underscores.",
    }),
  username: z.string()
    .min(1, { message: "Username is required." })
    .max(32, { message: "Username must be at most 32 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(64, { message: "Password must be at most 64 characters." }),
});

interface CreateDatabaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  engines: DatabaseEngine[];
  onSuccess?: () => void;
}

export function CreateDatabaseSheet({
  open,
  onOpenChange,
  siteId,
  engines,
  onSuccess,
}: CreateDatabaseSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [revealed, setRevealed] = React.useState<RevealedDatabaseCredentials | null>(null);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      engine: "",
      name: "",
      username: "",
      password: generateDatabasePassword(),
    },
  });

  React.useEffect(() => {
    if (!open) return;
    const parsed = z.array(databaseEngineSchema).safeParse(engines);
    const available = parsed.success ? parsed.data : [];
    form.reset({
      engine: available[0]?.id ?? "",
      name: "",
      username: "",
      password: generateDatabasePassword(),
    });
  }, [open, form, engines]);

  const nameValue = form.watch("name");
  React.useEffect(() => {
    if (!form.formState.dirtyFields.username) {
      form.setValue("username", nameValue);
    }
  }, [nameValue, form]);

  const createDatabase = trpc.plesk.databasesCreate.create.useMutation({
    onSuccess: (data) => {
      captureEvent("database_created", { database_type: data.engine ?? data.type });
      toast.success("Database created successfully");
      setRevealed({
        name: data.name,
        username: data.username,
        password: data.password,
        type: data.type,
        engineLabel: data.engineLabel,
        localHost: data.localHost,
        remoteHost: data.remoteHost,
        port: data.port,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[CreateDatabaseSheet] Create database error:", error);
      toast.error("Failed to create database", {
        description: error.message || "Please try again.",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const selected = engines.find((engine) => engine.id === data.engine);
    if (!selected) {
      toast.error("Choose a database type this subscription can create.");
      return;
    }
    try {
      await createDatabase.mutateAsync({
        siteId,
        name: data.name,
        username: data.username,
        password: data.password,
        engine: selected.id,
        dbServerId: selected.serverId,
      });
    } catch (e) {
      console.error("[CreateDatabaseSheet] Error in onSubmit:", e);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Create Database
            </SheetTitle>
            <SheetDescription>
              Create a database and user for this hosting subscription. The password is shown once after creation.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={engines.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {engines.map((engine) => (
                          <SelectItem key={engine.id} value={engine.id}>
                            {engine.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter database name" {...field} autoComplete="off" />
                    </FormControl>
                    <FormDescription>
                      Only letters, numbers, and underscores.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Database username" {...field} autoComplete="off" />
                    </FormControl>
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
                  <Button type="button" variant="outline" disabled={createDatabase.isPending}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={createDatabase.isPending || engines.length === 0}>
                  {createDatabase.isPending ? (
                    <>
                      <Spinner size={16} className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Database
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
