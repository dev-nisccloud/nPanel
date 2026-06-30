import Feature, { type FeatureItem } from "@/components/shadcn-space/blocks/feature-01/feature.tsx";
import {
  ClipboardList,
  LineChart,
  Rocket,
  Settings2,
  type LucideIcon,
} from "lucide-react";

type ProcessStep = {
  num: string;
  title: string;
  desc: string;
};

const PROCESS_ICONS: LucideIcon[] = [ClipboardList, Settings2, Rocket, LineChart];

function stepsToFeatureData(steps: ProcessStep[]): FeatureItem[] {
  return steps.map((step, index) => ({
    icon: PROCESS_ICONS[index % PROCESS_ICONS.length],
    title: `Step ${step.num.replace(/^0+/, "") || step.num}`,
    description: step.desc,
  }));
}

export function ProcessFeatureBlock({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="border-t border-border/40 bg-muted/10">
      <Feature
        title="Our Proven Process"
        description="A clear, step-by-step path from where you are now to where you want to be."
        featureData={stepsToFeatureData(steps)}
      />
    </div>
  );
}
