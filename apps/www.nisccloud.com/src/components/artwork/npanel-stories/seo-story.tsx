import { AlertTriangle, CheckCircle2, FileSearch, Search, TrendingUp } from "lucide-react";
import { Meter, NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StoryRows, StoryStat } from "./story-ui.tsx";

const STEPS = ["Start site audit", "Review technical issues", "Find search opportunities", "Share the report"] as const;

export function SeoStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="SEO"
      label="SEO workflow in nPanel, from technical audit to a clear sample report"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="light"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="seo-suite/new" active="seo" title="Create site audit" subtitle="Northstar Studio">
              <Panel title="Website to review" icon={FileSearch} className="mx-auto max-w-md">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"><Search className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate text-[10px] font-medium">https://northstar.example</span></div>
                <div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-muted-foreground">Technical, content and indexability checks</span><UiButton>Run audit</UiButton></div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="seo-suite/northstar/issues" active="seo" title="Technical review" subtitle="Sample audit findings">
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="Reviewed" value="42" detail="Pages" />
                <StoryStat label="Priority" value="3" detail="Issues" />
                <StoryStat label="Passed" value="31" detail="Checks" />
              </div>
              <Panel className="mt-2 overflow-hidden p-0">
                <StoryRows rows={[
                  { label: "Missing page descriptions", detail: "3 pages", status: <Pill tone="amber">Review</Pill> },
                  { label: "Broken internal links", detail: "2 links", status: <Pill tone="rose">Fix</Pill> },
                  { label: "Indexability checks", detail: "Passed", status: <Pill tone="green">Healthy</Pill> },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="seo-suite/northstar/opportunities" active="seo" title="Search opportunities" subtitle="Prioritised by relevance and intent">
              <div className="grid gap-2 sm:grid-cols-2">
                <Panel title="Priority topics" icon={TrendingUp}><StoryRows rows={[
                  { label: "Cloud operations guide", detail: "Informational intent" },
                  { label: "Managed hosting comparison", detail: "Commercial intent" },
                  { label: "Business email setup", detail: "Practical intent" },
                ]} /></Panel>
                <Panel title="Content readiness"><Meter label="Technical foundation" value={76} /><div className="mt-3"><Meter label="Coverage" value={58} tone="green" /></div><p className="mt-3 text-[8px] text-muted-foreground">Sample planning indicators, not ranking guarantees.</p></Panel>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="seo-suite/northstar/report" active="seo" title="Monthly search report" subtitle="Clear work completed and next priorities" action={<Pill tone="sky">Ready</Pill>}>
              <Panel className="flex items-center gap-3 border-primary/25">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></span>
                <span className="min-w-0 flex-1"><b className="block text-[11px]">Report prepared</b><span className="text-[9px] text-muted-foreground">Audit, approved changes and next actions in one view.</span></span>
                <UiButton variant="outline">View report</UiButton>
              </Panel>
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-[8px] text-amber-800 dark:text-amber-200"><AlertTriangle className="mt-0.5 size-3 shrink-0" /> Search outcomes vary; this interface does not promise rankings or AI citations.</div>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
