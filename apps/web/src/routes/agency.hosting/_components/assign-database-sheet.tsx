"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Link2, Globe, Database as DatabaseIcon } from "lucide-react";

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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { captureEvent } from "@/lib/posthog";

const FormSchema = z.object({
  confirm: z.boolean().refine((val) => val === true, {
    message: "You must confirm to proceed",
  }),
});

interface AssignDatabaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: z.infer<typeof databaseSchema>;
  targetWebspaceId: number;
  targetDomainName: string;
  onSuccess?: () => void;
}

export function AssignDatabaseSheet({ 
  open, 
  onOpenChange, 
  database,
  targetWebspaceId,
  targetDomainName,
  onSuccess 
}: AssignDatabaseSheetProps) {
  const [confirmed, setConfirmed] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      confirm: false,
    },
  });

  const assignDatabase = trpc.plesk.databasesAssign.assign.useMutation({
    onSuccess: () => {
      captureEvent("database_assigned", { site_id: String(targetWebspaceId) });

      toast.success("Database assigned successfully!");
      form.reset();
      setConfirmed(false);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[AssignDatabaseSheet] Assign database error:", error);
      toast.error("Failed to assign database", { 
        description: error.message || "Please try again." 
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!database.id) {
      toast.error("Database ID not available");
      return;
    }
    try {
      await assignDatabase.mutateAsync({
        databaseId: database.id,
        targetWebspaceId,
      });
    } catch (e) {
      console.error("[AssignDatabaseSheet] Error in onSubmit:", e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Assign Database to Website
          </SheetTitle>
          <SheetDescription>
            Move the database "{database.name || "Unknown Database"}" to the website "{targetDomainName}".
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <Alert>
              <AlertDescription>
                <strong>Note:</strong> This will move the database and its associated users to the target website. 
                The original owner will lose access via tools like phpMyAdmin if the database is moved to a different user's subscription.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">{database.name || "Unknown Database"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Target Website</p>
                  <p className="text-sm text-muted-foreground">{targetDomainName}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        setConfirmed(e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I understand that this action will move the database to the target website
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={assignDatabase.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={assignDatabase.isPending || !confirmed}>
                {assignDatabase.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Assign Database
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
