import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { CompanyFormSheet } from "../companies/company-form-sheet";

const NONE = "__none__";
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified"];
const LEAD_SOURCES = ["Website", "Referral", "Inbound", "Outbound", "Event", "LinkedIn"];
const SENIORITY_LEVELS = ["Entry", "Mid", "Senior", "Manager", "Director", "Executive"];

const contactFormSchema = z
  .object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  leadStatus: z.string().optional(),
  leadSource: z.string().optional(),
  seniority: z.string().optional(),
  dealName: z.string().optional(),
  dealAmount: z.number().optional(),
  currency: z.enum(["KES", "USD"]),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
})
  .superRefine((value, ctx) => {
    const hasDeal = Boolean(value.dealName?.trim()) || value.dealAmount != null;
    if (!hasDeal) return;
    if (!value.dealName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["dealName"], message: "Deal name is required" });
    }
    if (!value.pipelineId) {
      ctx.addIssue({ code: "custom", path: ["pipelineId"], message: "Pipeline is required" });
    }
    if (!value.stageId) {
      ctx.addIssue({ code: "custom", path: ["stageId"], message: "Stage is required" });
    }
  });

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any;
  onSuccess: () => void;
}

export function ContactFormSheet({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: ContactFormSheetProps) {
  const isEditing = !!contact;
  const utils = trpc.useUtils();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [createdCompanies, setCreatedCompanies] = useState<{ id: string; label: string }[]>([]);
  const companiesQuery = trpc.crm.companies.list.useQuery(
    { page: 1, limit: 100, isActive: true },
    { enabled: open },
  );
  const companyItems = useMemo(() => {
    const items = (companiesQuery.data?.data ?? []).map((company) => ({
      id: company.id,
      label: company.name,
    }));
    for (const created of createdCompanies) {
      if (!items.some((item) => item.id === created.id)) items.unshift(created);
    }
    if (contact?.company && !items.some((item) => item.id === contact.company.id)) {
      items.unshift({ id: contact.company.id, label: contact.company.name });
    }
    return [{ id: NONE, label: "No company" }, ...items];
  }, [companiesQuery.data?.data, contact, createdCompanies]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      notes: "",
      leadStatus: "",
      leadSource: "",
      seniority: "",
      dealName: "",
      dealAmount: undefined,
      currency: "KES",
      pipelineId: "",
      stageId: "",
    },
  });

  const pipelineId = useWatch({ control: form.control, name: "pipelineId" });
  const pipelinesQuery = trpc.crm.pipelines.list.useQuery(
    { page: 1, limit: 100 },
    { enabled: open },
  );
  const pipelines = pipelinesQuery.data?.data ?? [];
  const pipelineItems = pipelines.map((pipeline) => ({ id: pipeline.id, label: pipeline.name }));
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === pipelineId);
  const stageItems = (selectedPipeline?.stages ?? []).map((stage) => ({
    id: stage.id,
    label: stage.name,
  }));

  useEffect(() => {
    if (!open || contact || pipelineId || pipelines.length === 0) return;
    const pipeline = pipelines.find((item) => item.isDefault) ?? pipelines[0];
    if (!pipeline) return;
    form.setValue("pipelineId", pipeline.id);
    form.setValue("stageId", pipeline.stages?.[0]?.id ?? "");
  }, [open, contact, pipelineId, pipelines, form]);

  useEffect(() => {
    if (contact) {
      form.reset({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        jobTitle: contact.title || "",
        companyId: contact.companyId || "",
        address: contact.addressLine1 || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
        postalCode: contact.postalCode || "",
        notes: contact.notes || "",
        leadStatus: contact.leadStatus || "",
        leadSource: contact.leadSource || "",
        seniority: contact.seniority || "",
        dealName: "",
        dealAmount: undefined,
        currency: "KES",
        pipelineId: "",
        stageId: "",
      });
    } else {
      form.reset();
    }
  }, [contact, form]);

  const createMutation = trpc.crm.contacts.create.useMutation();
  const updateMutation = trpc.crm.contacts.update.useMutation();
  const createDeal = trpc.crm.deals.create.useMutation();

  const onSubmit = async (data: ContactFormValues) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      title: data.jobTitle || null,
      email: data.email || null,
      phone: data.phone || null,
      companyId: data.companyId || null,
      addressLine1: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      postalCode: data.postalCode || null,
      leadStatus: data.leadStatus || null,
      leadSource: data.leadSource || null,
      seniority: data.seniority || null,
    };

    const stage = selectedPipeline?.stages?.find((item) => item.id === data.stageId);
    const saveDeal = async (contactId: string) => {
      if (!data.dealName?.trim()) return;
      await createDeal.mutateAsync({
        name: data.dealName.trim(),
        pipelineId: data.pipelineId || "",
        stageId: data.stageId || "",
        companyId: data.companyId || null,
        primaryContactId: contactId,
        amount: data.dealAmount != null ? String(data.dealAmount) : null,
        currency: data.currency,
        probability: stage?.probability ?? null,
      });
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: contact.id, ...payload });
        await saveDeal(contact.id);
        toast.success(data.dealName?.trim() ? "Contact updated and deal added" : "Contact updated successfully");
        utils.crm.contacts.get.invalidate({ id: contact.id });
      } else {
        const created = await createMutation.mutateAsync(payload);
        await saveDeal(created.id);
        if ("reused" in created && created.reused) {
          toast.success(
            data.dealName?.trim()
              ? "This email already has a contact. The deal was added to that profile."
              : "This email already has a contact, so a second profile was not created.",
          );
        } else {
          toast.success(data.dealName?.trim() ? "Contact and deal created" : "Contact created successfully");
        }
      }
      utils.crm.contacts.list.invalidate();
      utils.crm.deals.list.invalidate();
      onSuccess();
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contact");
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || createDeal.isPending;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Contact" : "Create Contact"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the contact information below."
              : "Add a new contact to your CRM."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
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
                      <FormLabel>Last Name *</FormLabel>
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <ComboboxDropdown
                        placeholder="Select company"
                        searchPlaceholder="Search companies..."
                        items={companyItems}
                        selectedItem={
                          field.value
                            ? companyItems.find((item) => item.id === field.value)
                            : undefined
                        }
                        onSelect={(item) => field.onChange(item.id === NONE ? "" : item.id)}
                        emptyResults="No companies found"
                        disabled={companiesQuery.isLoading}
                        inDialog
                        className="w-full"
                        leadingAction={{
                          label: "Create company",
                          onSelect: () => setCompanyOpen(true),
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contact Information</h3>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Address</h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
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
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
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
                        <Input placeholder="94105" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Source</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="leadStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead status</FormLabel>
                      <Select
                        value={field.value || NONE}
                        onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Lead status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No status</SelectItem>
                          {(field.value && !LEAD_STATUSES.includes(field.value)
                            ? [field.value, ...LEAD_STATUSES]
                            : LEAD_STATUSES
                          ).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leadSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead source</FormLabel>
                      <Select
                        value={field.value || NONE}
                        onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No source</SelectItem>
                          {(field.value && !LEAD_SOURCES.includes(field.value)
                            ? [field.value, ...LEAD_SOURCES]
                            : LEAD_SOURCES
                          ).map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seniority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority</FormLabel>
                      <Select
                        value={field.value || NONE}
                        onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seniority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No seniority</SelectItem>
                          {(field.value && !SENIORITY_LEVELS.includes(field.value)
                            ? [field.value, ...SENIORITY_LEVELS]
                            : SENIORITY_LEVELS
                          ).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Deal</h3>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Add another deal on this same contact. Leave the name blank to skip."
                  : "Optional. A filled deal is attached to this contact, not saved as another contact."}
              </p>
              <FormField
                control={form.control}
                name="dealName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal name</FormLabel>
                    <FormControl>
                      <Input placeholder="Q4 enterprise deal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dealAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pipelineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales pipeline</FormLabel>
                      <FormControl>
                        <ComboboxDropdown
                          placeholder="Select pipeline"
                          searchPlaceholder="Search pipelines..."
                          items={pipelineItems}
                          selectedItem={pipelineItems.find((item) => item.id === field.value)}
                          onSelect={(item) => {
                            field.onChange(item.id);
                            const next = pipelines.find((pipeline) => pipeline.id === item.id);
                            form.setValue("stageId", next?.stages?.[0]?.id ?? "");
                          }}
                          emptyResults="No pipelines found"
                          disabled={pipelinesQuery.isLoading}
                          inDialog
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status in the pipeline</FormLabel>
                      <FormControl>
                        <ComboboxDropdown
                          placeholder={pipelineId ? "Select stage" : "Select a pipeline first"}
                          searchPlaceholder="Search stages..."
                          items={stageItems}
                          selectedItem={stageItems.find((item) => item.id === field.value)}
                          onSelect={(item) => field.onChange(item.id)}
                          emptyResults="No stages found"
                          disabled={!pipelineId || pipelinesQuery.isLoading}
                          inDialog
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Additional Information</h3>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this contact..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Contact" : "Create Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
    <CompanyFormSheet
      open={companyOpen}
      onOpenChange={setCompanyOpen}
      onSuccess={(company) => {
        if (company?.id && company.name) {
          setCreatedCompanies((current) => [
            { id: company.id, label: company.name },
            ...current.filter((item) => item.id !== company.id),
          ]);
          form.setValue("companyId", company.id, { shouldDirty: true });
        }
        setCompanyOpen(false);
        utils.crm.companies.list.invalidate();
      }}
    />
    </>
  );
}
