import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

const CREDENTIALS = [
  {
    src: "/accreditation/communications-authority-of-kenya.jpg",
    alt: "Communications Authority of Kenya",
    width: 61,
    label: "CA licensed",
    short: "Licensed",
    full: "Licensed by the Communications Authority of Kenya",
  },
  {
    src: "/accreditation/kenic.svg",
    alt: "KeNIC",
    width: 35,
    label: "KeNIC accredited",
    short: "Accredited",
    full: "KeNIC-accredited .ke domain registrar",
  },
  {
    src: "/accreditation/odpc.png",
    alt: "Office of the Data Protection Commissioner",
    width: 20,
    label: "ODPC registered",
    short: "Registered",
    full: "Registered with the Office of the Data Protection Commissioner",
  },
] as const;

type Credential = (typeof CREDENTIALS)[number];

function CredentialItems({ items, tight = false }: { items: readonly Credential[]; tight?: boolean }) {
  return (
    <>
      <span className="sr-only">{items.map((item) => item.full).join(". ")}.</span>
      <span aria-hidden className="flex min-w-0 items-center divide-x divide-current/15">
        {items.map((item) => (
          <span key={item.alt} className={cn("flex min-w-0 items-center gap-1 first:pl-0", tight ? "px-1.5 sm:px-2" : "px-1.5")}>
            <span className="flex h-6 shrink-0 items-center rounded-full bg-white px-2">
              <img
                src={item.src}
                alt=""
                width={item.width}
                height={16}
                className="h-4 object-contain"
                style={{ width: Math.round(item.width * 0.8) }}
                decoding="async"
              />
            </span>
            {tight ? (
              <span className="min-w-0 whitespace-nowrap">
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            ) : (
              <span className="min-w-0 whitespace-nowrap">{item.label}</span>
            )}
          </span>
        ))}
      </span>
    </>
  );
}

/**
 * Static trust evidence. Both credentials are always visible so visitors never
 * have to wait for a rotation to understand Nisc Cloud's status.
 */
export function HeroCredentials({ className, delay = 0 }: { className: string; delay?: number }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`hero-badge relative mb-7 inline-flex max-w-[calc(100vw-2rem)] items-center rounded-full border p-0.5 text-[10px] font-medium backdrop-blur-sm ${className}`}
    >
      <CredentialItems items={CREDENTIALS.slice(0, 2)} />
    </motion.div>
  );
}

/** The same pill with all three credentials, for the footer. */
export function FooterCredentials({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/[0.04] p-0.5 text-[10px] font-medium text-slate-300 sm:text-[11px]",
        className,
      )}
    >
      <CredentialItems items={CREDENTIALS} tight />
    </div>
  );
}
