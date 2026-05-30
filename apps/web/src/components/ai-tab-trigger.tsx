"use client";

import { TabsTrigger } from "@/components/ui/tabs";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" />
      <path
        d="M20 3 L20.6 5.4 L23 6 L20.6 6.6 L20 9 L19.4 6.6 L17 6 L19.4 5.4 Z"
        opacity="0.65"
      />
    </svg>
  );
}

interface AiTabTriggerProps {
  value: string;
  label?: string;
}

/** AI Domain Search tab - sparkle icon only on this trigger; no animated border or color cycling. */
export function AiTabTrigger({ value, label = "AI Domain Search" }: AiTabTriggerProps) {
  return (
    <TabsTrigger value={value} className="inline-flex items-center gap-1.5">
      <SparkleIcon className="h-3 w-3 shrink-0" />
      {label}
    </TabsTrigger>
  );
}
