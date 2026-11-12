import { RunOnlineArt } from "@/components/artwork/npanel-art.tsx";
import {
  BrandWebFlagshipArt,
  SeoFlagshipArt,
} from "@/components/artwork/flagship-art.tsx";
import { ZeepoArt } from "@/components/artwork/growth-art.tsx";

type GoalKind = "hosting" | "marketing" | "ai" | "build";

export function GoalArtwork({ kind }: { kind: GoalKind }) {
  if (kind === "hosting") return <RunOnlineArt />;
  if (kind === "build") return <BrandWebFlagshipArt />;
  if (kind === "marketing") return <SeoFlagshipArt />;
  return <ZeepoArt />;
}
