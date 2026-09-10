"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { KenicRegistrantInfo } from "./domain-portfolio-contact-info";

type Intent = "update" | "replace";
type ContactRole = "owner" | "admin" | "tech" | "billing";

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

interface DomainContactEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio;
  source?: "kenic" | "openprovider";
  registrantInfo?: KenicRegistrantInfo | null;
  opCustomer?: OpCustomer | null;
  opCustomerLoading?: boolean;
  onUpdated?: () => void | Promise<void>;
}

export function DomainContactEditDialog({
  open,
  onOpenChange,
  domain,
  source,
  registrantInfo,
  opCustomer,
  opCustomerLoading = false,
  onUpdated,
}: DomainContactEditDialogProps) {
  const isKenic = source === "kenic";
  const [intent, setIntent] = React.useState<Intent>("update");
  const [role, setRole] = React.useState<ContactRole>("owner");
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: emptyValues,
  });

  const otherRoles = React.useMemo(() => {
    if (isKenic) return [];
    const owner = domain.ownerHandle;
    const roles: Array<{ value: ContactRole; label: string; handle: string }> = [];
    if (domain.adminHandle && domain.adminHandle !== owner) {
      roles.push({ value: "admin", label: "Admin", handle: domain.adminHandle });
    }
    if (domain.techHandle && domain.techHandle !== owner) {
      roles.push({ value: "tech", label: "Technical", handle: domain.techHandle });
    }
    if (domain.billingHandle && domain.billingHandle !== owner) {
      roles.push({ value: "billing", label: "Billing", handle: domain.billingHandle });
    }
    return roles;
  }, [isKenic, domain.ownerHandle, domain.adminHandle, domain.techHandle, domain.billingHandle]);

  const handleForRole =
    role === "admin"
      ? domain.adminHandle
      : role === "tech"
        ? domain.techHandle
        : role === "billing"
          ? domain.billingHandle
          : domain.ownerHandle;

  const otherHandleQuery = trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handleForRole ?? "" },
    {
      enabled: open && !isKenic && role !== "owner" && !!handleForRole,
      staleTime: 0,
    },
  );

  const formLoading =
    open &&
    !isKenic &&
    ((role === "owner" && opCustomerLoading && !opCustomer) ||
      (role !== "owner" && otherHandleQuery.isLoading && !otherHandleQuery.data));

  React.useEffect(() => {
    if (!open) return;
    setIntent("update");
    setRole("owner");
    if (isKenic) {
      form.reset(formFromKenic(registrantInfo, domain));
    } else {
      form.reset(formFromOp(opCustomer, domain));
    }
  }, [open, isKenic, registrantInfo, opCustomer, domain, form]);

  React.useEffect(() => {
    if (!open || isKenic || role === "owner") return;
    const data = otherHandleQuery.data?.data as OpCustomer | undefined;
    if (data) form.reset(formFromOp(data, domain));
  }, [open, isKenic, role, otherHandleQuery.data, domain, form]);

  const utils = trpc.useUtils();
  const opMutation = trpc.openProvider.domains.updateContact.useMutation();
  const kenicMutation = trpc.kenic.contactUpdate.update.useMutation();
  const nameLocked = !isKenic && intent === "update";

  const refreshContactCard = async (nextHandle?: string) => {
    if (isKenic) {
      await utils.kenic.domainList.info.invalidate({ domain: domain.domain });
      await onUpdated?.();
      return;
    }
    await Promise.all([
      utils.openProvider.domains.list.invalidate(),
      utils.openProvider.customers.getByHandle.invalidate(),
    ]);
    if (nextHandle) {
      await utils.openProvider.customers.getByHandle.fetch({ handle: nextHandle });
    }
    await onUpdated?.();
  };

  const onSubmit = async (values: ContactFormValues) => {
    if (!isKenic && !values.lastName.trim()) {
      form.setError("lastName", { message: "Last name is required" });
      return;
    }

    setSubmitting(true);
    try {
      if (isKenic) {
        await kenicMutation.mutateAsync({
          domain: domain.domain,
          intent,
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
        toast.success(intent === "replace" ? "Owner updated" : "Contact updated");
        await refreshContactCard();
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
          role,
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
        if (result.method === "replace" && "usedTrade" in result && result.usedTrade) {
          toast.success("Owner change submitted");
        } else {
          toast.success(intent === "replace" ? "Owner updated" : "Contact updated");
        }
        if ("emailVerificationStarted" in result && result.emailVerificationStarted) {
          toast.message("Verification email sent to the owner.");
        }
        await refreshContactCard(result.handle);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save contact");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-8">
        {formLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : (
          <>
            <DialogHeader className="pb-6 space-y-2">
              <DialogTitle className="text-xl">Edit contact</DialogTitle>
              <DialogDescription className="pt-1 text-sm">
                {intent === "replace"
                  ? "Create a new owner and assign them to this domain."
                  : "Save these details to the registry."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <ToggleGroup
                  type="single"
                  value={intent}
                  onValueChange={(v) => {
                    if (v === "update" || v === "replace") {
                      setIntent(v);
                      if (v === "replace") setRole("owner");
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <ToggleGroupItem value="update" className="flex-1">
                    Update details
                  </ToggleGroupItem>
                  <ToggleGroupItem value="replace" className="flex-1">
                    Replace owner
                  </ToggleGroupItem>
                </ToggleGroup>

                {!isKenic && otherRoles.length > 0 && intent === "update" && (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select value={role} onValueChange={(v) => setRole(v as ContactRole)}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        {otherRoles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}

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

                <DialogFooter className="gap-2 sm:gap-0 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner size={16} className="mr-2" />
                        Saving
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
