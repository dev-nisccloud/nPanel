"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type AccessLevel = "none" | "read" | "write";

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
];

interface UserPermissionsSectionProps {
  teamId: string;
}

export function UserPermissionsSection({ teamId }: UserPermissionsSectionProps) {
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("");
  const [draft, setDraft] = React.useState<Record<string, AccessLevel>>({});

  const catalogQuery = trpc.teams.permissions.catalog.useQuery();
  const membersQuery = trpc.teams.getMembersAsMember.useQuery(
    { teamId },
    { enabled: Boolean(teamId) },
  );

  const members = membersQuery.data ?? [];
  const editableMembers = members.filter((m) => m.role !== "OWNER");

  React.useEffect(() => {
    if (!selectedMemberId && editableMembers.length > 0) {
      setSelectedMemberId(editableMembers[0]!.id);
    }
  }, [editableMembers, selectedMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const isOwnerRow = selectedMember?.role === "OWNER";

  const memberPermissionsQuery = trpc.teams.permissions.getMemberPermissions.useQuery(
    { teamId, memberId: selectedMemberId },
    { enabled: Boolean(teamId && selectedMemberId) },
  );

  React.useEffect(() => {
    const entries = catalogQuery.data?.entries ?? [];
    const granted = memberPermissionsQuery.data?.permissions ?? {};
    const next: Record<string, AccessLevel> = {};
    for (const entry of entries) {
      const value = granted[entry.key];
      next[entry.key] = value === "write" || value === "read" ? value : "none";
    }
    setDraft(next);
  }, [catalogQuery.data, memberPermissionsQuery.data, selectedMemberId]);

  const utils = trpc.useUtils();
  const saveMutation = trpc.teams.permissions.setMemberPermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissions saved");
      utils.teams.permissions.getMemberPermissions.invalidate({
        teamId,
        memberId: selectedMemberId,
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save permissions");
    },
  });

  const modules = catalogQuery.data?.modules ?? [];
  const entries = catalogQuery.data?.entries ?? [];
  const entriesByModule = React.useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = map.get(entry.module) ?? [];
      list.push(entry);
      map.set(entry.module, list);
    }
    return map;
  }, [entries]);

  const handleSave = () => {
    if (!selectedMemberId || isOwnerRow) return;
    saveMutation.mutate({
      teamId,
      memberId: selectedMemberId,
      permissions: Object.entries(draft).map(([key, access]) => ({
        key: key as (typeof entries)[number]["key"],
        access,
      })),
    });
  };

  if (membersQuery.isLoading || catalogQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (editableMembers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Invite a member to assign feature access. Owners always have full access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="permission-member">Member</Label>
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger id="permission-member" className="w-full max-w-md">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {(member.userName ?? member.userEmail ?? "Unknown") +
                  (member.role === "OWNER" ? " (Owner · full access)" : ` · ${member.role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          New members start with no access until you grant read or write on each sub-feature.
          Write includes read.
        </p>
      </div>

      {isOwnerRow ? (
        <div className="rounded-lg border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Owners have full access to every feature. Their permissions cannot be changed.
        </div>
      ) : memberPermissionsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={24} />
        </div>
      ) : (
        <>
          <div className="max-h-[min(70vh,40rem)] space-y-5 overflow-y-auto pr-1">
            {modules.map((mod) => {
              const rows = entriesByModule.get(mod.id) ?? [];
              if (rows.length === 0) return null;
              return (
                <div key={mod.id} className="space-y-2">
                  <h3 className="text-sm font-medium">{mod.label}</h3>
                  <div className="divide-y overflow-hidden rounded-lg border bg-card">
                    {rows.map((entry) => (
                      <div
                        key={entry.key}
                        className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{entry.label}</p>
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        </div>
                        <div className="inline-flex shrink-0 rounded-md border p-0.5">
                          {ACCESS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={cn(
                                "rounded-sm px-2.5 py-1 text-xs font-medium capitalize",
                                (draft[entry.key] ?? "none") === opt.value
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() =>
                                setDraft((prev) => ({ ...prev, [entry.key]: opt.value }))
                              }
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save permissions"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
