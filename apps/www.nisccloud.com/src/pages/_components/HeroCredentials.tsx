import { motion, useReducedMotion } from "motion/react";

const CREDENTIALS = [
  {
    src: "/accreditation/communications-authority-of-kenya.jpg",
    alt: "Communications Authority of Kenya",
    width: 61,
    short: "Licensed by the CA",
    full: "Licensed by the Communications Authority of Kenya",
  },
  {
    src: "/accreditation/kenic.svg",
    alt: "KeNIC",
    width: 35,
    short: "KeNIC-accredited registrar",
    full: "KeNIC-accredited .ke domain registrar",
  },
] as const;

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
      <span className="sr-only">
        Licensed by the Communications Authority of Kenya and KeNIC-accredited .ke domain registrar.
      </span>
      <span aria-hidden className="flex min-w-0 items-center divide-x divide-current/15">
        {CREDENTIALS.map((item) => (
          <span key={item.alt} className="flex min-w-0 items-center gap-1 px-1.5 first:pl-0">
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
            <span className="min-w-0 whitespace-nowrap">
              {item.alt === "KeNIC" ? "KeNIC accredited" : "CA licensed"}
            </span>
          </span>
        ))}
      </span>
    </motion.div>
  );
}
