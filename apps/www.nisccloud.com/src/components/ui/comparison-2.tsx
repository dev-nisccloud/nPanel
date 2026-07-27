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

  return (
    <motion.div
      className={cn("flex w-full", isUs ? "justify-end" : "justify-start")}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : Math.min(index * 0.08, 0.32),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 sm:max-w-[78%]",
          isUs ? "items-end" : "items-start",
        )}
      >
        <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {isUs ? "Nisc Cloud" : "You"}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUs
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border bg-card text-foreground",
          )}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}

export default function ComparisonBlock() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section className="w-full bg-background px-4 py-16 text-foreground md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <motion.div
          className="mb-10 text-center"
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

        <div
          className="relative overflow-hidden rounded-3xl border border-border bg-muted/20 p-4 sm:p-6"
          aria-label="Conversation about switching to Nisc Cloud"
        >
          {/* Soft top bar — like a chat header */}
          <div className="mb-5 flex items-center gap-2 border-b border-border/70 pb-4">
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="ml-2 text-xs text-muted-foreground">A familiar chat</span>
          </div>

          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.side}-${index}`}
                message={message}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.45,
            delay: reduceMotion ? 0 : 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild className="h-11 gap-2 rounded-xl px-6 font-semibold sm:min-w-48">
              <Link to="/contact">
                Talk to us. It is free.
                <ArrowRight className="size-4" aria-hidden />
              </Link>
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
            No pressure. We will map a simple plan for your business in about 30
            minutes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
