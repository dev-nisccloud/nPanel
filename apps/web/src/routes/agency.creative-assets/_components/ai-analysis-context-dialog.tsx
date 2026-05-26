"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_ANALYSIS_CONTEXT = 4000;

export interface AiAnalysisContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Skip calls with no arg; Run analysis calls with trimmed context. */
  onRun: (userContext?: string) => void;
  isLoading?: boolean;
}

export function AiAnalysisContextDialog({
  open,
  onOpenChange,
  onRun,
  isLoading = false,
}: AiAnalysisContextDialogProps) {
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    if (open) setDraft("");
  }, [open]);

  const handleSkip = () => {
    if (isLoading) return;
    onRun(undefined);
    onOpenChange(false);
  };

  const handleRun = () => {
    if (isLoading) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    onRun(trimmed);
    onOpenChange(false);
  };

  const hasContext = draft.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[80] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
            Add context for better analysis?
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Tell us what this creative is for and where it will be used. Campaign goals, channels, audience, and placement
            notes help the AI score fit and give sharper recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="ai-analysis-context-dialog">Asset &amp; usage context</Label>
          <Textarea
            id="ai-analysis-context-dialog"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_ANALYSIS_CONTEXT))}
            disabled={isLoading}
            rows={4}
            placeholder="e.g. Meta feed ad for a spring sale, audience 25–45, must read clearly on mobile…"
            className="resize-y min-h-[100px] text-sm"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add context above for a tailored analysis, or skip to run without it.
          </p>
          <p className="text-xs text-muted-foreground tabular-nums text-right">
            {draft.length}/{MAX_ANALYSIS_CONTEXT}
          </p>
        </div>

        <DialogFooter className="mt-2 gap-3 sm:gap-3">
          <Button type="button" variant="outline" disabled={isLoading} onClick={handleSkip}>
            Skip
          </Button>
          <Button
            type="button"
            disabled={isLoading || !hasContext}
            className="gap-2"
            onClick={handleRun}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            Run analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
