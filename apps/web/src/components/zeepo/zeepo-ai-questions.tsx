"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import { filterZeepoAgentAttachmentFiles } from "@/lib/app-file-upload";
import {
  compileClarifyingAnswers,
  type ZeepoAiClarifyingQuestion,
} from "@/components/zeepo/zeepo-ai-types";

type Attachment = { url: string; name: string; mimeType: string };

type FlowState = {
  triggerMessageId: string;
  currentIndex: number;
  answers: string[];
  customText: string;
  showCustom: boolean;
  uploadAttachments: Attachment[];
  isUploadingForStep: boolean;
  pendingUploadForStep?: Attachment;
};

export function ZeepoAiClarifyingQuestions({
  messageId,
  questions,
  onComplete,
  onDismiss,
  locked = false,
}: {
  messageId: string;
  questions: ZeepoAiClarifyingQuestion[];
  onComplete: (compiled: string, attachments: Attachment[]) => void;
  onDismiss: () => void;
  /** When true (e.g. still streaming partial questions), show chips but ignore answers. */
  locked?: boolean;
}) {
  const [flow, setFlow] = useState<FlowState>(() => ({
    triggerMessageId: messageId,
    currentIndex: 0,
    answers: [],
    customText: "",
    showCustom: false,
    uploadAttachments: [],
    isUploadingForStep: false,
  }));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadZeepoAiAttachments, progressPercent } = useAppFileUpload();

  useEffect(() => {
    setFlow((prev) => {
      if (prev.triggerMessageId !== messageId) {
        return {
          triggerMessageId: messageId,
          currentIndex: 0,
          answers: [],
          customText: "",
          showCustom: false,
          uploadAttachments: [],
          isUploadingForStep: false,
        };
      }
      // Questions can grow while partial JSON streams  keep progress, clamp index.
      if (questions.length === 0) return prev;
      let currentIndex = prev.currentIndex;
      if (currentIndex >= questions.length) {
        currentIndex = Math.max(0, questions.length - 1);
      }
      const answers =
        prev.answers.length > questions.length
          ? prev.answers.slice(0, questions.length)
          : prev.answers;
      if (currentIndex === prev.currentIndex && answers === prev.answers) return prev;
      return { ...prev, currentIndex, answers };
    });
  }, [messageId, questions.length]);

  const currentQ = questions[flow.currentIndex];
  if (!currentQ) return null;
  const total = questions.length;

  const advance = (answer: string, uploaded?: Attachment) => {
    if (locked) return;
    const newAnswers = [...flow.answers];
    newAnswers[flow.currentIndex] = answer;
    const newUploads = [...flow.uploadAttachments];
    if (uploaded) newUploads.push(uploaded);
    const nextIndex = flow.currentIndex + 1;
    if (nextIndex >= total) {
      onComplete(compileClarifyingAnswers(questions, newAnswers), newUploads);
      return;
    }
    const nextAnswer = newAnswers[nextIndex];
    const nextQ = questions[nextIndex];
    const nextIsCustom =
      nextAnswer !== undefined && nextQ !== undefined && !nextQ.options.includes(nextAnswer);
    setFlow({
      ...flow,
      currentIndex: nextIndex,
      answers: newAnswers,
      uploadAttachments: newUploads,
      customText: nextIsCustom ? nextAnswer : "",
      showCustom: nextIsCustom,
      isUploadingForStep: false,
      pendingUploadForStep: undefined,
    });
  };

  const goTo = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= total) return;
    if (targetIndex > flow.answers.length) return;
    const existingAnswer = flow.answers[targetIndex];
    const targetQ = questions[targetIndex];
    const isCustom =
      existingAnswer !== undefined &&
      targetQ !== undefined &&
      !targetQ.options.includes(existingAnswer);
    setFlow({
      ...flow,
      currentIndex: targetIndex,
      customText: isCustom ? existingAnswer : "",
      showCustom: isCustom,
    });
  };

  const selectOption = (opt: string) => {
    if (opt === "__other__") {
      setFlow((prev) => ({ ...prev, showCustom: true, customText: "" }));
      return;
    }
    advance(opt);
  };

  const currentAnswer = flow.answers[flow.currentIndex];
  const isCurrentAnswerCustom =
    currentAnswer !== undefined && !currentQ.options.includes(currentAnswer);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
        locked && "opacity-90",
      )}
    >
      {locked ? (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Loading the rest of the questions…
        </div>
      ) : null}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous question"
          disabled={locked || flow.currentIndex === 0}
          className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          onClick={() => goTo(flow.currentIndex - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {questions.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to question ${idx + 1}`}
              disabled={idx > flow.answers.length}
              className={cn(
                "rounded-full transition-all duration-200 disabled:pointer-events-none",
                idx < flow.currentIndex
                  ? "size-2 bg-primary hover:opacity-70"
                  : idx === flow.currentIndex
                    ? "size-2.5 bg-primary ring-2 ring-primary/30"
                    : idx <= flow.answers.length - 1
                      ? "size-2 bg-primary/50 hover:opacity-70"
                      : "size-2 bg-muted-foreground/25",
              )}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>

        <span className="text-[11px] font-medium text-muted-foreground">
          {flow.currentIndex + 1} / {total}
        </span>
        <span className="mx-0.5 text-[11px] text-muted-foreground/50">·</span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground/70">
          Answering helps me give you a better result
        </span>

        <button
          type="button"
          aria-label="Next question"
          disabled={
            locked ||
            flow.currentIndex + 1 >= total ||
            flow.currentIndex >= flow.answers.length
          }
          className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          onClick={() => goTo(flow.currentIndex + 1)}
        >
          <ChevronRight className="size-3.5" />
        </button>

        <button
          type="button"
          aria-label="Skip questions"
          disabled={locked}
          className="ml-1 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          onClick={onDismiss}
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="px-4 pb-2 pt-3.5">
        <p className="text-sm font-semibold leading-relaxed text-foreground">{currentQ.question}</p>
      </div>

      <div className={cn("flex flex-wrap gap-2 px-4 pb-3 pt-1", locked && "pointer-events-none opacity-70")}>
        {currentQ.options.map((opt) => {
          const isSelected = currentAnswer === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              className={cn(
                "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
                "disabled:cursor-not-allowed",
              )}
              onClick={() => selectOption(opt)}
            >
              {opt}
            </button>
          );
        })}
        <button
          type="button"
          disabled={locked}
          className={cn(
            "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
            flow.showCustom || isCurrentAnswerCustom
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
          )}
          onClick={() => selectOption("__other__")}
        >
          Other
        </button>

        {currentQ.allow_upload ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                const { accepted, rejectedMessage } = filterZeepoAgentAttachmentFiles([file]);
                if (rejectedMessage) toast.error(rejectedMessage);
                if (!accepted.length) return;
                setFlow((prev) => ({
                  ...prev,
                  isUploadingForStep: true,
                  pendingUploadForStep: undefined,
                }));
                try {
                  const results = await uploadZeepoAiAttachments(accepted);
                  const first = results[0];
                  if (!first) throw new Error("Upload failed");
                  setFlow((prev) => ({
                    ...prev,
                    isUploadingForStep: false,
                    pendingUploadForStep: {
                      url: first.publicUrl,
                      name: file.name,
                      mimeType: first.contentType || file.type || "application/octet-stream",
                    },
                  }));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed");
                  setFlow((prev) => ({ ...prev, isUploadingForStep: false }));
                }
              }}
            />
            <button
              type="button"
              disabled={flow.isUploadingForStep}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-all",
                "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {flow.isUploadingForStep ? (
                <UploadProgressRing percent={progressPercent} size={16} strokeWidth={2} />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload file
            </button>
          </>
        ) : null}
      </div>

      {flow.pendingUploadForStep ? (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
          <img
            src={flow.pendingUploadForStep.url}
            alt={flow.pendingUploadForStep.name}
            className="size-14 shrink-0 rounded-lg border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {flow.pendingUploadForStep.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Ready to use</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              size="icon"
              className="size-7 rounded-full"
              aria-label="Confirm upload"
              onClick={() => {
                const a = flow.pendingUploadForStep!;
                setFlow((prev) => ({ ...prev, pendingUploadForStep: undefined }));
                advance(`[Uploaded: ${a.name}]`, a);
              }}
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 rounded-full"
              aria-label="Remove upload"
              onClick={() => setFlow((prev) => ({ ...prev, pendingUploadForStep: undefined }))}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      {flow.showCustom ? (
        <div className="flex items-end gap-2 px-4 pb-3">
          <Textarea
            autoFocus
            placeholder="Type your answer…"
            value={flow.customText}
            onChange={(e) => setFlow((prev) => ({ ...prev, customText: e.target.value }))}
            className="min-h-[36px] flex-1 resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && flow.customText.trim()) {
                e.preventDefault();
                advance(flow.customText.trim());
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={!flow.customText.trim()}
            onClick={() => advance(flow.customText.trim())}
          >
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
