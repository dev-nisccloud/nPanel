"use client";

import * as React from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CountrySelect } from "@/components/account-settings/country-select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { countries } from "@npanel/location/countries-intl";
import type { DomainPortfolio } from "./domain-portfolio-card";
import type { KenicHandlers, KenicRegistrantInfo } from "./domain-portfolio-contact-info";

type Intent = "update" | "replace";
type ContactRole = "owner" | "admin" | "tech" | "billing";
type ApplyMode = "all" | "each";

type OpCustomer = {
  handle?: string;
  email?: string;
  company_name?: string;
  name?: { first_name?: string; last_name?: string; full_name?: string };
  address?: {
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
    country?: string;
    state?: string;
  };
  phone?: { country_code?: string; area_code?: string; subscriber_number?: string };
  fax?: { country_code?: string; area_code?: string; subscriber_number?: string };
};

const emptyValues = {
  firstName: "",
  lastName: "",
  organization: "",
  email: "",
  phone: "",
  fax: "",
  street: "",
  number: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
};

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  organization: z.string(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  fax: z.string(),
  street: z.string().min(1, "Street is required"),
  number: z.string(),
  city: z.string().min(1, "City is required"),
  state: z.string(),
  postcode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ROLE_LABEL: Record<ContactRole, string> = {
  owner: "Contact handler",
  admin: "Admin handler",
  tech: "Technical handler",
  billing: "Billing handler",
};

const ROLE_HINT: Record<ContactRole, string> = {
  owner: "The registrant, and the legal contact for the domain.",
  admin: "Manages the domain, including transfers and contact changes.",
  tech: "Handles nameservers and technical problems.",
  billing: "Receives renewal and billing notices.",
};

const ROLES: ContactRole[] = ["owner", "admin", "tech", "billing"];

function formatPhone(
  phone?: { country_code?: string; area_code?: string; subscriber_number?: string },
): string {
  if (!phone) return "";
  const parts = [phone.country_code, phone.area_code, phone.subscriber_number].filter(Boolean);
  if (parts.length === 0) return "";
  const joined = parts.join(" ");
  return phone.country_code ? `+${joined.replace(/^\+\+/, "+")}` : joined;
}

function countryToName(value?: string): string {
  if (!value) return "";
  const t = value.trim();
  if (t.length === 2) {
    return countries.find((c) => c.alpha2.toUpperCase() === t.toUpperCase())?.name ?? t;
  }
  return countries.find((c) => c.name.toLowerCase() === t.toLowerCase())?.name ?? t;
}

function streetText(street?: string | string[]): string {
  if (Array.isArray(street)) return street.filter(Boolean).join(" ");
  return street ?? "";
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  if (!t) return { firstName: "", lastName: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: "" };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1) };
}

function formFromOp(customer: OpCustomer | null | undefined, fallback: DomainPortfolio): ContactFormValues {
  const first = customer?.name?.first_name ?? "";
  const last = customer?.name?.last_name ?? "";
  const fromFallback = splitFullName(fallback.ownerFullName || fallback.clientName || "");
  return {
    firstName: first || fromFallback.firstName,
    lastName: last || fromFallback.lastName,
    organization: customer?.company_name || fallback.ownerCompanyName || "",
    email: customer?.email || fallback.clientEmail || "",
    phone: formatPhone(customer?.phone),
    fax: formatPhone(customer?.fax),
    street: customer?.address?.street || "",
    number: customer?.address?.number || "",
    city: customer?.address?.city || "",
    state: customer?.address?.state || "",
    postcode: customer?.address?.zipcode || "",
    country: countryToName(customer?.address?.country),
  };
}

function xmlText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "#text" in value) {
    return String((value as { "#text"?: string })["#text"] ?? "");
  }
  return "";
}

function formFromKenic(info: KenicRegistrantInfo | null | undefined, fallback: DomainPortfolio): ContactFormValues {
  const names = splitFullName(xmlText(info?.name) || fallback.ownerFullName || fallback.clientName || "");
  return {
    ...emptyValues,
    ...names,
    organization: xmlText(info?.organization) || fallback.ownerCompanyName || "",
    email: xmlText(info?.email) || fallback.clientEmail || "",
    phone: xmlText(info?.voice) || "",
    fax: xmlText(info?.fax) || "",
    street: streetText(info?.address?.street),
    city: xmlText(info?.address?.city),
    state: xmlText(info?.address?.state),
    postcode: xmlText(info?.address?.postcode),
    country: countryToName(xmlText(info?.address?.country)),
  };
}

function ContactFields({
  form,
  nameLocked,
}: {
  form: UseFormReturn<ContactFormValues>;
  nameLocked: boolean;
}) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={nameLocked} />
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
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={nameLocked} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="organization"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization</FormLabel>
            <FormControl>
              <Input {...field} disabled={nameLocked} />
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
              <Input type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fax</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-6">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <CountrySelect value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

function HandlerForm({
  title,
  hint,
  initial,
  nameLocked,
  isKenic,
  submitLabel,
  submitting,
  disabled,
  onSubmit,
}: {
  title: string;
  hint?: string;
  initial: ContactFormValues;
  nameLocked: boolean;
  isKenic: boolean;
  submitLabel: string;
  submitting: boolean;
  disabled: boolean;
  onSubmit: (values: ContactFormValues) => Promise<void>;
}) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: initial,
  });

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            if (!isKenic && !values.lastName.trim()) {
              form.setError("lastName", { message: "Last name is required" });
              return;
            }
            await onSubmit(values);
          })}
          className="space-y-6"
        >
          <ContactFields form={form} nameLocked={nameLocked} />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || disabled}>
              {submitting ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Saving
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}

interface DomainContactEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio;
  source?: "kenic" | "openprovider";
  registrantInfo?: KenicRegistrantInfo | null;
  kenicHandlers?: KenicHandlers | null;
  opCustomer?: OpCustomer | null;
  opCustomerLoading?: boolean;
  allowReplace?: boolean;
  teamSlug?: string;
  onUpdated?: () => void | Promise<void>;
}

export function DomainContactEditDialog({
  open,
  onOpenChange,
  domain,
  source,
  registrantInfo,
  kenicHandlers,
  opCustomer,
  opCustomerLoading = false,
  allowReplace = true,
  teamSlug,
  onUpdated,
}: DomainContactEditDialogProps) {
  const isKenic = source === "kenic";
  const [intent, setIntent] = React.useState<Intent>("update");
  const [mode, setMode] = React.useState<ApplyMode>("all");
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [formsReady, setFormsReady] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setIntent("update");
    setMode("all");
  }, [open]);

  const domainId = Number.parseInt(String(domain.id), 10);
  const liveHandlesQuery = trpc.openProvider.domains.getHandles.useQuery(
    { domainId: Number.isFinite(domainId) ? domainId : 0 },
    { enabled: open && !isKenic && Number.isFinite(domainId) && domainId > 0, staleTime: 0 },
  );
  const liveHandles = liveHandlesQuery.data;

  const handles: Record<ContactRole, string> = {
    owner:
      (isKenic ? kenicHandlers?.owner?.handle : liveHandles?.owner || domain.ownerHandle) ||
      domain.ownerHandle ||
      "",
    admin: (isKenic ? kenicHandlers?.admin?.handle : liveHandles?.admin || domain.adminHandle) || "",
    tech: (isKenic ? kenicHandlers?.tech?.handle : liveHandles?.tech || domain.techHandle) || "",
    billing: (isKenic ? kenicHandlers?.billing?.handle : liveHandles?.billing || domain.billingHandle) || "",
  };

  const ownerQuery = trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handles.owner },
    { enabled: open && !isKenic && !!handles.owner && !opCustomer, staleTime: 0 },
  );
  const adminQuery = trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handles.admin },
    { enabled: open && !isKenic && !!handles.admin, staleTime: 0 },
  );
  const techQuery = trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handles.tech },
    { enabled: open && !isKenic && !!handles.tech, staleTime: 0 },
  );
  const billingQuery = trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handles.billing },
    { enabled: open && !isKenic && !!handles.billing, staleTime: 0 },
  );

  const opByRole: Record<ContactRole, OpCustomer | null> = {
    owner: opCustomer ?? ((ownerQuery.data?.data as OpCustomer | undefined) ?? null),
    admin: (adminQuery.data?.data as OpCustomer | undefined) ?? null,
    tech: (techQuery.data?.data as OpCustomer | undefined) ?? null,
    billing: (billingQuery.data?.data as OpCustomer | undefined) ?? null,
  };

  const kenicByRole: Record<ContactRole, KenicRegistrantInfo | null | undefined> = {
    owner: kenicHandlers?.owner ?? registrantInfo,
    admin: kenicHandlers?.admin,
    tech: kenicHandlers?.tech,
    billing: kenicHandlers?.billing,
  };

  const initialFor = React.useCallback(
    (role: ContactRole): ContactFormValues => {
      if (isKenic) {
        const info = kenicByRole[role];
        if (info) return formFromKenic(info, domain);
        return role === "owner" ? formFromKenic(registrantInfo, domain) : { ...emptyValues };
      }
      const customer = opByRole[role];
      if (customer) return formFromOp(customer, domain);
      if (role === "owner") return formFromOp(opCustomer, domain);
      return { ...emptyValues };
    },
    [domain, isKenic, kenicByRole, opByRole, opCustomer, registrantInfo],
  );

  const formLoading =
    open &&
    !isKenic &&
    ((liveHandlesQuery.isLoading && !liveHandles) ||
      (opCustomerLoading && !opCustomer && !ownerQuery.data) ||
      (!!handles.admin && adminQuery.isLoading && !adminQuery.data) ||
      (!!handles.tech && techQuery.isLoading && !techQuery.data) ||
      (!!handles.billing && billingQuery.isLoading && !billingQuery.data));

  React.useEffect(() => {
    if (!open) {
      setFormsReady(false);
      return;
    }
    if (!formLoading) setFormsReady(true);
  }, [open, formLoading]);

  const utils = trpc.useUtils();
  const opMutation = trpc.openProvider.domains.updateContact.useMutation();
  const kenicMutation = trpc.kenic.contactUpdate.update.useMutation();

  const refreshContactCard = async (nextHandle?: string) => {
    if (isKenic) {
      await utils.kenic.domainList.info.invalidate({ domain: domain.domain });
      await onUpdated?.();
      return;
    }
    await Promise.all([
      utils.openProvider.domains.list.invalidate(),
      utils.openProvider.domains.getHandles.invalidate(),
      utils.openProvider.customers.getByHandle.invalidate(),
    ]);
    if (nextHandle) {
      await utils.openProvider.customers.getByHandle.fetch({ handle: nextHandle });
    }
    await onUpdated?.();
  };

  const save = async (values: ContactFormValues, role: ContactRole, applyToAll: boolean) => {
    setSavingKey(applyToAll ? "all" : role);
    try {
      if (isKenic) {
        const result = await kenicMutation.mutateAsync({
          domain: domain.domain,
          intent,
          applyToAll,
          ...(applyToAll ? {} : { role }),
          ...(teamSlug ? { teamSlug } : {}),
          contact: {
            name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
            org: values.organization.trim() || undefined,
            street: [values.number.trim(), values.street.trim()].filter(Boolean).join(" "),
            city: values.city.trim(),
            sp: values.state.trim() || undefined,
            pc: values.postcode.trim(),
            country: values.country.trim(),
            voice: values.phone.trim(),
            fax: values.fax.trim() || undefined,
            email: values.email.trim(),
          },
        });
        toast.success(intent === "replace" ? "Contact replaced" : "Contact updated");
        await refreshContactCard(result.contactId);
      } else {
        const domainId = Number.parseInt(String(domain.id), 10);
        if (Number.isNaN(domainId)) {
          toast.error("Missing domain id.");
          return;
        }
        const result = await opMutation.mutateAsync({
          domainId,
          domain: domain.domain,
          intent,
          applyToAll,
          ...(applyToAll ? {} : { role }),
          ...(teamSlug ? { teamSlug } : {}),
          contact: {
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
            company_name: values.organization.trim() || undefined,
            email: values.email.trim(),
            phone: values.phone.trim(),
            fax: values.fax.trim() || undefined,
            street: values.street.trim(),
            number: values.number.trim() || undefined,
            city: values.city.trim(),
            state: values.state.trim() || undefined,
            zipcode: values.postcode.trim(),
            country: values.country.trim(),
          },
        });
        if (result.method === "replace" && result.usedTrade) {
          toast.success("Owner change submitted");
        } else {
          toast.success(intent === "replace" ? "Contact replaced" : "Contact updated");
        }
        if (result.emailVerificationStarted) {
          toast.message("Verification email sent to the owner.");
        }
        await refreshContactCard(result.handle);
      }
      if (applyToAll) onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save contact");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        {open && !formsReady && formLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-3 pr-8">
              <div className="flex items-center justify-between gap-6">
                <DialogTitle className="text-xl">Edit contact</DialogTitle>
                {allowReplace ? (
                  <div className="flex shrink-0 items-center gap-5 text-sm">
                    <button
                      type="button"
                      className={cn(
                        "border-b pb-0.5",
                        intent === "update"
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground",
                      )}
                      onClick={() => setIntent("update")}
                    >
                      Update details
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "border-b pb-0.5",
                        intent === "replace"
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground",
                      )}
                      onClick={() => setIntent("replace")}
                    >
                      Replace owner
                    </button>
                  </div>
                ) : null}
              </div>
              <DialogDescription>
                {intent === "replace"
                  ? "Create a new contact and assign it to the handlers you save."
                  : "Save these details to the registry."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Apply to all handlers</p>
                  <p className="text-xs text-muted-foreground">
                    On uses the contact handler for the others. Off edits each handler on its own.
                  </p>
                </div>
                <Switch
                  checked={mode === "all"}
                  onCheckedChange={(checked) => setMode(checked ? "all" : "each")}
                  aria-label="Apply to all handlers"
                />
              </div>

              {ROLES.map((role) => {
                const hasHandle = !!handles[role];
                const applyAll = mode === "all";
                if (applyAll && role !== "owner") {
                  const summary = initialFor(role);
                  const name = [summary.firstName, summary.lastName].filter(Boolean).join(" ") || "—";
                  const address =
                    [summary.number, summary.street, summary.city, summary.state, summary.postcode, summary.country]
                      .filter(Boolean)
                      .join(", ") || "—";
                  const rows = [
                    ["Name", name],
                    ["Organization", summary.organization || "—"],
                    ["Email", summary.email || "—"],
                    ["Phone", summary.phone || "—"],
                    ["Address", address],
                  ];
                  return (
                    <section key={`${role}-summary`} className="space-y-4 border-t border-border pt-6">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">{ROLE_LABEL[role]}</h3>
                        <p className="text-xs text-muted-foreground">{ROLE_HINT[role]}</p>
                      </div>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        {rows.map(([label, value]) => (
                          <div key={label} className={label === "Address" ? "sm:col-span-2" : undefined}>
                            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                            <dd className="mt-1 text-sm">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  );
                }
                const shared =
                  !!handles[role] &&
                  ROLES.some((other) => other !== role && handles[other] && handles[other] === handles[role]);
                const createsNew = intent === "replace" || !hasHandle || shared;
                return (
                  <HandlerForm
                    key={`${role}-${intent}-${handles[role]}-${applyAll ? "all" : "each"}`}
                    title={ROLE_LABEL[role]}
                    hint={ROLE_HINT[role]}
                    initial={initialFor(role)}
                    nameLocked={!isKenic && intent === "update" && (applyAll || !createsNew)}
                    isKenic={isKenic}
                    submitLabel={
                      applyAll
                        ? intent === "replace"
                          ? "Replace all handlers"
                          : "Save all handlers"
                        : intent === "replace"
                          ? `Replace ${ROLE_LABEL[role].toLowerCase()}`
                          : `Save ${ROLE_LABEL[role].toLowerCase()}`
                    }
                    submitting={savingKey === (applyAll ? "all" : role)}
                    disabled={savingKey != null && savingKey !== (applyAll ? "all" : role)}
                    onSubmit={(values) => save(values, role, applyAll)}
                  />
                );
              })}

              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={savingKey != null}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
