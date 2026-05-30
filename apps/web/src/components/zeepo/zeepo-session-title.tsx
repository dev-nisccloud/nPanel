"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const TITLE_MAX = 150;

type ZeepoSessionTitleProps = {
  sessionId: string;
  title: string;
  /** Auto-title generation in progress - show placeholder, block edit. */
  isAutoNaming?: boolean;
  disabled?: boolean;
  /** Single-line header: truncate with ellipsis, no helper text while editing. */
  inline?: boolean;
  className?: string;
};

export function ZeepoSessionTitle({
  sessionId,
  title,
  isAutoNaming = false,
  disabled = false,
  inline = false,
  className,
}: ZeepoSessionTitleProps) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const updateTitle = trpc.zeepoAgent.sessions.updateTitle.useMutation({
    onSuccess: (result) => {
      utils.zeepoAgent.sessions.get.setData({ id: sessionId }, (prev) =>
        prev?.data ? { ...prev, data: { ...prev.data, title: result.title } } : prev,
      );
      void utils.zeepoAgent.sessions.list.invalidate();
    },
    onError: (e) => {
      toast.error(e.message || "Could not rename chat");
      setDraft(title);
    },
  });

  const displayTitle = title.trim() || "New chat";
  const canEdit = !disabled && !isAutoNaming && !updateTitle.isPending;

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(displayTitle);
      return;
    }
    if (trimmed === displayTitle) return;
    updateTitle.mutate({ id: sessionId, title: trimmed.slice(0, TITLE_MAX) });
  };

  const cancel = () => {
    setDraft(displayTitle);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("min-w-0 max-w-full", inline ? "flex-1" : "w-full", className)}>
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, TITLE_MAX))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          disabled={updateTitle.isPending}
          placeholder="Chat name"
          aria-label="Chat title"
          className={cn(
            "h-8 min-w-0 border-border bg-background px-2 text-sm font-semibold shadow-none focus-visible:ring-1",
            inline ? "w-full max-w-full" : "w-full",
          )}
        />
        {!inline ? (
          <p className="mt-0.5 px-0.5 text-[10px] text-muted-foreground">
            Enter to save · Esc to cancel
          </p>
        ) : null}
      </div>
    );
  }

  const titleButton = (
    <button
      type="button"
      disabled={!canEdit}
      onClick={() => canEdit && setEditing(true)}
      className={cn(
        "group/title inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-md px-1.5 py-1 text-left transition-colors",
        canEdit && "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      title={
        canEdit
          ? `Click to rename. ${displayTitle}`
          : displayTitle
      }
      aria-label={canEdit ? `Chat title: ${displayTitle}. Click to rename.` : `Chat title: ${displayTitle}`}
    >
      {isAutoNaming ? (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Spinner size={12} />
          Naming…
        </span>
      ) : updateTitle.isPending ? (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Spinner size={12} />
          Saving…
        </span>
      ) : (
        <>
          <span className="truncate text-sm font-semibold text-foreground">
            {displayTitle}
          </span>
          {canEdit ? (
            <Pencil
              className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-70"
              aria-hidden
            />
          ) : null}
        </>
      )}
    </button>
  );

  if (inline) {
    return <div className={cn("min-w-0 flex-1 overflow-hidden", className)}>{titleButton}</div>;
  }

  return <div className={cn("min-w-0 w-full", className)}>{titleButton}</div>;
}
