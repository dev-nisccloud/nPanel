import { BuildGoalArt, GrowGoalArt, RunGoalArt, ZepoGoalArt } from "@/components/artwork/goal-art.tsx";

type GoalKind = "hosting" | "marketing" | "ai" | "build";

export function GoalArtwork({ kind }: { kind: GoalKind }) {
  if (kind === "hosting") return <RunGoalArt />;
  if (kind === "build") return <BuildGoalArt />;
  if (kind === "marketing") return <GrowGoalArt />;
  return <ZepoGoalArt />;
}
