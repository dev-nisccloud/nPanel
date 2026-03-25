"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Database as DatabaseIcon, Plus } from "lucide-react";

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

const FormSchema = z.object({
  name: z.string()
    .min(1, { message: "Database name is required." })
    .max(64, { message: "Database name must be at most 64 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { 
      message: "Database name can only contain letters, numbers, and underscores." 
    }),
  type: z.enum(['mysql', 'postgresql', 'mssql']),
});

interface CreateDatabaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  onSuccess?: () => void;
}

export function CreateDatabaseSheet({ 
  open, 
  onOpenChange, 
  siteId,
  onSuccess 
}: CreateDatabaseSheetProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      type: 'mysql',
    },
  });

  const createDatabase = trpc.plesk.databasesCreate.create.useMutation({
    onSuccess: (data) => {
      toast.success("Database created successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[CreateDatabaseSheet] Create database error:", error);
      toast.error("Failed to create database", { 
        description: error.message || "Please try again." 
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      await createDatabase.mutateAsync({
        siteId,
        name: data.name,
        type: data.type,
      });
    } catch (e) {
      console.error("[CreateDatabaseSheet] Error in onSubmit:", e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Create Database
          </SheetTitle>
          <SheetDescription>
            Create a new database for this hosting subscription.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter database name"
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Only letters, numbers, and underscores are allowed. Maximum 64 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mysql">
                        <div className="flex flex-col">
                          <span className="font-medium">MySQL</span>
                          <span className="text-xs text-muted-foreground">Most common database type</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="postgresql">
                        <div className="flex flex-col">
                          <span className="font-medium">PostgreSQL</span>
                          <span className="text-xs text-muted-foreground">Advanced open-source database</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mssql">
                        <div className="flex flex-col">
                          <span className="font-medium">Microsoft SQL Server</span>
                          <span className="text-xs text-muted-foreground">Microsoft database server</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of database you want to create.
                  </FormDescription>
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
              <Button type="submit" disabled={createDatabase.isPending}>
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
  );
}
