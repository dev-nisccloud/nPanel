"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ZeepoRenameChatTarget = {
  id: string;
  title?: string | null;
};

type ZeepoRenameChatDialogProps = {
  target: ZeepoRenameChatTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, title: string) => void | Promise<void>;
  isPending?: boolean;
};

const TITLE_MAX = 150;

export function ZeepoRenameChatDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ZeepoRenameChatDialogProps) {
  const current = target?.title?.trim() || "New chat";
  const [draft, setDraft] = useState(current);

  useEffect(() => {
    if (open) setDraft(target?.title?.trim() || "New chat");
  }, [open, target?.id, target?.title]);

  const trimmed = draft.trim();
  const canSave = Boolean(target) && trimmed.length > 0 && trimmed !== current && !isPending;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename chat</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a clear name for this conversation. Messages and generated files stay the same —
            only the title in your history changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-1">
          <Input
            value={draft}
            maxLength={TITLE_MAX}
            disabled={isPending}
            placeholder="Chat name"
            aria-label="New chat title"
            onChange={(e) => setDraft(e.target.value.slice(0, TITLE_MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave && target) {
                e.preventDefault();
                void onConfirm(target.id, trimmed.slice(0, TITLE_MAX));
              }
            }}
            autoFocus
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Current name: <span className="font-medium text-foreground">{current}</span>
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canSave}
            className={cn(buttonVariants())}
            onClick={(e) => {
              e.preventDefault();
              if (!target || !canSave) return;
              void onConfirm(target.id, trimmed.slice(0, TITLE_MAX));
            }}
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size={14} className="text-current" />
                Saving…
              </span>
            ) : (
              "Save name"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
