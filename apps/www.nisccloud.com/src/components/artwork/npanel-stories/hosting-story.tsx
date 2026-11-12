import { Database, FileText, Globe2, Mail, ShieldCheck, Wrench } from "lucide-react";
import { KeyValues, NpanelWindow, Panel, Pill, TabStrip } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StatusLine, StoryRows, StoryStat } from "./story-ui.tsx";

const STEPS = ["Review service", "Check DNS", "Open hosting tools", "Service ready"] as const;

export function HostingStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="hosting"
      label="Hosting management in nPanel, from service overview to connected tools"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="sky"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="hosting/northstar" active="hosting" title="Business Hosting" subtitle="northstar.example" action={<Pill tone="green">Active</Pill>}>
              <TabStrip active={0} tabs={[["Overview","Service"],["DNS","Records"],["Mail","Inboxes"],["Files","Storage"]]} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Panel title="Service overview" icon={Globe2}><KeyValues rows={[["Plan","Business"],["Domain","northstar.example"],["Server IP","192.0.2.24"],["SSL","Active"]]} /></Panel>
                <Panel title="Security" icon={ShieldCheck}><StatusLine tone="green">SSL and backups healthy</StatusLine><p className="mt-2 text-[9px] text-muted-foreground">Last backup: sample timestamp</p></Panel>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="hosting/northstar/dns" active="hosting" title="DNS records" subtitle="northstar.example">
              <TabStrip active={1} tabs={[["Overview","Service"],["DNS","Records"],["Mail","Inboxes"],["Files","Storage"]]} />
              <Panel className="overflow-hidden p-0">
                <StoryRows rows={[
                  { label: "A · @", detail: "192.0.2.24", status: <Pill tone="green">Valid</Pill> },
                  { label: "CNAME · www", detail: "northstar.example", status: <Pill tone="green">Valid</Pill> },
                  { label: "TXT · _dmarc", detail: "Policy configured", status: <Pill tone="sky">Protected</Pill> },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="hosting/northstar/tools" active="hosting" title="Hosting tools" subtitle="Open the tool you need">
              <div className="grid grid-cols-2 gap-2">
                {[[Mail,"Mailboxes","3 active"],[FileText,"File manager","Site files"],[Database,"Databases","2 connected"],[Wrench,"WordPress","Managed install"]].map(([Icon,label,detail]) => {
                  const ToolIcon = Icon as typeof Mail;
                  return <Panel key={String(label)} className="flex items-center gap-2"><ToolIcon className="size-4 text-primary" /><span><b className="block text-[10px]">{String(label)}</b><span className="text-[8px] text-muted-foreground">{String(detail)}</span></span></Panel>;
                })}
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="hosting/northstar" active="hosting" title="Business Hosting" subtitle="Everything connected" action={<Pill tone="green">Healthy</Pill>}>
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="Websites" value="1" detail="Online" />
                <StoryStat label="Mailboxes" value="3" detail="Active" />
                <StoryStat label="Backups" value="Daily" detail="Available" />
              </div>
              <Panel className="mt-2 flex items-center gap-3 border-emerald-500/25">
                <ShieldCheck className="size-6 text-emerald-600" />
                <span><b className="block text-[11px]">Service ready</b><span className="text-[9px] text-muted-foreground">DNS, SSL, mail and hosting tools are connected.</span></span>
              </Panel>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
