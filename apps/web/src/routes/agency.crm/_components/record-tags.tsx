import { useState } from "react";
import { Tags, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { CrmInfoCard } from "./crm-detail";

const TAG_COLORS = ["#0F766E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"];

export type TagRef = {
  id: string;
  name: string;
  color: string | null;
};

type Kind = "company" | "contact" | "deal";

export function tagRefsFromAssignments(
  assignments: Array<{ tag?: { id: string; name: string; color: string | null } | null }> | null | undefined,
): TagRef[] {
  return (assignments ?? [])
    .map((assignment) => assignment.tag)
    .filter((tag): tag is TagRef => !!tag);
}

export function TagChips({ tags }: { tags: TagRef[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px]"
          style={tag.color ? { borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}18` } : undefined}
        >
          {tag.name}
        </Badge>
      ))}
      {tags.length > 3 ? (
        <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
      ) : null}
    </div>
  );
}

export function RecordTags({
  kind,
  recordId,
  tags,
}: {
  kind: Kind;
  recordId: string;
  tags: TagRef[];
}) {
  const utils = trpc.useUtils();
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [draftName, setDraftName] = useState("");
  const tagsQuery = trpc.crm.tags.list.useQuery({ page: 1, limit: 100 });

  const refresh = () => {
    utils.crm.tags.list.invalidate();
    utils.crm.companies.get.invalidate();
    utils.crm.companies.list.invalidate();
    utils.crm.contacts.get.invalidate();
    utils.crm.contacts.list.invalidate();
    utils.crm.deals.get.invalidate();
    utils.crm.deals.list.invalidate();
  };

  const assignCompany = trpc.crm.tags.assignToCompany.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to add tag"),
  });
  const assignContact = trpc.crm.tags.assignToContact.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to add tag"),
  });
  const assignDeal = trpc.crm.tags.assignToDeal.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to add tag"),
  });
  const removeCompany = trpc.crm.tags.removeFromCompany.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to remove tag"),
  });
  const removeContact = trpc.crm.tags.removeFromContact.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to remove tag"),
  });
  const removeDeal = trpc.crm.tags.removeFromDeal.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to remove tag"),
  });

  const assignTag = (tagId: string) => {
    if (kind === "company") assignCompany.mutate({ tagId, companyId: recordId });
    else if (kind === "contact") assignContact.mutate({ tagId, contactId: recordId });
    else assignDeal.mutate({ tagId, dealId: recordId });
  };

  const removeTag = (tagId: string) => {
    if (kind === "company") removeCompany.mutate({ tagId, companyId: recordId });
    else if (kind === "contact") removeContact.mutate({ tagId, contactId: recordId });
    else removeDeal.mutate({ tagId, dealId: recordId });
  };

  const create = trpc.crm.tags.create.useMutation({
    onSuccess: (tag) => {
      if (!tag) return;
      setDraftName("");
      assignTag(tag.id);
    },
    onError: (error) => toast.error(error.message || "Failed to create tag"),
  });

  const available = (tagsQuery.data?.data ?? [])
    .filter((tag) => !tags.some((assigned) => assigned.id === tag.id))
    .map((tag) => ({ id: tag.id, label: tag.name }));

  return (
    <CrmInfoCard icon={Tags} title="Tags" description="Labels and colors">
      <div className="space-y-3 px-4 py-3">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="gap-1 pr-1"
                style={
                  tag.color
                    ? { borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}18` }
                    : undefined
                }
              >
                {tag.name}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-background/80"
                  aria-label={`Remove ${tag.name}`}
                  onClick={() => removeTag(tag.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <ComboboxDropdown
          placeholder="Add existing tag"
          searchPlaceholder="Search tags..."
          items={available}
          onSelect={(item) => assignTag(item.id)}
          emptyResults="No other tags"
          disabled={tagsQuery.isLoading || assignCompany.isPending || assignContact.isPending || assignDeal.isPending}
          inDialog
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="New tag name"
            className="h-8 max-w-[180px]"
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                className="h-5 w-5 rounded-full border"
                style={{
                  backgroundColor: swatch,
                  outline: color === swatch ? "2px solid var(--foreground)" : undefined,
                  outlineOffset: 1,
                }}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!draftName.trim() || create.isPending}
            onClick={() => create.mutate({ name: draftName.trim(), color })}
          >
            Create
          </Button>
        </div>
      </div>
    </CrmInfoCard>
  );
}
