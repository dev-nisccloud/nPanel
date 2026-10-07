import { useEffect, useMemo } from "react";
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
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

const NONE = "__none__";

const dealFormSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  companyId: z.string().optional(),
  primaryContactId: z.string().optional(),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: any;
  onSuccess: () => void;
}

function withCurrent(items: ComboboxItem[], current?: ComboboxItem | null) {
  if (!current?.id || items.some((item) => item.id === current.id)) return items;
  return [current, ...items];
}

export function DealFormSheet({
  open,
  onOpenChange,
  deal,
  onSuccess,
}: DealFormSheetProps) {
  const isEditing = !!deal;
  const utils = trpc.useUtils();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      pipelineId: "",
      stageId: "",
      companyId: "",
      primaryContactId: "",
      value: undefined,
      probability: undefined,
      expectedCloseDate: "",
      description: "",
    },
  });

  const pipelineId = useWatch({ control: form.control, name: "pipelineId" });
  const stageId = useWatch({ control: form.control, name: "stageId" });
  const companyId = useWatch({ control: form.control, name: "companyId" });

  const pipelinesQuery = trpc.crm.pipelines.list.useQuery(
    { page: 1, limit: 100 },
    { enabled: open },
  );
  const companiesQuery = trpc.crm.companies.list.useQuery(
    { page: 1, limit: 100, isActive: true },
    { enabled: open },
  );
  const contactsQuery = trpc.crm.contacts.list.useQuery(
    {
      page: 1,
      limit: 100,
      isActive: true,
      companyId: companyId || undefined,
    },
    { enabled: open },
  );

  const pipelines = pipelinesQuery.data?.data ?? [];

  const pipelineItems = useMemo(
    () => pipelines.map((pipeline) => ({ id: pipeline.id, label: pipeline.name })),
    [pipelines],
  );

  const stageItems = useMemo(() => {
    const pipeline = pipelines.find((item) => item.id === pipelineId);
    const stages = (pipeline?.stages ?? []).map((stage) => ({
      id: stage.id,
      label: stage.name,
    }));
    return withCurrent(
      stages,
      deal?.stage && deal.stage.pipelineId === pipelineId
        ? { id: deal.stage.id, label: deal.stage.name }
        : deal?.stageId === stageId && deal?.stage
          ? { id: deal.stage.id, label: deal.stage.name }
          : null,
    );
  }, [pipelines, pipelineId, deal, stageId]);

  const companyItems = useMemo(() => {
    const items = (companiesQuery.data?.data ?? []).map((company) => ({
      id: company.id,
      label: company.name,
    }));
    return [
      { id: NONE, label: "No company" },
      ...withCurrent(
        items,
        deal?.company ? { id: deal.company.id, label: deal.company.name } : null,
      ),
    ];
  }, [companiesQuery.data?.data, deal]);

  const contactItems = useMemo(() => {
    const items = (contactsQuery.data?.data ?? []).map((contact) => ({
      id: contact.id,
      label: contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    }));
    const current =
      deal?.primaryContact && (!companyId || deal.primaryContact.companyId === companyId || deal.companyId === companyId)
        ? {
            id: deal.primaryContact.id,
            label:
              deal.primaryContact.fullName ||
              [deal.primaryContact.firstName, deal.primaryContact.lastName].filter(Boolean).join(" "),
          }
        : null;
    return [{ id: NONE, label: "No contact" }, ...withCurrent(items, current)];
  }, [contactsQuery.data?.data, deal, companyId]);

  useEffect(() => {
    if (!open) return;
    if (deal) {
      form.reset({
        name: deal.name || "",
        pipelineId: deal.pipelineId || "",
        stageId: deal.stageId || "",
        companyId: deal.companyId || "",
        primaryContactId: deal.primaryContactId || "",
        value: deal.amount != null ? Number(deal.amount) : undefined,
        probability: deal.probability ?? undefined,
        expectedCloseDate: deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
          : "",
        description: deal.description || "",
      });
      return;
    }
    form.reset({
      name: "",
      pipelineId: "",
      stageId: "",
      companyId: "",
      primaryContactId: "",
      value: undefined,
      probability: undefined,
      expectedCloseDate: "",
      description: "",
    });
  }, [deal, form, open]);

  useEffect(() => {
    if (!open || deal || pipelineId || pipelines.length === 0) return;
    const pipeline = pipelines.find((item) => item.isDefault) ?? pipelines[0];
    if (!pipeline) return;
    form.setValue("pipelineId", pipeline.id);
    form.setValue("stageId", pipeline.stages?.[0]?.id ?? "");
  }, [open, deal, pipelineId, pipelines, form]);

  const createMutation = trpc.crm.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully");
      utils.crm.deals.list.invalidate();
      utils.crm.companies.get.invalidate();
      utils.crm.contacts.get.invalidate();
      onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  const updateMutation = trpc.crm.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Deal updated successfully");
      utils.crm.deals.list.invalidate();
      if (deal?.id) utils.crm.deals.get.invalidate({ id: deal.id });
      utils.crm.companies.get.invalidate();
      utils.crm.contacts.get.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });

  const onSubmit = (data: DealFormValues) => {
    const payload = {
      name: data.name,
      pipelineId: data.pipelineId,
      stageId: data.stageId,
      companyId: data.companyId || null,
      primaryContactId: data.primaryContactId || null,
      amount: data.value != null ? String(data.value) : null,
      probability: data.probability ?? null,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      description: data.description || null,
    };

    if (isEditing) {
      updateMutation.mutate({
        id: deal.id,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Deal" : "Create Deal"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update the deal information below." : "Add a new deal to your pipeline."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Deal</h3>

              <FormField
                control={form.control}
                name="name"
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
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probability (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="50"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected close date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Deal details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Pipeline</h3>

              <FormField
                control={form.control}
                name="pipelineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline</FormLabel>
                    <FormControl>
                      <ComboboxDropdown
                        placeholder="Select pipeline"
                        searchPlaceholder="Search pipelines..."
                        items={pipelineItems}
                        selectedItem={pipelineItems.find((item) => item.id === field.value)}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          const next = pipelines.find((pipeline) => pipeline.id === item.id);
                          form.setValue("stageId", next?.stages?.[0]?.id ?? "", {
                            shouldValidate: true,
                          });
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
                    <FormLabel>Stage</FormLabel>
                    <FormControl>
                      <ComboboxDropdown
                        placeholder={pipelineId ? "Select stage" : "Select a pipeline first"}
                        searchPlaceholder="Search stages..."
                        items={stageItems.filter((item) => item.id !== NONE)}
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Related records</h3>

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
                        onSelect={(item) => {
                          const nextCompanyId = item.id === NONE ? "" : item.id;
                          field.onChange(nextCompanyId);
                          if (nextCompanyId !== companyId) {
                            form.setValue("primaryContactId", "");
                          }
                        }}
                        emptyResults="No companies found"
                        disabled={companiesQuery.isLoading}
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
                name="primaryContactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary contact</FormLabel>
                    <FormControl>
                      <ComboboxDropdown
                        placeholder="Select contact"
                        searchPlaceholder="Search contacts..."
                        items={contactItems}
                        selectedItem={
                          field.value
                            ? contactItems.find((item) => item.id === field.value)
                            : undefined
                        }
                        onSelect={(item) => field.onChange(item.id === NONE ? "" : item.id)}
                        emptyResults="No contacts found"
                        disabled={contactsQuery.isLoading}
                        inDialog
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditing ? "Update deal" : "Create deal"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
