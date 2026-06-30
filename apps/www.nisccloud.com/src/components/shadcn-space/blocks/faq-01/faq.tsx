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

export type FaqBlockProps = {
  faqs: FaqBlockItem[];
  badge?: string;
  title?: string;
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

export default function Faq({
  faqs,
  badge = "FAQs",
  title = "Got questions? We've got answers ready",
}: FaqBlockProps) {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:px-8 xl:py-24">
        <div className="flex animate-in fade-in slide-in-from-top-10 flex-col items-center gap-4 duration-1000 ease-in-out fill-mode-both delay-100">
          <Badge
            variant="outline"
            className="h-auto border-0 px-3 py-1 text-sm outline outline-border"
          >
            {badge}
          </Badge>
          <h2 className="max-w-lg text-center text-3xl font-medium sm:text-5xl">{title}</h2>
        </div>
        <div>
          <Accordion type="single" collapsible className="flex w-full flex-col gap-6">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className={cn(
                  "group/item overflow-hidden rounded-2xl border border-border bg-card transition-colors data-[state=open]:bg-accent",
                  "animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  delayClasses[index] ?? "delay-500",
                )}
              >
                <AccordionTrigger className="flex w-full cursor-pointer items-start justify-between gap-4 px-6 py-6 text-left text-xl font-medium hover:no-underline [&>svg:last-child]:hidden">
                  <span className="min-w-0 flex-1 pr-2">{faq.question}</span>
                  <PlusIcon
                    aria-hidden
                    className="pointer-events-none h-6 w-6 shrink-0 transition-transform duration-200 group-data-[state=open]/item:rotate-45"
                  />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0 text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
