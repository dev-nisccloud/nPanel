import { ArrowRight, CheckCircle2, Mail, Route, Users } from "lucide-react";
import { NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StatusLine, StoryRows, StoryStat } from "./story-ui.tsx";

const STEPS = ["Add mailbox", "Match licences to people", "Verify mail routing", "Manage the team"] as const;

export function BusinessEmailStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="business email"
      label="Business email workflow in nPanel, including a sample hybrid licence mix"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="sky"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="email/northstar/mailboxes" active="email" title="Create mailbox" subtitle="northstar.example">
              <Panel title="New team mailbox" icon={Mail} className="mx-auto max-w-md">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-lg border border-primary/30 bg-background px-3 py-2 text-[10px]"><b>maya</b><span className="text-muted-foreground">@northstar.example</span></div>
                  <UiButton>Create mailbox</UiButton>
                </div>
                <p className="mt-2 text-[8px] text-muted-foreground">Access details are delivered securely and are never shown in this story.</p>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="email/northstar/licences" active="email" title="Match tools to the team" subtitle="Sample hybrid email plan">
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="Nisc Mail" value="8" detail="Email-focused" />
                <StoryStat label="Microsoft 365" value="3" detail="Collaboration" />
                <StoryStat label="Google Workspace" value="1" detail="Specialist" />
              </div>
              <Panel className="mt-2" title="Licence allocation" icon={Users}><p className="text-[9px] leading-relaxed text-muted-foreground">Keep premium collaboration licences where they add value and use Nisc Mail for email-focused roles. Final routing is verified before migration.</p></Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="email/northstar/routing" active="email" title="Verify mail routing" subtitle="One domain, agreed destinations">
              <Panel title="Routing checks" icon={Route}>
                <StoryRows active={3} rows={[
                  { label: "Domain authentication", detail: "SPF, DKIM and DMARC reviewed" },
                  { label: "Mailbox destinations", detail: "12 recipients mapped" },
                  { label: "Delivery test", detail: "Inbound and outbound sample passed" },
                  { label: "Migration window", detail: "Ready for customer approval" },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="email/northstar" active="email" title="Business email" subtitle="northstar.example" action={<Pill tone="green">Managed</Pill>}>
              <Panel className="overflow-hidden p-0">
                <StoryRows rows={[
                  { label: "maya@northstar.example", detail: "Nisc Mail", status: <StatusLine tone="green">Active</StatusLine> },
                  { label: "ops@northstar.example", detail: "Microsoft 365", status: <StatusLine tone="green">Active</StatusLine> },
                  { label: "studio@northstar.example", detail: "Google Workspace", status: <StatusLine tone="green">Active</StatusLine> },
                ]} />
              </Panel>
              <div className="mt-2 flex items-center justify-between"><span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-3" /> Routing verified</span><span className="text-[9px] font-semibold text-primary">Manage mailboxes <ArrowRight className="inline size-3" /></span></div>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
