"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, MapPin, Mail, FileText, HelpCircle, ShieldCheck, Megaphone, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { CountrySelect } from "@/components/account-settings/country-select";

// ── helpers ──────────────────────────────────────────────────────────────────

type BoolPref = boolean | null;
type RadioPrefVal = "yes" | "no" | "unset";

function boolToRadio(v: BoolPref | undefined): RadioPrefVal {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "unset";
}

function radioToBool(v: RadioPrefVal): BoolPref {
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

// ── form schema ───────────────────────────────────────────────────────────────

const triRadio = z.enum(["yes", "no", "unset"]);

const formSchema = z.object({
  // Profile fields
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  // Email preferences (3-way: yes / no / unset)
  generalEmailsAccepted: triRadio.optional(),
  invoiceEmailsAccepted: triRadio.optional(),
  supportEmailsAccepted: triRadio.optional(),
  productEmailsAccepted: triRadio.optional(),
  domainEmailsAccepted: triRadio.optional(),
  affiliateEmailsAccepted: triRadio.optional(),
  marketingEmailsAccepted: triRadio.optional(),
  smsMarketingAccepted: triRadio.optional(),
  // Admin fields
  howDidYouFindUs: z.string().optional(),
  adminNotes: z.string().optional(),
  acceptedTermsAndConditions: triRadio.optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── 3-way radio component ─────────────────────────────────────────────────────

function TriRadio({ value, onChange }: { value: RadioPrefVal; onChange: (v: RadioPrefVal) => void }) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as RadioPrefVal)}
      className="flex gap-4"
    >
      {(["yes", "no", "unset"] as const).map((opt) => (
        <div key={opt} className="flex items-center gap-1.5">
          <RadioGroupItem value={opt} id={`${opt}-${Math.random()}`} />
          <label htmlFor={`${opt}-${Math.random()}`} className="text-sm cursor-pointer capitalize">
            {opt === "unset" ? "Not set" : opt === "yes" ? "Yes" : "No"}
          </label>
        </div>
      ))}
    </RadioGroup>
  );
}

// ── email pref config ─────────────────────────────────────────────────────────

const EMAIL_PREFS = [
  {
    key: "generalEmailsAccepted" as const,
    label: "General Emails",
    description: "All account-related emails",
  },
  {
    key: "invoiceEmailsAccepted" as const,
    label: "Invoice Emails",
    description: "New invoices, reminders & overdue notices",
  },
  {
    key: "supportEmailsAccepted" as const,
    label: "Support Emails",
    description: "Copy of all support ticket communications",
  },
  {
    key: "productEmailsAccepted" as const,
    label: "Product Emails",
    description: "Welcome emails, suspensions & lifecycle notifications",
  },
  {
    key: "domainEmailsAccepted" as const,
    label: "Domain Emails",
    description: "Registration/transfer confirmations & renewal notices",
  },
  {
    key: "affiliateEmailsAccepted" as const,
    label: "Affiliate Emails",
    description: "Affiliate programme notifications",
  },
] as const;

const MARKETING_PREFS = [
  {
    key: "marketingEmailsAccepted" as const,
    label: "Marketing Emails",
    description: "Promotional and marketing email communications",
  },
  {
    key: "smsMarketingAccepted" as const,
    label: "SMS Marketing",
    description: "Promotional and marketing text messages (SMS)",
  },
] as const;

// ── props ─────────────────────────────────────────────────────────────────────

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────

export function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: EditProfileDialogProps) {
  // Load profile (address/contact fields)
  const { data: profile, isLoading: isLoadingProfile } = trpc.clients.getProfile.useQuery(
    { userId },
    { enabled: open && !!userId },
  );

  // Load user record (name + all preference fields) - no `fields` filter = returns everything
  const { data: userRecord, isLoading: isLoadingUser } = trpc.userProfile.getUserById.useQuery(
    { userId },
    { enabled: open && !!userId },
  );

  const isLoading = isLoadingProfile || isLoadingUser;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      generalEmailsAccepted: "unset",
      invoiceEmailsAccepted: "unset",
      supportEmailsAccepted: "unset",
      productEmailsAccepted: "unset",
      domainEmailsAccepted: "unset",
      affiliateEmailsAccepted: "unset",
      marketingEmailsAccepted: "unset",
      smsMarketingAccepted: "unset",
      howDidYouFindUs: "",
      adminNotes: "",
      acceptedTermsAndConditions: "unset",
    },
  });

  // Populate form when data arrives
  React.useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }
    if (!profile || !userRecord) return;

    form.reset({
      name: userRecord.name ?? "",
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      country: profile.country ?? "",
      postalCode: profile.postalCode ?? "",
      // Email preferences - cast because getUserById returns unknown extra fields
      generalEmailsAccepted: boolToRadio((userRecord as any).generalEmailsAccepted),
      invoiceEmailsAccepted: boolToRadio((userRecord as any).invoiceEmailsAccepted),
      supportEmailsAccepted: boolToRadio((userRecord as any).supportEmailsAccepted),
      productEmailsAccepted: boolToRadio((userRecord as any).productEmailsAccepted),
      domainEmailsAccepted: boolToRadio((userRecord as any).domainEmailsAccepted),
      affiliateEmailsAccepted: boolToRadio((userRecord as any).affiliateEmailsAccepted),
      marketingEmailsAccepted: boolToRadio((userRecord as any).marketingEmailsAccepted),
      smsMarketingAccepted: boolToRadio((userRecord as any).smsMarketingAccepted),
      howDidYouFindUs: (userRecord as any).howDidYouFindUs ?? "",
      adminNotes: (userRecord as any).adminNotes ?? "",
      acceptedTermsAndConditions: boolToRadio((userRecord as any).acceptedTermsAndConditions),
    });
  }, [open, profile, userRecord, form]);

  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.clients.updateProfile.useMutation({
    onError: (err) => toast.error(err.message ?? "Failed to update profile"),
  });

  const updateClientMutation = trpc.clients.update.useMutation({
    onError: (err) => toast.error(err.message ?? "Failed to update client settings"),
  });

  const onSubmit = async (data: FormValues) => {
    const profilePayload: Record<string, string> = {};
    if (data.name?.trim()) profilePayload.name = data.name;
    if (data.firstName?.trim()) profilePayload.firstName = data.firstName;
    if (data.lastName?.trim()) profilePayload.lastName = data.lastName;
    if (data.phone?.trim()) profilePayload.phone = data.phone;
    if (data.address?.trim()) profilePayload.address = data.address;
    if (data.city?.trim()) profilePayload.city = data.city;
    if (data.state?.trim()) profilePayload.state = data.state;
    if (data.country?.trim()) profilePayload.country = data.country;
    if (data.postalCode?.trim()) profilePayload.postalCode = data.postalCode;

    const clientPayload: Record<string, unknown> = { userId };
    clientPayload.generalEmailsAccepted = radioToBool(data.generalEmailsAccepted ?? "unset");
    clientPayload.invoiceEmailsAccepted = radioToBool(data.invoiceEmailsAccepted ?? "unset");
    clientPayload.supportEmailsAccepted = radioToBool(data.supportEmailsAccepted ?? "unset");
    clientPayload.productEmailsAccepted = radioToBool(data.productEmailsAccepted ?? "unset");
    clientPayload.domainEmailsAccepted = radioToBool(data.domainEmailsAccepted ?? "unset");
    clientPayload.affiliateEmailsAccepted = radioToBool(data.affiliateEmailsAccepted ?? "unset");
    clientPayload.marketingEmailsAccepted = radioToBool(data.marketingEmailsAccepted ?? "unset");
    clientPayload.smsMarketingAccepted = radioToBool(data.smsMarketingAccepted ?? "unset");
    clientPayload.howDidYouFindUs = data.howDidYouFindUs?.trim() || null;
    clientPayload.adminNotes = data.adminNotes?.trim() || null;
    clientPayload.acceptedTermsAndConditions = radioToBool(data.acceptedTermsAndConditions ?? "unset");

    const hasProfileChanges = Object.keys(profilePayload).length > 0;

    await Promise.all([
      hasProfileChanges
        ? updateProfileMutation.mutateAsync({ userId, ...profilePayload })
        : Promise.resolve(),
      updateClientMutation.mutateAsync(clientPayload as any),
    ]);

    toast.success("Profile updated successfully");
    await Promise.all([
      utils.clients.getProfile.invalidate({ userId }),
      utils.clients.getAll.invalidate(),
      utils.userProfile.getUserById.invalidate({ userId }),
    ]);
    onOpenChange(false);
    onSuccess?.();
  };

  const isPending = updateProfileMutation.isPending || updateClientMutation.isPending;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update profile, contact info, email preferences and admin details for {userName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Basic info ── */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input placeholder="John" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone Number
                </FormLabel>
                <FormControl><Input placeholder="+254 700 000 000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            {/* ── Address ── */}
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </FormLabel>
                <FormControl><Input placeholder="123 Main Street" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel>
                  <FormControl><Input placeholder="Nairobi" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State / Province</FormLabel>
                  <FormControl><Input placeholder="Nairobi" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="postalCode" render={({ field }) => (
                <FormItem><FormLabel>Postal Code</FormLabel>
                  <FormControl><Input placeholder="00100" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <CountrySelect value={field.value} onValueChange={field.onChange} placeholder="Select country…" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            {/* ── Email preferences ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Preferences
              </h3>
              <p className="text-xs text-muted-foreground">
                Set which types of emails this client has agreed to receive.
              </p>
            </div>

            <div className="space-y-5">
              {EMAIL_PREFS.map(({ key, label, description }) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={key}
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel className="font-medium text-sm">{label}</FormLabel>
                        <FormDescription className="text-xs">{description}</FormDescription>
                      </div>
                      <FormControl>
                        <TriRadio
                          value={field.value ?? "unset"}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Separator />

            {/* ── Marketing preferences ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Marketing Preferences
              </h3>
              <p className="text-xs text-muted-foreground">
                Opt-in status for promotional marketing via email and SMS.
              </p>
            </div>

            <div className="space-y-5">
              {MARKETING_PREFS.map(({ key, label, description }) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={key}
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel className="font-medium text-sm flex items-center gap-2">
                          {key === "smsMarketingAccepted" && (
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {label}
                        </FormLabel>
                        <FormDescription className="text-xs">{description}</FormDescription>
                      </div>
                      <FormControl>
                        <TriRadio
                          value={field.value ?? "unset"}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Separator />

            {/* ── Admin / additional info ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Additional Information
              </h3>
              <p className="text-xs text-muted-foreground">
                Internal notes and reference details visible only to agency staff.
              </p>
            </div>

            <FormField control={form.control} name="howDidYouFindUs" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> How did they find us?
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Google, Referral, Social media…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="adminNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Internal notes about this client…"
                    className="resize-none min-h-[90px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField
              control={form.control}
              name="acceptedTermsAndConditions"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <FormLabel className="font-medium text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Terms & Conditions
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Whether this client has accepted the terms and conditions
                    </FormDescription>
                  </div>
                  <FormControl>
                    <TriRadio
                      value={field.value ?? "unset"}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { form.reset(); onOpenChange(false); }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Spinner size={16} className="mr-2" />Saving…</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
