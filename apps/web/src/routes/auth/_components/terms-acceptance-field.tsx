"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

type TermsAcceptanceFieldProps<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  id?: string;
};

export function TermsAcceptanceField<T extends FieldValues>({
  field,
  id = "accept-terms",
}: TermsAcceptanceFieldProps<T>) {
  return (
    <FormItem className="flex flex-row items-start gap-2 space-y-0">
      <FormControl>
        <Checkbox
          id={id}
          checked={field.value === true}
          onCheckedChange={(checked) => field.onChange(checked === true)}
          aria-required="true"
          className="mt-0.5 size-4 shrink-0"
        />
      </FormControl>
      <div className="min-w-0 flex-1 space-y-1">
        <FormLabel
          htmlFor={id}
          className="text-muted-foreground !block cursor-pointer text-sm leading-relaxed font-normal"
        >
          <span className="text-destructive font-medium" aria-hidden="true">
            *{" "}
          </span>
          By signing up, I confirm that I accept the{" "}
          <a
            href="https://nisccloud.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Terms and Conditions
          </a>
          .
        </FormLabel>
        <FormMessage />
      </div>
    </FormItem>
  );
}
