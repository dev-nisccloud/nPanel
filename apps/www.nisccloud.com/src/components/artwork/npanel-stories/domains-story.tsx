import { ArrowRight, Check, Globe2, Search } from "lucide-react";
import { NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StatusLine, StoryRows } from "./story-ui.tsx";

const STEPS = ["Search a domain", "Check availability", "Prepare the service", "Manage domain and DNS"] as const;

export function DomainsStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="domains"
      label="Domain workflow in nPanel, from search to DNS-ready portfolio"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="light"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="domains/search" active="domains" title="Find your domain" subtitle="Search registration and transfer options">
              <Panel className="mx-auto max-w-md">
                <p className="mb-2 text-[9px] font-medium text-muted-foreground">Domain name</p>
                <div className="flex gap-2 rounded-lg border border-primary/40 bg-background p-1.5 ring-2 ring-primary/10">
                  <Search className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">northstar.example</span>
                  <UiButton>Search</UiButton>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[9px] text-muted-foreground">
                  <span>.co.ke</span><span>.com</span><span>.africa</span>
                </div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="domains/search" active="domains" title="Search results" subtitle="Live registry checks">
              <div className="space-y-2">
                <Panel className="flex items-center gap-3 border-emerald-500/30">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><Check className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">northstar.example</span><StatusLine tone="green">Available</StatusLine></span>
                  <UiButton>Continue</UiButton>
                </Panel>
                <Panel className="flex items-center gap-3 opacity-75">
                  <Globe2 className="size-5 text-muted-foreground" />
                  <span className="min-w-0 flex-1 text-[10px] font-medium">northstar-studio.example</span>
                  <Pill tone="sky">Alternative</Pill>
                </Panel>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="domain-transfer" active="domains" title="Prepare domain" subtitle="Registration or transfer">
              <Panel title="Transfer checklist" hint="No DNS changes are made until you confirm">
                <StoryRows active={2} rows={[
                  { label: "Domain unlocked", detail: "Registrar lock checked" },
                  { label: "Authorisation code", detail: "EPP code ready" },
                  { label: "DNS records saved", detail: "Existing records prepared" },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="domains" active="domains" title="Domain portfolio" subtitle="Northstar Studio">
              <Panel className="overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-border/70 p-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Globe2 className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">northstar.example</span><StatusLine tone="green">Active · DNS ready</StatusLine></span>
                  <Pill tone="green">Managed</Pill>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 text-[9px]">
                  <span><b className="block text-foreground">DNS</b><span className="text-muted-foreground">4 records</span></span>
                  <span><b className="block text-foreground">Renewal</b><span className="text-muted-foreground">Auto-renew on</span></span>
                  <span className="text-right font-semibold text-primary">Manage <ArrowRight className="inline size-3" /></span>
                </div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
