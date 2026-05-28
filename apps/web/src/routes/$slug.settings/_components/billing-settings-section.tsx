"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { CreditCard, Edit, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";
import { CountrySelect } from "@/components/account-settings/country-select";
import { SettingsSection } from "@/components/account-settings/settings-section";

const billingSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  billingEmail: z.string().email("Enter a valid billing email"),
  billingPhone: z.string().optional().nullable(),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional().nullable(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
});

type BillingFormValues = z.infer<typeof billingSchema>;

interface BillingSettingsSectionProps {
  teamId: string;
}

function BillingSkeleton() {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function BillingSettingsSection({ teamId }: BillingSettingsSectionProps) {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const utils = trpc.useUtils();
  const { data: billingSettings, isLoading } = trpc.teamBilling.getByTeam.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      legalName: "",
      billingEmail: "",
      billingPhone: null,
      addressLine1: "",
      addressLine2: null,
      city: "",
      state: null,
      country: "",
      postalCode: null,
      taxId: null,
      additionalNotes: null,
    },
  });

  React.useEffect(() => {
    if (billingSettings) {
      form.reset({
        legalName: billingSettings.legalName,
        billingEmail: billingSettings.billingEmail,
        billingPhone: billingSettings.billingPhone ?? null,
        addressLine1: billingSettings.addressLine1,
        addressLine2: billingSettings.addressLine2 ?? null,
        city: billingSettings.city,
        state: billingSettings.state ?? null,
        country: billingSettings.country,
        postalCode: billingSettings.postalCode ?? null,
        taxId: billingSettings.taxId ?? null,
        additionalNotes: billingSettings.additionalNotes ?? null,
      });
    }
  }, [billingSettings, form]);

  const upsertMutation = trpc.teamBilling.upsert.useMutation({
    onSuccess: () => {
      toast.success(
        billingSettings
          ? "Billing settings updated successfully"
          : "Billing settings saved successfully"
      );
      utils.teamBilling.getByTeam.invalidate({ teamId });
      setIsEditMode(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save billing settings");
    },
  });

  const deleteMutation = trpc.teamBilling.delete.useMutation({
    onSuccess: () => {
      toast.success("Billing settings removed");
      utils.teamBilling.getByTeam.invalidate({ teamId });
      setDeleteDialogOpen(false);
      setIsEditMode(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to remove billing settings");
    },
  });

  const onSubmit = (data: BillingFormValues) => {
    upsertMutation.mutate({
      teamId,
      legalName: data.legalName,
      billingEmail: data.billingEmail,
      billingPhone: data.billingPhone ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state ?? null,
      country: data.country,
      postalCode: data.postalCode ?? null,
      taxId: data.taxId ?? null,
      additionalNotes: data.additionalNotes ?? null,
    });
  };

  if (isLoading) {
    return <BillingSkeleton />;
  }

  const hasBilling = !!billingSettings;

  if (hasBilling && !isEditMode) {
    return (
      <>
        <div className="rounded-lg border bg-card">
          <div className="flex items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Billing details</p>
                <p className="text-xs text-muted-foreground">
                  Used for invoices and receipts
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Legal name</p>
                <p className="mt-0.5 font-medium">{billingSettings.legalName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing email</p>
                <p className="mt-0.5 font-medium">{billingSettings.billingEmail}</p>
              </div>
              {billingSettings.billingPhone && (
                <div>
                  <p className="text-xs text-muted-foreground">Billing phone</p>
                  <p className="mt-0.5 font-medium">{billingSettings.billingPhone}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="mt-0.5">
                {billingSettings.addressLine1}
                {billingSettings.addressLine2 ? `, ${billingSettings.addressLine2}` : ""}
              </p>
              <p className="text-muted-foreground">
                {billingSettings.city}
                {billingSettings.state ? `, ${billingSettings.state}` : ""}{" "}
                {billingSettings.postalCode ?? ""}
              </p>
              <p>{billingSettings.country}</p>
            </div>

            {(billingSettings.taxId || billingSettings.additionalNotes) && (
              <>
                <Separator />
                {billingSettings.taxId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tax ID</p>
                    <p className="mt-0.5 font-medium">{billingSettings.taxId}</p>
                  </div>
                )}
                {billingSettings.additionalNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="mt-0.5">{billingSettings.additionalNotes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove billing settings</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove billing settings for this company? You can add them
                again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate({ teamId })}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y">
          <div className="space-y-5 p-4">
            <SettingsSection
              title={hasBilling ? "Edit billing details" : "Billing details"}
              description="Company information used for invoices and receipts"
            >
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Legal name</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Company Legal Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="billingEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Billing email</FormLabel>
                      <FormControl>
                        <Input className="h-9" type="email" placeholder="billing@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Billing phone</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title="Address">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Address line 1</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Address line 2</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9"
                        placeholder="Apartment, suite, etc."
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">State / province</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder="State or province"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Postal code</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder="00100"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Country</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select country..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>

            <Separator />

            <SettingsSection title="Additional">
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tax ID</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9"
                        placeholder="Tax identification number"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional billing information..."
                        className="min-h-[72px] resize-none"
                        rows={3}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>
          </div>

          <div className="flex justify-end gap-2 bg-muted/30 px-4 py-3">
            {hasBilling && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setIsEditMode(false);
                }}
                disabled={upsertMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                  {hasBilling ? "Saving..." : "Adding..."}
                </span>
              ) : hasBilling ? (
                "Save changes"
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add billing
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
