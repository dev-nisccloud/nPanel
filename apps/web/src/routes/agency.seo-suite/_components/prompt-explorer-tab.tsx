"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  asRecord,
  CREDENTIALS_TOAST,
  formatDate,
  getNested,
  type SeoProject,
} from "./seo-suite-utils";

const MODELS = ["chatgpt", "claude", "gemini", "perplexity"] as const;
type Model = (typeof MODELS)[number];

interface PromptExplorerTabProps {
  projectId: string;
  project: SeoProject;
}

export function PromptExplorerTab({ projectId }: PromptExplorerTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [prompt, setPrompt] = React.useState("");
  const [selected, setSelected] = React.useState<Set<Model>>(new Set(["chatgpt", "claude"]));
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [results, setResults] = React.useState<Record<string, unknown> | null>(null);

  const runs = trpc.seoSuite.listPromptRuns.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const tracked = trpc.seoSuite.listTrackedPrompts.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const runExplorer = trpc.seoSuite.runPromptExplorer.useMutation({
    onSuccess: (data) => {
      setResults(data.results as Record<string, unknown>);
      toast.success("Prompt explorer completed");
      utils.seoSuite.listPromptRuns.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Prompt explorer failed"),
  });

  const saveTracked = trpc.seoSuite.saveTrackedPrompt.useMutation({
    onSuccess: () => {
      toast.success("Prompt saved for tracking");
      utils.seoSuite.listTrackedPrompts.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to save prompt"),
  });

  const toggleModel = (m: Model) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const requestRun = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    if (!prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }
    if (!selected.size) {
      toast.error("Select at least one model");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmRun = () => {
    setConfirmOpen(false);
    runExplorer.mutate({
      projectId,
      prompt: prompt.trim(),
      models: Array.from(selected),
      confirmCost: true,
    });
  };

  const extractText = (payload: unknown): string => {
    const r = asRecord(payload);
    if (typeof r.error === "string") return `Error: ${r.error}`;
    const text =
      getNested(r, "items.0.response_text") ??
      getNested(r, "response_text") ??
      getNested(r, "items.0.sections.0.text") ??
      (typeof payload === "string" ? payload : null);
    if (typeof text === "string") return text;
    return JSON.stringify(payload, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Prompt</label>
        <Textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask how AI models recommend brands in your niche…"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {MODELS.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm capitalize">
            <Checkbox checked={selected.has(m)} onCheckedChange={() => toggleModel(m)} />
            {m}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={runExplorer.isPending} onClick={requestRun}>
          {runExplorer.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Running…
            </>
          ) : (
            "Run explorer"
          )}
        </Button>
        <Button
          variant="outline"
          disabled={saveTracked.isPending || !prompt.trim()}
          onClick={() => saveTracked.mutate({ projectId, prompt: prompt.trim() })}
        >
          Save tracked prompt
        </Button>
      </div>

      {results && (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(results).map(([model, payload]) => (
            <div key={model} className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold capitalize">{model}</h3>
              <pre className="text-xs whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 max-h-80 overflow-auto">
                {extractText(payload)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {(tracked.data ?? []).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Tracked prompts</h3>
          <ul className="space-y-2">
            {(tracked.data ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-lg border bg-card px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                onClick={() => setPrompt(p.prompt)}
              >
                {p.prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(runs.data ?? []).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Recent runs</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {(runs.data ?? []).slice(0, 5).map((r) => (
              <li key={r.id}>
                {formatDate(r.createdAt)} · {(r.models as string[] | null)?.join(", ")} ·{" "}
                {r.prompt.slice(0, 80)}
                {r.prompt.length > 80 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm paid AI request</AlertDialogTitle>
            <AlertDialogDescription>
              Prompt Explorer calls paid DataForSEO LLM endpoints for each selected model (
              {Array.from(selected).join(", ")}). Continue only if you accept the vendor cost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRun}>Confirm & run</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
