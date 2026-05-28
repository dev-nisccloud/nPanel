"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/** Safaricom / M-Pesa brand green (Pantone 361 C). */
export const MPESA_BRAND_GREEN = "#43B02A";

type PaymentMethodAccordionProps = {
  value: string | null;
  onValueChange: (value: string | null) => void;
  children: React.ReactNode;
  className?: string;
};

export function PaymentMethodAccordion({
  value,
  onValueChange,
  children,
  className,
}: PaymentMethodAccordionProps) {
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

type PaymentMethodOptionProps = {
  value: string;
  variant?: "mpesa" | "default";
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PaymentMethodOption({
  value,
  variant = "default",
  trigger,
  children,
  className,
}: PaymentMethodOptionProps) {
  const isMpesa = variant === "mpesa";

  return (
    <AccordionItem
      value={value}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-[box-shadow,border-color] duration-200",
        "before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-full before:opacity-0 before:transition-opacity",
        "hover:shadow-md",
        !isMpesa &&
          "border-border data-[state=open]:border-primary/35 data-[state=open]:before:bg-primary data-[state=open]:before:opacity-100 data-[state=open]:ring-2 data-[state=open]:ring-primary/10",
        isMpesa &&
          "border-border data-[state=open]:border-[var(--mpesa-brand)] data-[state=open]:before:bg-[var(--mpesa-brand)] data-[state=open]:before:opacity-100 data-[state=open]:ring-2 data-[state=open]:ring-[var(--mpesa-brand)]/15",
        className,
      )}
      style={
        isMpesa
          ? ({ "--mpesa-brand": MPESA_BRAND_GREEN } as React.CSSProperties)
          : undefined
      }
    >
      {trigger}
      {children}
    </AccordionItem>
  );
}

type PaymentMethodTriggerProps = {
  variant?: "mpesa" | "default";
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function PaymentMethodTrigger({
  variant = "default",
  icon,
  title,
  description,
}: PaymentMethodTriggerProps) {
  const isMpesa = variant === "mpesa";

  return (
    <AccordionTrigger
      className={cn(
        "px-5 py-4 hover:no-underline",
        "[&>svg]:ml-3 [&>svg]:size-8 [&>svg]:shrink-0 [&>svg]:rounded-full [&>svg]:border [&>svg]:border-border [&>svg]:bg-background [&>svg]:p-1.5 [&>svg]:text-muted-foreground [&>svg]:transition-colors",
        !isMpesa && "group-data-[state=open]:[&>svg]:border-primary/30 group-data-[state=open]:[&>svg]:text-primary",
        isMpesa &&
          "group-data-[state=open]:[&>svg]:border-[var(--mpesa-brand)]/30 group-data-[state=open]:[&>svg]:text-[var(--mpesa-brand)]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2",
            !isMpesa && "border-border bg-muted/40",
          )}
          style={
            isMpesa
              ? {
                  backgroundColor: `${MPESA_BRAND_GREEN}12`,
                  borderColor: `${MPESA_BRAND_GREEN}30`,
                }
              : undefined
          }
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

type PaymentMethodContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function PaymentMethodContent({ children, className }: PaymentMethodContentProps) {
  return (
    <AccordionContent className={cn("px-0 pb-0", className)}>
      <div className="space-y-4 border-t border-border/60 bg-muted/25 px-5 pb-5 pt-4">
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
