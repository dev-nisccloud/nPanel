"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const transferFormSchema = z.object({
  domain: z.string().min(1, "Domain name is required").regex(/^[a-z0-9-]+$/i, "Invalid domain name format"),
  extension: z.string().min(1, "Domain extension is required"),
  authCode: z.string().min(1, "Authorization code is required"),
  ownerHandle: z.string().min(1, "Owner handle is required"),
  adminHandle: z.string().min(1, "Admin handle is required"),
  techHandle: z.string().min(1, "Tech handle is required"),
  billingHandle: z.string().optional(),
  autoRenew: z.enum(["on", "off", "default"]).optional().default("default"),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferFormProps {
  onSuccess?: () => void;
}

export function TransferForm({ onSuccess }: TransferFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      domain: "",
      extension: "",
      authCode: "",
      ownerHandle: "",
      adminHandle: "",
      techHandle: "",
      billingHandle: "",
      autoRenew: "default",
    },
  });

  const onSubmit = async (data: TransferFormValues) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Replace with actual API call
      // const result = await trpc.openProvider.domains.transfer.mutate(data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Domain transfer initiated successfully", {
        description: `Transfer request for ${data.domain}${data.extension} has been submitted.`,
      });
      
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to initiate transfer", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Domain Name */}
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Name</FormLabel>
                    <FormControl>
                      <Input placeholder="example" {...field} />
                    </FormControl>
                    <FormDescription>Enter the domain name without the extension</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Domain Extension */}
              <FormField
                control={form.control}
                name="extension"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension</FormLabel>
                    <FormControl>
                      <Input placeholder=".com" {...field} />
                    </FormControl>
                    <FormDescription>Enter the domain extension (e.g., .com, .org)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Authorization Code */}
            <FormField
              control={form.control}
              name="authCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorization Code (EPP Code)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter authorization code from current registrar" {...field} />
                  </FormControl>
                  <FormDescription>
                    The authorization code is required to transfer the domain. You can obtain this from your current registrar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Handle */}
              <FormField
                control={form.control}
                name="ownerHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="OWNER-12345" {...field} />
                    </FormControl>
                    <FormDescription>Contact handle for domain owner</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin Handle */}
              <FormField
                control={form.control}
                name="adminHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="ADMIN-12345" {...field} />
                    </FormControl>
                    <FormDescription>Contact handle for administrative contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tech Handle */}
              <FormField
                control={form.control}
                name="techHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="TECH-12345" {...field} />
                    </FormControl>
                    <FormDescription>Contact handle for technical contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Handle (Optional) */}
              <FormField
                control={form.control}
                name="billingHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Handle (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="BILLING-12345" {...field} />
                    </FormControl>
                    <FormDescription>Contact handle for billing contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto Renew */}
            <FormField
              control={form.control}
              name="autoRenew"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto Renewal</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="default">Use Default Setting</option>
                      <option value="on">Enable Auto Renewal</option>
                      <option value="off">Disable Auto Renewal</option>
                    </select>
                  </FormControl>
                  <FormDescription>Choose whether to enable automatic renewal for this domain</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  if (onSuccess) onSuccess();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                    <span>Initiating Transfer...</span>
                  </div>
                ) : (
                  "Initiate Transfer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

