"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Building2,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { CountrySelect } from "@/components/account-settings/country-select";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

type RadioPrefVal = "yes" | "no" | "unset";
type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const triRadio = z.enum(["yes", "no", "unset"]);

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    generalEmailsAccepted: triRadio,
    invoiceEmailsAccepted: triRadio,
    supportEmailsAccepted: triRadio,
    productEmailsAccepted: triRadio,
    domainEmailsAccepted: triRadio,
    affiliateEmailsAccepted: triRadio,
    marketingEmailsAccepted: triRadio,
    smsMarketingAccepted: triRadio,
    howDidYouFindUs: z.string().optional(),
    adminNotes: z.string().optional(),
    acceptedTermsAndConditions: triRadio,
    createOrganizationEnabled: z.boolean(),
    createOrganizationName: z.string().optional(),
    createOrganizationCurrency: z.string(),
    addToOrganizationEnabled: z.boolean(),
    addToOrganizations: z.array(
      z.object({
        teamId: z.string(),
        role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.createOrganizationEnabled) {
      const name = data.createOrganizationName?.trim() ?? "";
      if (name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["createOrganizationName"],
          message: "Organization name must be at least 2 characters",
        });
      }
    }

    if (!data.addToOrganizationEnabled) return;

    if (data.addToOrganizations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addToOrganizations"],
        message: "Add at least one organization",
      });
      return;
    }

    data.addToOrganizations.forEach((membership, index) => {
      if (!membership.teamId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addToOrganizations", index, "teamId"],
          message: "Select an organization",
        });
      }
    });

    const selectedTeamIds = data.addToOrganizations.map((membership) => membership.teamId).filter(Boolean);
    if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addToOrganizations"],
        message: "Each organization can only be added once",
      });
    }
  });

type FormData = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormData = {
  name: "",
  email: "",
  password: "",
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
  createOrganizationEnabled: false,
  createOrganizationName: "",
  createOrganizationCurrency: "KES",
  addToOrganizationEnabled: false,
  addToOrganizations: [],
};

function radioToBool(value: RadioPrefVal): boolean | null | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function nonempty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function TriRadio({
  id,
  value,
  onChange,
}: {
  id: string;
  value: RadioPrefVal;
  onChange: (value: RadioPrefVal) => void;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as RadioPrefVal)}
      className="flex gap-4"
    >
      {(["yes", "no", "unset"] as const).map((opt) => {
        const optionId = `${id}-${opt}`;
        return (
          <div key={opt} className="flex items-center gap-1.5">
            <RadioGroupItem value={opt} id={optionId} />
            <label htmlFor={optionId} className="text-sm cursor-pointer capitalize">
              {opt === "unset" ? "Not set" : opt === "yes" ? "Yes" : "No"}
            </label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

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

interface CreateClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClientSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const utils = trpc.useUtils();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const createOrganizationEnabled = form.watch("createOrganizationEnabled");
  const addToOrganizationEnabled = form.watch("addToOrganizationEnabled");
  const membershipRows = form.watch("addToOrganizations");

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "addToOrganizations",
  });

  const { data: teams = [] } = trpc.teams.getAll.useQuery(undefined, {
    enabled: open,
  });

  const teamItems = React.useMemo((): ComboboxItem[] => {
    return teams
      .filter((team) => team.isActive)
      .map((team) => ({
        id: team.id,
        label: team.name,
      }));
  }, [teams]);

  const selectedTeamIds = React.useMemo(
    () => new Set((membershipRows ?? []).map((row) => row.teamId).filter(Boolean)),
    [membershipRows],
  );

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (data, variables) => {
      captureEvent("client_created", {
        client_type: variables.role ?? "CUSTOMER",
      });

      const parts = ["Client created successfully"];
      if (data.createdOrganization) {
        parts.push(`${data.createdOrganization.name} was created with them as owner`);
      }
      if (data.addedMemberships.length > 0) {
        const membershipSummary = data.addedMemberships
          .map((membership) => `${membership.teamName} (${membership.role.toLowerCase()})`)
          .join(", ");
        parts.push(`added to ${membershipSummary}`);
      }
      toast.success(parts.join("  "));

      form.reset(DEFAULT_VALUES);
      setShowPassword(false);
      utils.clients.getAll.invalidate();
      utils.teams.getAll.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create client");
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      setShowPassword(false);
    }
  }, [open, form]);

  const generatePassword = () => {
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{};:,.<>/?";
    const all = uppers + lowers + digits + specials;
    const length = 14;

    const pwd = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];
    for (let i = pwd.length; i < length; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
    }
    form.setValue("password", pwd.join(""));
  };

  const onSubmit = (data: FormData) => {
    const profile = {
      firstName: nonempty(data.firstName),
      lastName: nonempty(data.lastName),
      phone: nonempty(data.phone),
      address: nonempty(data.address),
      city: nonempty(data.city),
      state: nonempty(data.state),
      country: nonempty(data.country),
      postalCode: nonempty(data.postalCode),
    };
    const hasProfile = Object.values(profile).some(Boolean);

    createClientMutation.mutate({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      role: "CUSTOMER",
      ...(hasProfile ? { profile } : {}),
      generalEmailsAccepted: radioToBool(data.generalEmailsAccepted),
      invoiceEmailsAccepted: radioToBool(data.invoiceEmailsAccepted),
      supportEmailsAccepted: radioToBool(data.supportEmailsAccepted),
      productEmailsAccepted: radioToBool(data.productEmailsAccepted),
      domainEmailsAccepted: radioToBool(data.domainEmailsAccepted),
      affiliateEmailsAccepted: radioToBool(data.affiliateEmailsAccepted),
      marketingEmailsAccepted: radioToBool(data.marketingEmailsAccepted),
      smsMarketingAccepted: radioToBool(data.smsMarketingAccepted),
      howDidYouFindUs: nonempty(data.howDidYouFindUs) ?? null,
      adminNotes: nonempty(data.adminNotes) ?? null,
      acceptedTermsAndConditions: radioToBool(data.acceptedTermsAndConditions),
      ...(data.createOrganizationEnabled
        ? {
            createOrganization: {
              name: data.createOrganizationName?.trim() ?? "",
              baseCurrency: data.createOrganizationCurrency,
            },
          }
        : {}),
      ...(data.addToOrganizationEnabled
        ? {
            addToOrganizations: data.addToOrganizations
              .filter((membership) => membership.teamId)
              .map((membership) => ({
                teamId: membership.teamId,
                role: membership.role,
              })),
          }
        : {}),
    });
  };

  const isPending = createClientMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Client</SheetTitle>
          <SheetDescription>
            Create the account, fill in profile details, and optionally set up or join an organization. Credentials are emailed after everything succeeds.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Account</h3>
                <p className="text-xs text-muted-foreground">Required login details for the new client.</p>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
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
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password or generate one"
                          className="w-full"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generatePassword}
                          aria-label="Generate password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Profile</h3>
                <p className="text-xs text-muted-foreground">Optional contact and address details.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+254 700 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Address
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
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
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Nairobi" {...field} />
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
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input placeholder="00100" {...field} />
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
                        placeholder="Select country…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email preferences
                </h3>
                <p className="text-xs text-muted-foreground">
                  Leave as not set unless you already know the client’s preference.
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
                          <TriRadio id={key} value={field.value} onChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="h-4 w-4" /> Marketing preferences
                </h3>
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
                          <TriRadio id={key} value={field.value} onChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Additional information
                </h3>
                <p className="text-xs text-muted-foreground">Internal notes visible only to agency staff.</p>
              </div>

              <FormField
                control={form.control}
                name="howDidYouFindUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" /> How did they find us?
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Google, Referral, Social media…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes about this client…"
                        className="resize-none min-h-[90px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptedTermsAndConditions"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <FormLabel className="font-medium text-sm">Accepted terms</FormLabel>
                      <FormDescription className="text-xs">
                        Agency-created accounts are treated as accepted unless you set this explicitly.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <TriRadio
                        id="acceptedTermsAndConditions"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Organization
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create an organization with this client as owner, add them to an existing one, or both.
                </p>
              </div>

              <FormField
                control={form.control}
                name="createOrganizationEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Create organization as owner
                      </FormLabel>
                      <FormDescription>
                        A new organization is created for them and they are added as the owner.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {createOrganizationEnabled && (
                <div className="grid gap-4 md:grid-cols-2 rounded-lg border p-4">
                  <FormField
                    control={form.control}
                    name="createOrganizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="createOrganizationCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default currency</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="KES">Kenyan Shillings (KES)</SelectItem>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="addToOrganizationEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Add to existing organizations
                      </FormLabel>
                      <FormDescription>
                        Add them to one or more organizations that already exist, each with its own role.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            if (form.getValues("addToOrganizations").length === 0) {
                              append({ teamId: "", role: "MEMBER" });
                            }
                          } else {
                            replace([]);
                          }
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {addToOrganizationEnabled && (
                <div className="space-y-3 rounded-lg border p-4">
                  {fields.map((membershipField, index) => {
                    const currentTeamId = membershipRows?.[index]?.teamId;
                    const availableTeamItems = teamItems.filter(
                      (item) => item.id === currentTeamId || !selectedTeamIds.has(item.id),
                    );
                    const selectedTeam = teamItems.find((item) => item.id === currentTeamId);

                    return (
                      <div key={membershipField.id} className="flex items-end gap-2">
                        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`addToOrganizations.${index}.teamId`}
                            render={({ field }) => (
                              <FormItem className="min-w-0">
                                <FormLabel>{index === 0 ? "Organization" : `Organization ${index + 1}`}</FormLabel>
                                <FormControl>
                                  <ComboboxDropdown
                                    items={availableTeamItems}
                                    selectedItem={selectedTeam}
                                    onSelect={(item) => field.onChange(item.id)}
                                    placeholder="Search organizations..."
                                    searchPlaceholder="Search..."
                                    emptyResults="No matching organizations"
                                    disabled={isPending}
                                    inDialog
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`addToOrganizations.${index}.role`}
                            render={({ field }) => (
                              <FormItem className="min-w-0">
                                <FormLabel>Role</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => field.onChange(value as TeamRole)}
                                  disabled={isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => remove(index)}
                          disabled={isPending || fields.length === 1}
                          aria-label="Remove organization"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  <FormField
                    control={form.control}
                    name="addToOrganizations"
                    render={() => <FormMessage />}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => append({ teamId: "", role: "MEMBER" })}
                    disabled={isPending || selectedTeamIds.size >= teamItems.length}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add another organization
                  </Button>
                </div>
              )}
            </section>

            <SheetFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(DEFAULT_VALUES);
                  onOpenChange(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Client"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
