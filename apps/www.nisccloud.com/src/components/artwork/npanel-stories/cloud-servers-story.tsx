import { Check, Cpu, HardDrive, MapPin, Server, Terminal } from "lucide-react";
import { Meter, NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StatusLine, StoryRows, StoryStat } from "./story-ui.tsx";

const STEPS = ["Choose configuration", "Confirm location", "Provision server", "Monitor instance"] as const;

export function CloudServersStory({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return (
    <StoryShell
      title="cloud server"
      label="Cloud server workflow in nPanel, from configuration to a running instance"
      steps={STEPS}
      active={active}
      compact={compact}
      tone="midnight"
    >
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="cloud-servers/new" active="cloud" title="Configure cloud server" subtitle="Choose resources for your workload">
              <div className="grid gap-2 sm:grid-cols-3">
                <Panel title="Starter"><p className="text-[9px] text-muted-foreground">2 vCPU · 4 GB RAM</p></Panel>
                <Panel title="Scale" className="border-primary ring-2 ring-primary/15"><p className="text-[9px] text-muted-foreground">4 vCPU · 8 GB RAM</p><Pill tone="sky" className="mt-2">Selected</Pill></Panel>
                <Panel title="Compute"><p className="text-[9px] text-muted-foreground">8 vCPU · 16 GB RAM</p></Panel>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="cloud-servers/new" active="cloud" title="Select deployment region" subtitle="Choose an available location">
              <div className="grid gap-2 sm:grid-cols-2">
                <Panel className="flex items-center gap-3 border-primary ring-2 ring-primary/15"><MapPin className="size-5 text-primary" /><span className="min-w-0 flex-1"><b className="block text-[11px]">Los Angeles</b><span className="text-[9px] text-muted-foreground">Available region</span></span><Check className="size-4 text-primary" /></Panel>
                <Panel className="flex items-center gap-3 opacity-70"><MapPin className="size-5 text-muted-foreground" /><span><b className="block text-[11px]">Additional regions</b><span className="text-[9px] text-muted-foreground">Subject to plan availability</span></span></Panel>
              </div>
              <div className="mt-3 text-right"><UiButton>Provision server</UiButton></div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="cloud-servers/northstar-api" active="cloud" title="Provisioning northstar-api" subtitle="Preparing compute and secure access">
              <Panel title="Deployment progress" icon={Server}>
                <StoryRows active={2} rows={[
                  { label: "Reserve resources", detail: "4 vCPU · 8 GB RAM" },
                  { label: "Install operating system", detail: "Ubuntu LTS" },
                  { label: "Configure network", detail: "Private keys retained by customer" },
                  { label: "Start instance", detail: "Final health check" },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="cloud-servers/northstar-api" active="cloud" title="northstar-api" subtitle="198.51.100.42" action={<Pill tone="green">Running</Pill>}>
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="vCPU" value="4" detail="Allocated" />
                <StoryStat label="Memory" value="8 GB" detail="Allocated" />
                <StoryStat label="Region" value="Los Angeles" detail="Available" />
              </div>
              <Panel className="mt-2 space-y-2" title="Current usage" icon={Cpu}>
                <Meter label="CPU" value={34} detail="34%" />
                <Meter label="Memory" value={52} detail="4.2 GB" tone="green" />
                <Meter label="Storage" value={41} detail="33 GB" tone="amber" />
              </Panel>
              <div className="mt-2 flex items-center justify-between"><StatusLine tone="green">All systems healthy</StatusLine><span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary"><Terminal className="size-3" /> Open terminal</span></div>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
