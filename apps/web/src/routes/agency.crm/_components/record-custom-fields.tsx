import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { CrmInfoCard } from "./crm-detail";

type EntityType = "company" | "contact" | "deal";
type FieldType = "text" | "number" | "date" | "boolean" | "select";

const FIELD_TYPES: { id: FieldType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "date", label: "Date" },
  { id: "boolean", label: "Yes / No" },
  { id: "select", label: "Select" },
];

function slugify(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z_]/.test(slug) ? slug : `field_${slug || "value"}`;
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function RecordCustomFields({
  entityType,
  recordId,
  values,
}: {
  entityType: EntityType;
  recordId: string;
  values: Record<string, unknown> | null | undefined;
}) {
  const utils = trpc.useUtils();
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  const fieldsQuery = trpc.crm.customFields.list.useQuery({
    entityType,
    isActive: true,
  });
  const fields = fieldsQuery.data?.data ?? [];
  const stored = values ?? {};

  const refresh = () => {
    utils.crm.customFields.list.invalidate();
    utils.crm.companies.get.invalidate();
    utils.crm.contacts.get.invalidate();
    utils.crm.deals.get.invalidate();
  };

  const createField = trpc.crm.customFields.create.useMutation({
    onSuccess: () => {
      setLabel("");
      setOptions("");
      refresh();
    },
    onError: (error) => toast.error(error.message || "Failed to add field"),
  });

  const updateCompany = trpc.crm.companies.update.useMutation({
    onSuccess: () => {
      toast.success("Custom fields saved");
      refresh();
    },
    onError: (error) => toast.error(error.message || "Failed to save fields"),
  });
  const updateContact = trpc.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Custom fields saved");
      refresh();
    },
    onError: (error) => toast.error(error.message || "Failed to save fields"),
  });
  const updateDeal = trpc.crm.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Custom fields saved");
      refresh();
    },
    onError: (error) => toast.error(error.message || "Failed to save fields"),
  });

  const saving = updateCompany.isPending || updateContact.isPending || updateDeal.isPending;

  const save = () => {
    const next = { ...stored };
    for (const field of fields) {
      const raw = draft[field.fieldName] ?? displayValue(stored[field.fieldName]);
      if (field.fieldType === "boolean") next[field.fieldName] = raw === "true";
      else if (field.fieldType === "number" || field.fieldType === "decimal") {
        next[field.fieldName] = raw === "" ? null : Number(raw);
      } else next[field.fieldName] = raw === "" ? null : raw;
    }
    if (entityType === "company") updateCompany.mutate({ id: recordId, customFields: next });
    else if (entityType === "contact") updateContact.mutate({ id: recordId, customFields: next });
    else updateDeal.mutate({ id: recordId, customFields: next });
  };

  return (
    <CrmInfoCard icon={SlidersHorizontal} title="Custom fields" description="Extra fields for this record">
      <div className="divide-y divide-border">
        {fields.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No custom fields for this record type.</p>
        ) : (
          fields.map((field) => {
            const current = draft[field.fieldName] ?? displayValue(stored[field.fieldName]);
            const selectOptions =
              (field.fieldConfig as { options?: Array<{ value: string; label: string; color?: string }> } | null)
                ?.options ?? [];
            return (
              <div key={field.id} className="grid grid-cols-[140px_1fr] items-center gap-3 px-4 py-2.5">
                <p className="truncate text-xs text-muted-foreground">{field.fieldLabel}</p>
                {field.fieldType === "boolean" ? (
                  <Select
                    value={current || "false"}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, [field.fieldName]: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : field.fieldType === "select" ? (
                  <Select
                    value={current || undefined}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, [field.fieldName]: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="inline-flex items-center gap-2">
                            {option.color ? (
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                            ) : null}
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-8"
                    type={field.fieldType === "number" || field.fieldType === "decimal" ? "number" : field.fieldType === "date" ? "date" : "text"}
                    value={current}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, [field.fieldName]: event.target.value }))
                    }
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">Add a field</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 max-w-[180px]"
            placeholder="Label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldType === "select" ? (
            <Input
              className="h-8 max-w-[220px]"
              placeholder="Options, comma separated"
              value={options}
              onChange={(event) => setOptions(event.target.value)}
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!label.trim() || createField.isPending}
            onClick={() =>
              createField.mutate({
                entityType,
                fieldName: slugify(label),
                fieldLabel: label.trim(),
                fieldType,
                fieldConfig:
                  fieldType === "select"
                    ? {
                        options: options
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean)
                          .map((option) => ({ value: slugify(option), label: option })),
                      }
                    : undefined,
              })
            }
          >
            Add field
          </Button>
          {fields.length > 0 ? (
            <Button type="button" size="sm" disabled={saving} onClick={save}>
              Save values
            </Button>
          ) : null}
        </div>
      </div>
    </CrmInfoCard>
  );
}
