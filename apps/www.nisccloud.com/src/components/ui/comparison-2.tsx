import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

type ChatSide = "them" | "us";

type ChatMessage = {
  side: ChatSide;
  text: string;
};

const messages: ChatMessage[] = [
  {
    side: "them",
    text: "We're paying separate teams for hosting, email, and marketing.",
  },
  {
    side: "us",
    text: "That's usually three bills, and no one who owns the full picture.",
  },
  {
    side: "them",
    text: "When something breaks, everyone points at someone else.",
  },
  {
    side: "us",
    text: "We put domains, hosting, and growth under one roof. One team. Clear ownership.",
  },
  {
    side: "them",
    text: "And the brand still looks different on every channel…",
  },
  {
    side: "us",
    text: "One plan keeps your brand consistent, with local support that understands Kenyan business.",
  },
];

function TypingDots({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-current opacity-70"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function ChatBubble({
  message,
  index,
  reduceMotion,
}: {
  message: ChatMessage;
  index: number;
  reduceMotion: boolean;
}) {
  const isUs = message.side === "us";
  const delay = reduceMotion ? 0 : 0.2 + index * 0.55;

  return (
    <motion.div
      className={cn("flex w-full", isUs ? "justify-end" : "justify-start")}
      initial={reduceMotion ? false : { opacity: 0, x: isUs ? 36 : -36, y: 10, scale: 0.94 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 26,
        mass: 0.85,
        delay,
      }}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 sm:max-w-[78%]",
          isUs ? "items-end" : "items-start",
        )}
      >
        <motion.span
          className="px-1 text-[11px] font-medium tracking-wide text-muted-foreground"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay }}
        >
          {isUs ? "Nisc Cloud" : "You"}
        </motion.span>

        <div className="relative">
          {!reduceMotion && (
            <motion.div
              className={cn(
                "absolute bottom-0 z-10 rounded-2xl px-3.5 py-2.5 text-muted-foreground",
                isUs
                  ? "right-0 rounded-br-md bg-primary/15"
                  : "left-0 rounded-bl-md border border-border bg-card",
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.96] }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: Math.max(delay - 0.5, 0),
                times: [0, 0.12, 0.72, 1],
              }}
              aria-hidden
            >
              <TypingDots reduceMotion={reduceMotion} />
            </motion.div>
          )}

          <motion.div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUs
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md border border-border bg-card text-foreground",
            )}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 24,
              delay: reduceMotion ? 0 : delay,
            }}
          >
            {message.text}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

type ComparisonBlockProps = {
  /** On contact page: primary CTA scrolls to the form instead of linking to /contact */
  onContactPage?: boolean;
};

export default function ComparisonBlock({ onContactPage = false }: ComparisonBlockProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      className={cn(
        "w-full bg-background px-4 text-foreground md:px-8",
        onContactPage ? "border-t border-border/40 py-14 md:py-16" : "py-16 md:py-20",
      )}
    >
      <div className="mx-auto w-full max-w-2xl">
        <motion.div
          className={cn("text-center", onContactPage ? "mb-8" : "mb-10")}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sound familiar?
          </p>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tired of Paying Separate Teams?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            A conversation most growing teams have, and how it changes with Nisc
            Cloud.
          </p>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-3xl border border-border bg-muted/20 p-4 sm:p-6"
          aria-label="Conversation about switching to Nisc Cloud"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 flex items-center gap-2 border-b border-border/70 pb-4">
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="ml-2 text-xs text-muted-foreground">A familiar chat</span>
          </div>

          <div className="flex flex-col gap-5">
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.side}-${index}`}
                message={message}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.45,
            delay: reduceMotion ? 0 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild className="h-11 gap-2 rounded-xl px-6 font-semibold sm:min-w-48">
              {onContactPage ? (
                <a href="#contact-form">
                  Send us a message
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              ) : (
                <Link to="/contact">
                  Talk to us. It is free.
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </Button>
            <Button
              asChild
              variant="secondary"
              className="h-11 gap-2 rounded-xl px-6 font-semibold sm:min-w-48"
            >
              <Link to="/services">
                See why teams switch
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {onContactPage
              ? "No pressure. Tell us what you need and we’ll map a simple next step."
              : "No pressure. We will map a simple plan for your business in about 30 minutes."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
