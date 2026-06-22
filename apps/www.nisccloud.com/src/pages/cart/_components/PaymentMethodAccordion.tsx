import * as React from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { cn } from "@/lib/utils.ts";

export const MPESA_BRAND_GREEN = "#43B02A";

export function PaymentMethodAccordion({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "flex w-full flex-col gap-4 [&>[data-slot=accordion-item]]:border-b-0",
        className,
      )}
      value={value ?? undefined}
      onValueChange={(next) => onValueChange(next || null)}
    >
      {children}
    </Accordion>
  );
}

export function PaymentMethodOption({
  value,
  trigger,
  children,
  className,
}: {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-[box-shadow,border-color] duration-200",
        "before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-full before:opacity-0 before:transition-opacity",
        "hover:shadow-md border-border data-[state=open]:border-[var(--mpesa-brand)] data-[state=open]:before:bg-[var(--mpesa-brand)] data-[state=open]:before:opacity-100 data-[state=open]:ring-2 data-[state=open]:ring-[var(--mpesa-brand)]/15",
        className,
      )}
      style={{ "--mpesa-brand": MPESA_BRAND_GREEN } as React.CSSProperties}
    >
      {trigger}
      {children}
    </AccordionItem>
  );
}

export function PaymentMethodTrigger({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5 [&>svg]:ml-3 [&>svg]:size-8 [&>svg]:shrink-0 [&>svg]:rounded-full [&>svg]:border [&>svg]:border-border [&>svg]:bg-background [&>svg]:p-1.5 [&>svg]:text-muted-foreground group-data-[state=open]:[&>svg]:border-[var(--mpesa-brand)]/30 group-data-[state=open]:[&>svg]:text-[var(--mpesa-brand)]">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2"
          style={{
            backgroundColor: `${MPESA_BRAND_GREEN}12`,
            borderColor: `${MPESA_BRAND_GREEN}30`,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{description}</p>
        </div>
      </div>
    </AccordionTrigger>
  );
}

export function PaymentMethodContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionContent className={cn("px-0 pb-0", className)}>
      <div className="space-y-4 border-t border-border/60 bg-muted/25 px-4 pb-5 pt-4">
        {children}
      </div>
    </AccordionContent>
  );
}

export function MpesaPayButton({
  className,
  style,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("text-white hover:opacity-90 disabled:opacity-50", className)}
      style={{ backgroundColor: MPESA_BRAND_GREEN, ...style }}
      {...props}
    />
  );
}
