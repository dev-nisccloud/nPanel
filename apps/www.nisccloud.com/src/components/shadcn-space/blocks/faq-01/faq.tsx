import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type FaqBlockItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  label: string;
  items: FaqBlockItem[];
};

export type FaqBlockProps = {
  faqs?: FaqBlockItem[];
  categories?: FaqCategory[];
  badge?: string;
  title?: string;
  defaultCategory?: string;
};

const delayClasses = [
  "delay-100",
  "delay-200",
  "delay-300",
  "delay-400",
  "delay-500",
  "delay-600",
  "delay-700",
  "delay-800",
];

function FaqAccordion({ faqs }: { faqs: FaqBlockItem[] }) {
  return (
    <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={faq.question}
          value={`item-${index}`}
          className={cn(
            "group/item overflow-hidden rounded-xl border border-border bg-card transition-colors data-[state=open]:bg-accent",
            "animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
            delayClasses[index] ?? "delay-500",
          )}
        >
          <AccordionTrigger className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-4 text-left text-base font-medium hover:no-underline md:text-[17px] [&>svg:last-child]:hidden">
            <span className="min-w-0 flex-1 pr-2">{faq.question}</span>
            <PlusIcon
              aria-hidden
              className="pointer-events-none h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]/item:rotate-45"
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function Faq({
  faqs = [],
  categories,
  badge,
  title = "Got questions? We've got answers ready",
  defaultCategory = "General",
}: FaqBlockProps) {
  const initialCategory =
    categories?.find((category) => category.label === defaultCategory)?.label ??
    categories?.[0]?.label ??
    "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const activeFaqs =
    categories?.find((category) => category.label === activeCategory)?.items ?? faqs;

  return (
    <section className="border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:px-8">
        <div className="flex animate-in fade-in slide-in-from-top-10 flex-col items-center gap-3 duration-1000 ease-in-out fill-mode-both delay-100">
          {badge ? (
            <Badge
              variant="outline"
              className="h-auto border-0 px-3 py-1 text-xs outline outline-border"
            >
              {badge}
            </Badge>
          ) : null}
          <h2 className="max-w-2xl text-center text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h2>
        </div>

        {categories && categories.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => setActiveCategory(category.label)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                    activeCategory === category.label
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FaqAccordion faqs={activeFaqs} />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div>
            <FaqAccordion faqs={activeFaqs} />
          </div>
        )}
      </div>
    </section>
  );
}
