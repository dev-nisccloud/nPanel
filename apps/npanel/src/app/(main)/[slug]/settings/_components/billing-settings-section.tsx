"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard, Edit, Plus, Mail, Phone, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CountrySelect } from "../../my-profile/_components/country-select";

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

  const handleDelete = () => {
    deleteMutation.mutate({ teamId });
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <CardHeader className="px-6 pt-6 pb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </div>
    );
  }

  const hasBilling = !!billingSettings;

  if (hasBilling && !isEditMode) {
    return (
      <>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Settings
              </CardTitle>
              <CardDescription>
                Company billing details used for invoices and receipts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Legal Name</p>
                  <p className="text-sm">{billingSettings.legalName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Billing Email</p>
                  <p className="text-sm">{billingSettings.billingEmail}</p>
                </div>
                {billingSettings.billingPhone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Billing Phone</p>
                    <p className="text-sm">{billingSettings.billingPhone}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-sm">
                  {billingSettings.addressLine1}
                  {billingSettings.addressLine2 ? `, ${billingSettings.addressLine2}` : ""}
                </p>
                <p className="text-sm">
                  {billingSettings.city}
                  {billingSettings.state ? `, ${billingSettings.state}` : ""}{" "}
                  {billingSettings.postalCode ?? ""}
                </p>
                <p className="text-sm">{billingSettings.country}</p>
              </div>
              {billingSettings.taxId && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                    <p className="text-sm">{billingSettings.taxId}</p>
                  </div>
                </>
              )}
              {billingSettings.additionalNotes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Additional Notes</p>
                    <p className="text-sm">{billingSettings.additionalNotes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Billing Settings</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove billing settings for this company? You can add them
                again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {hasBilling ? "Edit Billing Settings" : "Billing Settings"}
        </CardTitle>
        <CardDescription>
          {hasBilling
            ? "Update company billing details used for invoices and receipts"
            : "Add company billing details for invoices and receipts"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Legal Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Billing Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="billing@example.com" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Billing Phone
                    </FormLabel>
                    <FormControl>
                      <Input
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

            <Separator />

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Line 1
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Street Address" {...field} />
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
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Apartment, Suite, etc."
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Nairobi" {...field} />
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
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="State or Province"
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
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input
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
                  <FormLabel>Country</FormLabel>
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

            <Separator />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tax Identification Number"
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional billing information..."
                      className="resize-none"
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              {hasBilling && (
                <Button
                  type="button"
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
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                    <span>{hasBilling ? "Saving..." : "Adding..."}</span>
                  </div>
                ) : hasBilling ? (
                  "Save Changes"
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Billing Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </div>
  );
}
