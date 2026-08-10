"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Paperclip, Plus, Search, Send, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  filterZeepoAgentAttachmentFiles,
  ZEEPO_AGENT_MAX_ATTACHMENTS,
} from "@/lib/app-file-upload";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ZEEPO_AI_SKILLS, type ZeepoAiSkill } from "@/components/zeepo/zeepo-ai-types";
import { trpc } from "@/utils/trpc";

type PendingFile = {
  file: File;
  previewUrl: string;
  name: string;
  mimeType: string;
};

export function ZeepoAiComposer({
  onSubmit,
  onStop,
  showStop = false,
  sessionId,
  placeholder = "Ask me anything...",
  className,
  glow = true,
  disabled = false,
  value,
  onValueChange,
  showSkills = true,
}: {
  onSubmit: (payload: {
    message: string;
    searchEnabled: boolean;
    skillId?: string;
    attachmentIds?: string[];
  }) => void | Promise<void>;
  onStop?: () => void;
  showStop?: boolean;
  /** When set, uploads are registered against this session before submit. */
  sessionId?: string;
  placeholder?: string;
  className?: string;
  glow?: boolean;
  disabled?: boolean;
  value?: string;
  onValueChange?: (next: string) => void;
  showSkills?: boolean;
}) {
  const [internalValue, setInternalValue] = useState("");
  const inputValue = value ?? internalValue;
  const setInputValue = onValueChange ?? setInternalValue;

  const [searchEnabled, setSearchEnabled] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadZeepoAiAttachments,
    isUploading,
    progressPercent: uploadProgressPercent,
  } = useAppFileUpload();
  const registerAttachment = trpc.zeepoAi.messages.registerAttachment.useMutation();
  const skillsQuery = trpc.zeepoAi.skills.list.useQuery(undefined, {
    staleTime: 60_000,
  });

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend = useMemo(
    () =>
      Boolean(inputValue.trim() || pendingFiles.length > 0) &&
      !isUploading &&
      !disabled &&
      !showStop,
    [inputValue, pendingFiles.length, isUploading, disabled, showStop],
  );

  const skills = useMemo(() => {
    const fromApi = skillsQuery.data;
    if (fromApi?.length) {
      return fromApi
        .filter((s) => s.available !== false)
        .map(
          (s): ZeepoAiSkill => ({
            id: s.id,
            category: s.category,
            title: s.title,
            description: s.description,
            starterPrompt: s.starterPrompt ?? "",
            available: s.available,
          }),
        );
    }
    return ZEEPO_AI_SKILLS.filter((s) => s.available !== false);
  }, [skillsQuery.data]);

  const skillsByCategory = useMemo(() => {
    const map = new Map<string, ZeepoAiSkill[]>();
    for (const skill of skills) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return [...map.entries()];
  }, [skills]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const room = ZEEPO_AGENT_MAX_ATTACHMENTS - pendingFiles.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${ZEEPO_AGENT_MAX_ATTACHMENTS} files.`);
      return;
    }
    const { accepted, rejectedMessage } = filterZeepoAgentAttachmentFiles(
      Array.from(files).slice(0, room),
    );
    if (rejectedMessage) toast.error(rejectedMessage);
    if (!accepted.length) return;
    setPendingFiles((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        name: f.name,
        mimeType: f.type || "application/octet-stream",
      })),
    ]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const applySkill = (skill: ZeepoAiSkill) => {
    if (skill.available === false) {
      toast.message("Coming soon", { description: "This skill isn’t available yet." });
      return;
    }
    setActiveSkillId(skill.id);
    setInputValue(skill.starterPrompt);
    setSkillsOpen(false);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const handleSend = async () => {
    if (!canSend) return;
    const message = inputValue.trim();
    const staged = [...pendingFiles];
    const skillId = activeSkillId;

    try {
      let attachmentIds: string[] | undefined;
      if (staged.length) {
        if (!sessionId) {
          toast.error("Open or start a chat before attaching files.");
          return;
        }
        const uploaded = await uploadZeepoAiAttachments(staged.map((f) => f.file));
        attachmentIds = [];
        for (let i = 0; i < uploaded.length; i++) {
          const up = uploaded[i]!;
          const file = staged[i]?.file;
          const registered = await registerAttachment.mutateAsync({
            sessionId,
            url: up.publicUrl,
            storageKey: up.key,
            name: file?.name ?? staged[i]?.name ?? "attachment",
            mimeType: up.contentType || staged[i]?.mimeType || "application/octet-stream",
            sizeBytes: up.size,
          });
          attachmentIds.push(registered.id);
        }
      }
      await onSubmit({ message, searchEnabled, skillId, attachmentIds });
      setInputValue("");
      setActiveSkillId(undefined);
      staged.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setPendingFiles([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload files");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "zeepo-composer-shell zeepo-floating-dock-shadow overflow-hidden rounded-2xl border border-border/70 bg-card",
          "transition-[border-color,box-shadow] duration-300",
          glow && "zeepo-composer-glow",
        )}
      >
        {pendingFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-border/60 px-3 py-2">
            {pendingFiles.map((file, index) => {
              const isImage = file.mimeType.startsWith("image/");
              return (
                <div key={`${file.name}-${index}`} className="relative">
                  {isImage ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="size-14 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-14 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/60 px-1">
                      <FileText className="size-4 text-primary" />
                      <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                    onClick={() => removePendingFile(index)}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="px-4 pt-3.5 pb-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            disabled={disabled || showStop}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="w-full bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-0.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {showSkills ? (
              <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled || showStop}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
                      "disabled:pointer-events-none disabled:opacity-40",
                      activeSkillId
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">Skills</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="size-3.5 text-primary" />
                      Guided skills
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Start with a focused workflow
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {skillsByCategory.map(([category, categorySkills]) => (
                      <div key={category} className="mb-2 last:mb-0">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {category}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {categorySkills.map((skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              className="rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                              onClick={() => applySkill(skill)}
                            >
                              <p className="text-[13px] font-medium text-foreground">{skill.title}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                                {skill.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}

            <button
              type="button"
              onClick={() => setSearchEnabled((v) => !v)}
              disabled={disabled || showStop}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
                "disabled:pointer-events-none disabled:opacity-40",
                searchEnabled
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            <button
              type="button"
              aria-label="Attach files"
              disabled={
                disabled ||
                showStop ||
                isUploading ||
                pendingFiles.length >= ZEEPO_AGENT_MAX_ATTACHMENTS
              }
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {isUploading ? (
                <UploadProgressRing percent={uploadProgressPercent} size={14} strokeWidth={2} />
              ) : (
                <Paperclip className="size-3.5" />
              )}
              <span className="hidden sm:inline">{isUploading ? "Uploading…" : "Attach"}</span>
            </button>
          </div>

          {showStop && onStop ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={() => void handleSend()}
              disabled={!canSend}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-colors",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              <Send className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
