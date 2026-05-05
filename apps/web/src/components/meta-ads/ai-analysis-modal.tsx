import React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import {
  Sparkles,
  Copy,
  Check,
  X,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  History
} from "lucide-react";

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | "IDLE";
  onRefresh?: () => void;
  campaignName: string;
  analyses?: any[];
}

export function AiAnalysisModal({
  isOpen,
  onClose,
  analysis,
  status,
  onRefresh,
  campaignName,
  analyses = [],
}: AiAnalysisModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [view, setView] = React.useState<"list" | "detail">(analysis ? "detail" : "list");
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<any>(null);

  // Sync view when analysis or status changes
  React.useEffect(() => {
    if (status === "PROCESSING") {
      setView("detail");
      setSelectedAnalysis(null);
    } else if (analysis && !selectedAnalysis && view === "list") {
      // If we have a fresh analysis and were in list view, stay in list view unless user clicks
    }
  }, [status, analysis]);

  const handleCopy = async (text?: string) => {
    const content = text || analysis || (selectedAnalysis?.analysis);
    if (content && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success("Analysis copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  const currentAnalysis = selectedAnalysis?.analysis || (view === "detail" ? analysis : null);
  const currentStatus = selectedAnalysis ? "COMPLETED" : status;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        // Reset view when closing
        setTimeout(() => {
          setView(analysis ? "detail" : "list");
          setSelectedAnalysis(null);
        }, 300);
      }
    }}>
      <DialogContent className="sm:max-w-[850px] w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl bg-background text-foreground border-none rounded-3xl">
        <DialogHeader className="p-6 flex-shrink-0 border-b flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {view === "detail" && selectedAnalysis && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedAnalysis(null);
                  setView("list");
                }}
                className="rounded-full -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {view === "list" ? "Past Conversations" : "AI Campaign Analysis"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {view === "list"
                  ? `Previous conversations for ${campaignName}`
                  : `Strategic insights for ${campaignName}`
                }
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedAnalysis(null);
                  setView("detail");
                  onRefresh();
                }}
                disabled={status === "PROCESSING"}
                className="rounded-full h-9 gap-2 bg-primary text-white hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4" />
                Run New Analysis
              </Button>
            )}
            {view === "detail" && analyses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("list")}
                className="rounded-full h-9 gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6">
              {view === "list" ? (
                <div className="space-y-4">
                  {analyses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                      <div className="p-4 rounded-full bg-muted/50">
                        <History className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">No Past Conversations</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                          You haven't generated any AI analyses for this campaign yet.
                        </p>
                      </div>
                      {onRefresh && (
                        <Button onClick={() => { setView("detail"); onRefresh(); }} className="mt-4 px-8 rounded-full">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Run First Analysis
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {analyses.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => {
                            setSelectedAnalysis(rec);
                            setView("detail");
                          }}
                          className="flex items-center justify-between p-4 rounded-2xl border bg-card hover:bg-accent transition-colors text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-2 rounded-lg",
                              rec.status === "COMPLETED" ? "bg-green-500/10 text-green-500" :
                                rec.status === "FAILED" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                              {rec.status === "COMPLETED" ? <Check className="w-4 h-4" /> :
                                rec.status === "FAILED" ? <X className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {format(new Date(rec.createdAt), "PPP")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(rec.createdAt), "p")} • {rec.status}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {currentStatus === "PROCESSING" ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">Generating Strategic Analysis...</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                          Our AI is currently processing your campaign metrics to provide actionable recommendations.
                        </p>
                      </div>
                    </div>
                  ) : currentStatus === "FAILED" && !currentAnalysis ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                      <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
                        <X className="w-10 h-10 text-destructive" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Analysis Generation Failed</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                          We couldn't generate the analysis. Please check your credentials or try again.
                        </p>
                      </div>
                      {onRefresh && (
                        <Button onClick={onRefresh} variant="outline" className="mt-4 rounded-full">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                      )}
                    </div>
                  ) : currentAnalysis ? (
                    <div className="max-w-none text-foreground/90">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 border-b pb-2" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-foreground mt-8 mb-4" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-foreground mt-6 mb-3" {...props} />,
                          p: ({ node, ...props }) => <p className="leading-relaxed mb-4 text-foreground/80" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground/80" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground/80" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-6 text-muted-foreground" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                          hr: ({ node, ...props }) => <hr className="my-8 border-muted" {...props} />,
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-6 rounded-xl border border-muted">
                              <table className="w-full text-sm text-left border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead className="bg-muted/50 text-foreground font-semibold" {...props} />,
                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-muted" {...props} />,
                          tr: ({ node, ...props }) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
                          th: ({ node, ...props }) => <th className="px-4 py-3 border-b border-muted" {...props} />,
                          td: ({ node, ...props }) => <td className="px-4 py-3 text-foreground/70" {...props} />,
                        }}
                      >
                        {currentAnalysis}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-end w-full gap-3">
            {currentAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy()}
                className="h-10 px-4 rounded-full"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy Result"}
              </Button>
            )}
            {view === "detail" && !selectedAnalysis && onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={status === "PROCESSING"}
                className="h-10 px-4 rounded-full"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", status === "PROCESSING" && "animate-spin")} />
                {status === "COMPLETED" ? "Re-analyze" : "Refresh"}
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="h-10 px-6 rounded-full">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
