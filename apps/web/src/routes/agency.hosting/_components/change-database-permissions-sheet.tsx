"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Settings } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";

const FormSchema = z.object({
  role: z.enum(['readWrite', 'readOnly', 'writeOnly']),
});

interface ChangeDatabasePermissionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: z.infer<typeof databaseSchema>;
  userId: number; // Database user ID
  currentRole?: 'readWrite' | 'readOnly' | 'writeOnly';
  onSuccess?: () => void;
}

export function ChangeDatabasePermissionsSheet({ 
  open, 
  onOpenChange, 
  database,
  userId,
  currentRole,
  onSuccess 
}: ChangeDatabasePermissionsSheetProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      role: currentRole || 'readWrite',
    },
  });

  // Update form when currentRole changes
  React.useEffect(() => {
    if (currentRole) {
      form.setValue('role', currentRole);
    }
  }, [currentRole, form]);

  const changePermissions = trpc.plesk.databasesSetUser.update.useMutation({
    onSuccess: () => {
      toast.success("Database permissions updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("[ChangeDatabasePermissionsSheet] Change permissions error:", error);
      toast.error("Failed to update permissions", { 
        description: error.message || "Please try again." 
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      await changePermissions.mutateAsync({
        userId,
        role: data.role,
      });
    } catch (e) {
      console.error("[ChangeDatabasePermissionsSheet] Error in onSubmit:", e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Change Database Permissions</SheetTitle>
          <SheetDescription>
            Update the permissions for database user of "{database.name || "Unknown Database"}".
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="readWrite">
                        <div className="flex flex-col">
                          <span className="font-medium">Read & Write</span>
                          <span className="text-xs text-muted-foreground">Full access to read and modify data</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="readOnly">
                        <div className="flex flex-col">
                          <span className="font-medium">Read Only</span>
                          <span className="text-xs text-muted-foreground">Can only read data, cannot modify</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="writeOnly">
                        <div className="flex flex-col">
                          <span className="font-medium">Write Only</span>
                          <span className="text-xs text-muted-foreground">Can only write data, cannot read</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the permission level for this database user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={changePermissions.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={changePermissions.isPending}>
                {changePermissions.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Update Permissions
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
