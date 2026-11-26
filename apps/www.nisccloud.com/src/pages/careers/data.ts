import {
  ArrowLeftRight,
  CalendarHeart,
  Coffee,
  Handshake,
  Laptop,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

export type Opening = {
  id: string;
  slug: string;
  title: string;
  location: string;
  employmentType: string;
  summary: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  niceToHave: string | null;
  salaryRange: string | null;
  applyEmail: string;
  opensOn: string | null;
  closesOn: string | null;
};

export function formatDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Nairobi" });
}

/** One bullet per non-empty line; leading list markers are dropped. */
export function toBullets(value: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Handshake,
    title: "Mentors who answer",
    text: "Work next to senior people and leadership. Ask anything and get a straight answer.",
  },
  {
    icon: ArrowLeftRight,
    title: "Move across teams",
    text: "Curious about servers, design or campaigns? Move across Build, Run and Grow as you grow, without starting over somewhere else.",
  },
  {
    icon: CalendarHeart,
    title: "Time for life's big moments",
    text: "Extra paid leave for the moments that matter, like family events and celebrations.",
  },
  {
    icon: PartyPopper,
    title: "Team buildings and wins",
    text: "We celebrate launches and good months together, and get out of the office as a team.",
  },
  {
    icon: Coffee,
    title: "Tea and meals at the office",
    text: "Good conversations happen over a cup. Tea and meals are part of the day at our Nairobi office.",
  },
  {
    icon: Laptop,
    title: "Ready from day one",
    text: "A work laptop and the tools your role needs, so you can start on real work in your first week.",
  },
];
