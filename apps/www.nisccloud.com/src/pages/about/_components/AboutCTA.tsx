import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, CalendarClock, Check } from "lucide-react";
import { useArtLive } from "@/components/artwork/use-art-live.ts";
import { GlassCta } from "@/components/signature/index.ts";

const BRIEF = ["Your business and customers", "What you want to improve", "Where you are hosted today"];
const SLOTS = ["Tue 10:00", "Wed 14:30", "Thu 11:00"];

function StrategyCallArt() {
  const { ref, live } = useArtLive<HTMLDivElement>();
  const total = BRIEF.length + 2;
  const [step, setStep] = useState(total - 1);
  useEffect(() => {
    if (!live) {
      setStep(total - 1);
      return;
    }
    setStep(0);
    const id = window.setInterval(() => setStep((s) => (s + 1) % total), 1300);
    return () => window.clearInterval(id);
  }, [live, total]);
  const booked = step >= BRIEF.length + 1;
  return (
    <div ref={ref} aria-hidden className="relative">
      <div className="rounded-[24px] border border-white/60 bg-white p-5 text-[#02070A] shadow-[0_40px_80px_-40px_rgb(2_7_10_/_0.6)] dark:border-white/10 dark:bg-card dark:text-foreground">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#38b6ff]/15 text-[#38b6ff]">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Free strategy call</p>
            <p className="text-xs text-[#02070A]/60 dark:text-muted-foreground">30 minutes with our team</p>
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold text-[#02070A]/60 dark:text-muted-foreground">We will talk about</p>
        <ul className="mt-2 grid gap-2">
          {BRIEF.map((item, i) => {
            const done = step > i;
            return (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className={`grid size-5 place-items-center rounded-full transition-colors duration-300 ${done ? "bg-[#38b6ff] text-[#02070A]" : "border border-[#02070A]/15 dark:border-border"}`}>
                  {done ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                {item}
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs font-semibold text-[#02070A]/60 dark:text-muted-foreground">Pick a time</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SLOTS.map((slot, i) => {
            const chosen = step >= BRIEF.length && i === 1;
            return (
              <span
                key={slot}
                className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors duration-300 ${
                  chosen ? "border-[#38b6ff] bg-[#38b6ff] text-[#02070A]" : "border-[#02070A]/10 dark:border-border"
                }`}
              >
                {slot}
              </span>
            );
          })}
        </div>
      </div>
      <div className="absolute -bottom-3 -right-2">
        <AnimatePresence>
          {booked ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-2xl bg-[#02070A] px-4 py-3 text-sm font-semibold text-white shadow-xl"
            >
              <BadgeCheck className="size-4 text-[#38b6ff]" /> Call booked
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AboutCTA() {
  return (
    <GlassCta
      eyebrow="Work with us"
      title="Let's get your business online and growing"
      body={<p>Book a free strategy call. We will map clear hosting and marketing next steps for your business, with no pressure.</p>}
      action={{ label: "Book a free strategy call", to: "/contact" }}
      secondary={{ label: "Explore our services", to: "/services" }}
      art={<StrategyCallArt />}
      artLabel="Illustration of a free strategy call being booked"
    />
  );
}
