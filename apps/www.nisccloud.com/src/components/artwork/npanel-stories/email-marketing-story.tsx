import { BarChart3, CheckCircle2, Mail, Send, Users } from "lucide-react";
import { Meter, NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StoryRows, StoryStat } from "./story-ui.tsx";

const STEPS = ["Choose audience", "Build campaign", "Review and send", "Read the report"] as const;

export function EmailMarketingStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="email marketing"
      label="Email marketing workflow in nPanel, from a sample audience to aggregate reporting"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="light"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="email-marketing/audiences" active="marketing" title="Choose audience" subtitle="Consent-based sample contacts">
              <div className="grid gap-2 sm:grid-cols-2">
                <Panel className="border-primary ring-2 ring-primary/15" title="Active subscribers" icon={Users}><p className="text-xl font-bold">1,240</p><p className="text-[8px] text-muted-foreground">Fictional aggregate sample</p><Pill tone="sky" className="mt-2">Selected</Pill></Panel>
                <Panel title="Recent customers" icon={Users}><p className="text-xl font-bold">186</p><p className="text-[8px] text-muted-foreground">Eligible sample segment</p></Panel>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="email-builder/autumn-update" active="marketing" title="Campaign builder" subtitle="Northstar product update">
              <div className="grid gap-2 sm:grid-cols-[.8fr_1.2fr]">
                <Panel title="Content blocks" icon={Mail}><StoryRows rows={[
                  { label: "Header", detail: "Brand and subject" },
                  { label: "Feature story", detail: "Product update" },
                  { label: "Call to action", detail: "Read the update" },
                ]} /></Panel>
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="h-12 bg-primary/15 p-3 text-[10px] font-bold text-primary">NORTHSTAR</div>
                  <div className="space-y-2 p-3"><div className="h-2 w-2/3 rounded bg-foreground/80" /><div className="h-1.5 w-full rounded bg-muted" /><div className="h-1.5 w-5/6 rounded bg-muted" /><UiButton>Read the update</UiButton></div>
                </div>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="email-marketing/review" active="marketing" title="Final review" subtitle="Approval required before sending">
              <Panel title="Pre-send checks" icon={Send}>
                <StoryRows active={3} rows={[
                  { label: "Audience selected", detail: "Active subscribers" },
                  { label: "Sender authenticated", detail: "Domain checks passed" },
                  { label: "Unsubscribe link", detail: "Included" },
                  { label: "Test email", detail: "Approved" },
                ]} />
              </Panel>
              <div className="mt-2 text-right"><UiButton>Send campaign</UiButton></div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="email-marketing/reports/autumn-update" active="marketing" title="Campaign report" subtitle="Aggregate sample data" action={<Pill tone="green">Sent</Pill>}>
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="Delivered" value="98.4%" detail="Sample" />
                <StoryStat label="Opened" value="44.1%" detail="Sample" />
                <StoryStat label="Clicked" value="8.7%" detail="Sample" />
              </div>
              <Panel className="mt-2" title="Engagement" icon={BarChart3}>
                <Meter label="Delivered" value={98} tone="green" />
                <div className="mt-2"><Meter label="Opened" value={44} /></div>
              </Panel>
              <p className="mt-2 inline-flex items-center gap-1 text-[8px] text-muted-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> Reporting is aggregate and fictional; no customer audience data is shown.</p>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
