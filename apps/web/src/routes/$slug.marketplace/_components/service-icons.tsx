"use client";

import * as React from "react";
import { Icons } from "@/components/icons";
import { Sparkles, TrendingUp, Palette, Wand2 } from "lucide-react";

type IconConfig = {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
};

export const SERVICE_ICON_MAP: Record<string, IconConfig> = {
  "website-hosting": { Icon: Icons.Hosting, bg: "bg-emerald-500" },
  "vps-hosting":     { Icon: Icons.Database, bg: "bg-blue-500" },
  "business-email":  { Icon: Icons.Mail,     bg: "bg-violet-500" },
  "email-marketing": { Icon: Icons.EmailMarketing, bg: "bg-orange-500" },
  "background-remover":  { Icon: Wand2,     bg: "bg-pink-500" },
  "ai-image-generator":  { Icon: Sparkles,  bg: "bg-purple-500" },
  "seo":             { Icon: Icons.Seo,     bg: "bg-teal-500" },
  "media-buying":    { Icon: TrendingUp,    bg: "bg-rose-500" },
  "creatives-design":{ Icon: Palette,       bg: "bg-amber-500" },
};

export function getServiceIconConfig(slug: string): IconConfig {
  return SERVICE_ICON_MAP[slug] ?? { Icon: Icons.Site, bg: "bg-slate-500" };
}
