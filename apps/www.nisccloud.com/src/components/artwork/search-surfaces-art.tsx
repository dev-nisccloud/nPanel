import { MapPin, MessageSquareText, Navigation, Phone, Search } from "lucide-react";

import { cn } from "@/lib/utils.ts";
import { useArtLive } from "./use-art-live.ts";

function Surface({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 text-[#02070A] shadow-[0_18px_40px_-20px_rgb(2_7_10/0.45)] ring-1 ring-black/5", className)}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0b7cc0]">{label}</p>
      {children}
    </div>
  );
}

function Line({ w, tone = "bg-slate-200" }: { w: string; tone?: string }) {
  return <span className={cn("block h-2 rounded-full", tone)} style={{ width: w }} />;
}

/** One business found three ways: an ordinary search result, a Maps listing and an AI answer. */
export function SearchSurfacesArt() {
  const { ref, live } = useArtLive<HTMLElement>();
  return (
    <figure
      ref={ref}
      role="img"
      aria-label="Illustration: the same business appearing in a search result, on a map and as a source in an AI answer"
      className={cn(
        "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#38b6ff]/40 via-[#38b6ff]/15 to-[#fc734d]/15 p-5 sm:p-8 dark:from-[#38b6ff]/20 dark:via-[#38b6ff]/5 dark:to-[#fc734d]/10",
        live && "art-live",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div aria-hidden className="relative grid gap-4 sm:grid-cols-[1.15fr_1fr]">
        <Surface label="Search" className="ga-float sm:col-span-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
            <Search className="size-3.5 text-slate-500" />
            <span className="truncate text-xs font-medium">accountant for small business nairobi</span>
          </div>
          <div className="mt-3 space-y-1.5 rounded-xl border border-[#38b6ff]/40 bg-[#38b6ff]/[0.06] p-3">
            <p className="truncate text-[10px] text-slate-500">yourbusiness.com › services</p>
            <p className="text-sm font-semibold text-[#0b5d93]">Small business accounting in Nairobi</p>
            <Line w="92%" />
            <Line w="70%" />
          </div>
          <div className="mt-2 space-y-1.5 px-3 opacity-60">
            <Line w="40%" tone="bg-slate-300" />
            <Line w="85%" />
          </div>
        </Surface>

        <Surface label="Maps" className="ga-float-late">
          <div className="relative h-24 overflow-hidden rounded-xl bg-[#e8f4ec]">
            <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-white" />
            <span className="absolute inset-y-0 left-1/3 w-2 bg-white" />
            <span className="absolute left-[58%] top-[18%] size-8">
              <span className="ga-pulse absolute inset-0 rounded-full bg-[#fc734d]/40" />
              <span className="relative flex size-8 items-center justify-center rounded-full bg-[#fc734d] text-white shadow-md">
                <MapPin className="size-4" />
              </span>
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold">Your Business</p>
          <div className="mt-2 flex gap-1.5">
            {[Navigation, Phone].map((Icon, i) => (
              <span key={i} className="flex size-7 items-center justify-center rounded-full border border-slate-200">
                <Icon className="size-3.5 text-[#0b7cc0]" />
              </span>
            ))}
          </div>
        </Surface>

        <Surface label="AI answers" className="ga-float">
          <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-slate-100 px-3 py-2 text-[11px] font-medium">
            Who can do my business accounts?
          </div>
          <div className="mt-2 flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#02070A] text-white">
              <MessageSquareText className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 pt-1">
              <Line w="95%" />
              <Line w="75%" />
              <span className="inline-flex rounded-full border border-[#38b6ff]/50 bg-[#38b6ff]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0b5d93]">
                Source: yourbusiness.com
              </span>
            </div>
          </div>
        </Surface>
      </div>
    </figure>
  );
}
